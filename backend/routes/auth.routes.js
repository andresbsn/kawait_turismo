// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
router.post('/login', authController.login);

router.post('/login-cliente', authController.loginCliente);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión de usuario
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;