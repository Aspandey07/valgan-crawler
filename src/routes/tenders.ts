import { Router } from 'express';
import { searchTenders, getTenderDetails, createTender } from '../controllers/tenders';
import { requireApiKey } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';

const upload = multer({ 
  dest: path.join(__dirname, '../../downloads/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf and .zip format allowed!'));
    }
  }
});

const router = Router();

router.use(requireApiKey);

router.get('/', searchTenders);
router.post('/', upload.single('document'), createTender);
router.get('/:id', getTenderDetails);

export default router;
