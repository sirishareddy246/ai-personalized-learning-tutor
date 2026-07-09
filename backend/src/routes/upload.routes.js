const express = require('express');
const multer = require('multer');
const { uploadDocument, listDocuments } = require('../controllers/upload.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'pptx', 'ppt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Only PDF, DOCX, and PPTX files are allowed. Got: .${ext}`));
    }
  },
});

// Wrap multer to catch errors and return proper JSON
function multerSingle(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE')
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        return res.status(400).json({ error: err.message || 'File upload error.' });
      }
      if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
      next();
    });
  };
}

router.post('/upload', multerSingle('file'), uploadDocument);
router.get('/documents', listDocuments);

module.exports = router;

