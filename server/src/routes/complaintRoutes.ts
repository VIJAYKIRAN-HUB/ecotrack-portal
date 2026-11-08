import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController.js';
import { authenticate, requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public/authenticated complaint listing
router.get('/', authenticate, ComplaintController.list);

// Check duplicate candidates
router.post('/check-duplicates', authenticate, ComplaintController.checkDuplicates);

// Dedicated image upload
router.post('/upload-image', authenticate, requireAuth, upload.single('photo'), ComplaintController.uploadImage);

// Create new complaint
router.post(
  '/',
  authenticate,
  requireAuth,
  upload.array('photos', 5),
  ComplaintController.create
);

// Detail, edit, delete
router.get('/:id', authenticate, ComplaintController.getById);
router.patch('/:id', authenticate, requireAuth, ComplaintController.edit);
router.delete('/:id', authenticate, requireAuth, ComplaintController.delete);

// Status and workflow actions
router.post('/:id/status', authenticate, requireAuth, ComplaintController.updateStatus);
router.post('/:id/assign', authenticate, requireRole('admin'), ComplaintController.assign);
router.post(
  '/:id/resolve',
  authenticate,
  requireAuth,
  upload.single('afterPhoto'),
  ComplaintController.resolve
);
router.post('/:id/reopen', authenticate, requireAuth, ComplaintController.reopen);

export default router;
