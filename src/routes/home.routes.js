import { Router } from 'express';
import { getShopDetails } from '../controllers/shopDetails.controller.js';

const router = Router();

router.get('/', getShopDetails);

export default router;
