const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
require('dotenv').config();

const REPO_DIR = path.resolve(process.env.IMG_REPO_DIR || 'repo/DatabaseImg');
const PARENT_DIR = path.dirname(REPO_DIR);
const BRANCH = process.env.GIT_BRANCH || 'main';

function makeAuthRemote() {
  const remote = process.env.GIT_REMOTE;
  const token = process.env.GIT_TOKEN;

  if (!remote || !token) {
    throw new Error('Missing GIT_REMOTE or GIT_TOKEN in .env');
  }

  const u = new URL(remote);
  u.username = token;
  u.password = '';

  return u.toString();
}

async function isGitRepo(dir) {
  try {
    const git = simpleGit(dir);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

async function initialCommitIfEmpty(dir) {
  const git = simpleGit(dir);

  const items = fs.readdirSync(dir).filter(n => n !== '.git');

  if (items.length === 0) {
    fs.writeFileSync(path.join(dir, '.gitkeep'), '');
    await git.add('.gitkeep');
    await git.commit('chore: initial commit');
  }
}

async function ensureRepo() {

  const authRemote = makeAuthRemote();

  if (!fs.existsSync(PARENT_DIR)) {
    fs.mkdirSync(PARENT_DIR, { recursive: true });
  }

  // ถ้า folder มีอยู่แล้วแต่เป็น submodule → ลบทิ้ง
  if (fs.existsSync(REPO_DIR)) {

    const gitModules = path.join(REPO_DIR, '.git');

    if (fs.existsSync(gitModules) && !fs.lstatSync(gitModules).isDirectory()) {

      console.log('⚠️ Removing broken git submodule...');

      fs.rmSync(REPO_DIR, { recursive: true, force: true });

    }

  }

  // clone repo ถ้ายังไม่มี
  if (!fs.existsSync(REPO_DIR)) {

    try {

      const g = simpleGit(PARENT_DIR);

      await g.clone(authRemote, REPO_DIR);

    } catch {

      fs.mkdirSync(REPO_DIR, { recursive: true });

      const g2 = simpleGit(REPO_DIR);

      await g2.init();

      await g2.addRemote('origin', authRemote).catch(() => {});

    }

  }

  // ถ้ามี folder แต่ไม่ใช่ git repo
  if (!(await isGitRepo(REPO_DIR))) {

    const g3 = simpleGit(REPO_DIR);

    await g3.init();

    await g3.addRemote('origin', authRemote).catch(() => {});

  }

  const git = simpleGit(REPO_DIR);

  if (process.env.GIT_USER) {
    await git.addConfig('user.name', process.env.GIT_USER);
  }

  if (process.env.GIT_EMAIL) {
    await git.addConfig('user.email', process.env.GIT_EMAIL);
  }

  await git.fetch(['origin']).catch(() => {});

  try {
    await git.checkout(BRANCH);
  } catch {
    await git.checkoutLocalBranch(BRANCH);
  }

  await git.pull('origin', BRANCH).catch(() => {});

  await initialCommitIfEmpty(REPO_DIR);

  await git.push(['-u', 'origin', BRANCH]).catch(() => {});

  return git;

}

async function commitAdd(fileRelPath, message) {

  const git = await ensureRepo();

  await git.add(fileRelPath);

  await git.commit(message || `Add ${fileRelPath}`);

  await git.push('origin', BRANCH);

}

async function commitRemove(fileRelPath, message) {

  const git = await ensureRepo();

  try {
    await git.rm(fileRelPath);
  } catch {}

  await git.commit(message || `Remove ${fileRelPath}`);

  await git.push('origin', BRANCH);

}

function toRawUrl(fileRelPath) {

  const parts = process.env.GIT_REMOTE.split('/');

  const user = parts[3];
  const repo = parts[4].replace('.git', '');

  return `https://raw.githubusercontent.com/${user}/${repo}/${BRANCH}/${fileRelPath.replace(/\\/g,'/')}`;

}

module.exports = {
  ensureRepo,
  commitAdd,
  commitRemove,
  toRawUrl,
  REPO_DIR
};