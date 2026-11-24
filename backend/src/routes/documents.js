import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getTrip, saveDoc, listDocs, removeDoc } from '../services/store.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
    cb(null, `${Date.now()}-${safe}`);
  }
});
const allowed = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, allowed.has(file.mimetype))
});

router.get('/:tripId/documents', async (req, res, next) => {
  try {
    const trip = await getTrip(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: await listDocs(req.params.tripId) });
  } catch (error) { next(error); }
});

router.post('/:tripId/documents', (req, res, next) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) return res.status(uploadError.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message: uploadError.message });
    try {
      const trip = await getTrip(req.params.tripId);
      if (!trip) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, message: 'Trip not found' });
      }
      if (!req.file) return res.status(400).json({ success: false, message: 'Choose a supported PDF, image or DOCX file (max 8 MB).' });
      const doc = await saveDoc({
        tripId: req.params.tripId,
        name: req.file.originalname,
        category: req.body.category || 'Other',
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size
      });
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      next(error);
    }
  });
});

router.delete('/document/:id', async (req, res, next) => {
  try {
    const doc = await removeDoc(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const filename = path.basename(doc.fileUrl || '');
    if (filename) fs.unlink(path.join(uploadDir, filename), () => {});
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) { next(error); }
});

export default router;
