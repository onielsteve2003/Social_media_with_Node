const multer = require("multer");
const path = require("path");

// Multer config
module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);  
    if (ext.toLocaleLowerCase() !== ".jpg" 
    && ext.toLocaleLowerCase() !== ".jpeg" 
    && ext.toLocaleLowerCase() !== ".png"
    && ext.toLocaleLowerCase() !== ".pdf"
    && ext.toLocaleLowerCase() !== ".docx"
    && ext.toLocaleLowerCase() !== ".txt"
    && ext.toLocaleLowerCase() !== ".csv"
    ) {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});