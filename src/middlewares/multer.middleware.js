import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // /tmp is the only writable directory in Google App Engine
    // It also exists on your Mac, so this works for both local and cloud.
    cb(null, '/tmp'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

export const upload = multer({ storage: storage });