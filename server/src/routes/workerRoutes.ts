import { Router } from 'express';
import { WorkerController } from '../controllers/workerController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate, requireRole('worker'));

router.get('/tasks', WorkerController.getMyTasks);
router.get('/history', WorkerController.getTaskHistory);
router.post('/tasks/:id/in-progress', WorkerController.markInProgress);
router.post(
  '/tasks/:id/resolve',
  upload.single('afterPhoto'),
  WorkerController.resolveTask
);

export default router;
