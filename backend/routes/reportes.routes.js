const express = require('express');
const router = express.Router();

const reportesController = require('../controllers/reportes.controller');
const { checkAuth } = require('../middleware/auth');

router.get('/finanzas', checkAuth, reportesController.finanzas);

module.exports = router;
