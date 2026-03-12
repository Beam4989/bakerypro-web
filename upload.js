// upload.js
const multer = require('multer');
const storage = multer.memoryStorage(); // เก็บในหน่วยความจำแล้วเขียนไฟล์เองnpm start
const upload = multer({ storage });
module.exports = upload;
