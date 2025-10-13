const express = require('express');
const router = express.Router();
const alarms = require('../controllers/alarmsController');

router.get('/', alarms.list);
router.post('/', alarms.add);
router.put('/:id', alarms.update);
router.delete('/:id', alarms.remove);

module.exports = router;