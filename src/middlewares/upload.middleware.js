import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/resumes";

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${ext}`;
      console.log("✅ File storage:", uniqueName);
      cb(null, uniqueName);
    } catch (err) {
      console.error("❌ Storage error:", err);
      cb(err);
    }
  },
});

// Filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  const allowedExt = ['.pdf', '.docx', '.doc'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  console.log("🔍 File check - Name:", file.originalname, "Ext:", ext, "Mime:", file.mimetype);
  
  if (allowedExt.includes(ext) || allowedMimes.includes(file.mimetype)) {
    console.log("✅ File accepted");
    cb(null, true);
  } else {
    console.error("❌ File rejected - Format not allowed");
    cb(new Error('केवल PDF और DOCX फाइलें allowed हैं (Only PDF and DOCX files allowed)'), false);
  }
};

const uploadMiddleware = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log("✅ Upload middleware initialized");
export default uploadMiddleware;
