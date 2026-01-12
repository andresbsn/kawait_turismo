// routes/cuentaCorriente.routes.js
const express = require('express');
const router = express.Router();
const cuentaCorrienteController = require('../controllers/cuentaCorriente.controller');
const { checkAuth, checkRol } = require('../middleware/auth');

// Obtener todas las cuentas corrientes
router.get('/', checkAuth, cuentaCorrienteController.obtenerCuentasCorrientes);

// Obtener cuentas corrientes del usuario autenticado (solo lectura)
router.get('/mis-cuentas', checkAuth, cuentaCorrienteController.obtenerMisCuentas);

// Obtener una cuenta corriente por ID
router.get('/:id', checkAuth, cuentaCorrienteController.obtenerCuentaCorriente);

// Actualizar el estado de una cuenta corriente
router.put('/:id/estado', checkAuth, checkRol(['admin']), cuentaCorrienteController.actualizarEstadoCuenta);

// Obtener cuentas corrientes por cliente
router.get('/cliente/:clienteId', checkAuth, (req, res, next) => {
  const { clienteId } = req.params;
  const userRole = req.usuario?.role || req.usuario?.rol;
  const isAdmin = userRole === 'ADMIN' || userRole === 'admin';

  if (isAdmin) return next();

  const userClienteId = req.usuario?.cliente_id || req.usuario?.clienteId;
  if (userClienteId && String(userClienteId) === String(clienteId)) return next();

  return res.status(403).json({
    success: false,
    message: 'No tiene permiso para acceder a las cuentas de este cliente'
  });
}, cuentaCorrienteController.obtenerCuentasPorCliente);

module.exports = router;