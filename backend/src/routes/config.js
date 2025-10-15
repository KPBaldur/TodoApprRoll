const express = require('express');
const router = express.Router();
const { getConfig, setConfig } = require('../controllers/configController');

router.get('/', getConfig);
router.put('/', setConfig);
router.patch('/', setConfig);

module.exports = router;