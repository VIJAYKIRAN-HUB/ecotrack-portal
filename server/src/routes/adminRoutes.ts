import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin endpoints with admin role check
router.use(authenticate, requireRole('admin'));

router.get('/overview', AdminController.getOverview);
router.get('/analytics', AdminController.getAnalytics);
router.get('/export-csv', AdminController.exportCsv);
router.get('/workers', AdminController.getWorkers);
router.post('/workers', AdminController.createWorker);
router.patch('/workers/:id/status', AdminController.updateWorkerStatus);
router.get('/duplicates', AdminController.getDuplicates);
router.post('/duplicates/confirm', AdminController.confirmDuplicate);
router.post('/duplicates/reject', AdminController.rejectDuplicate);
router.get('/activity-logs', AdminController.getActivityLogs);

export default router;
