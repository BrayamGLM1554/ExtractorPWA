const multer = require('multer');

const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf',
];

const storage = multer.memoryStorage(); // Guardamos en memoria, no en disco

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Solo se aceptan archivos .docx o .pdf'), {
        status: 400,
      }),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
});

module.exports = upload;
