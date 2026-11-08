import { Router } from 'express';
import { MapController } from '../controllers/mapController.js';

const router = Router();

router.get('/points', MapController.getMapPoints);

export default router;
