import express from 'express';
import { getConfig, setConfig } from '../controllers/configController.js';

const router = express.Router();

router.get('/', getConfig);
router.put('/', setConfig);
router.patch('/', setConfig);

export default router;