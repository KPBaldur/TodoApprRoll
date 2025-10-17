import express from 'express';
import alarms from '../controllers/alarmsController.js';

const router = express.Router();

router.get('/', alarms.list);
router.post('/', alarms.add);
router.put('/:id', alarms.update);
router.delete('/:id', alarms.remove);
// Registrar snooze
router.patch('/:id/snooze', alarms.snooze);

export default router;