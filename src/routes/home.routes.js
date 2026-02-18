import { Router } from 'express';
import { getShopDetails } from '../controllers/shopDetails.controller.js';

const router = Router();

router.get('/shopDetails', getShopDetails);

export default router;
