// routes/cuota.routes.js
const express = require('express');
const router = express.Router();
const cuotaController = require('../controllers/cuota.controller');
const { checkAuth, checkRol } = require('../middleware/auth');

// Registrar un pago de cuota
router.post('/:id/pagar', checkAuth, cuotaController.registrarPago);

// Actualizar una cuota
router.put('/:id', checkAuth, checkRol(['admin']), cuotaController.actualizarCuota);

module.exports = router;
