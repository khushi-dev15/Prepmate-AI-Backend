import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/resumes";

// ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}${ext}`);
  },
});

const uploadMiddleware = multer({ storage });

export default uploadMiddleware;
