
import multer from "multer";
import os from "os"; // <--- Import 'os' module

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ✅ FIX: Use os.tmpdir() to work on BOTH Windows and Cloud
    cb(null, os.tmpdir()); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

export const upload = multer({ storage: storage });