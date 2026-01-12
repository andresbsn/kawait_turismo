const fs = require('fs');
const path = require('path');
const { Pago, CuentaCorriente, Cliente, Reserva, Cuota } = require('../models');
const { handleHttpError } = require('../helpers/handleError');
const { Op } = require('sequelize');
const { format } = require('date-fns');
const Handlebars = require('handlebars');
const { createPdfFromHtml } = require('../helpers/pdfGenerator');

/**
 * Genera un comprobante de pago en formato PDF
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const generarComprobantePago = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const usuarioId = req.usuario.id;

    // Buscar el pago con la información relacionada
    const pago = await Pago.findByPk(pagoId, {
      include: [
        {
          model: CuentaCorriente,
          include: [
            {
              model: Cliente,
              attributes: ['id', 'nombre', 'apellido', 'documento', 'email', 'telefono']
            },
            {
              model: Reserva,
              attributes: ['id', 'referencia', 'fecha_reserva', 'monto_total']
            }
          ]
        },
        {
          model: Cuota,
          as: 'cuotas',
          attributes: ['id', 'numero_cuota', 'monto', 'fecha_vencimiento', 'estado']
        }
      ]
    });

    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver este comprobante
    const esAdmin = req.usuario.rol === 'ADMIN';
    const esCliente = pago.CuentaCorrimento.Cliente.id === req.usuario.cliente_id;
    
    if (!esAdmin && !esCliente) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este comprobante'
      });
    }

    // Formatear los datos para la plantilla
    const data = {
      comprobante: {
        numero: pago.id.toString().padStart(8, '0'),
        fecha_emision: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
        estado: 'PAGADO',
        metodo_pago: pago.metodo_pago.toUpperCase(),
        monto: pago.monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
        referencia: pago.referencia || 'N/A',
        observaciones: pago.observaciones || 'Sin observaciones'
      },
      cliente: {
        nombre: `${pago.CuentaCorriente.Cliente.nombre} ${pago.CuentaCorriente.Cliente.apellido}`,
        documento: pago.CuentaCorriente.Cliente.documento || 'No especificado',
        email: pago.CuentaCorriente.Cliente.email || 'No especificado',
        telefono: pago.CuentaCorriente.Cliente.telefono || 'No especificado'
      },
      reserva: {
        referencia: pago.CuentaCorriente.Reserva.referencia,
        fecha_reserva: format(new Date(pago.CuentaCorriente.Reserva.fecha_reserva), 'dd/MM/yyyy'),
        monto_total: pago.CuentaCorriente.Reserva.monto_total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
      },
      cuotas: pago.cuotas.map(cuota => ({
        numero: cuota.numero_cuota,
        monto: cuota.monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
        vencimiento: format(new Date(cuota.fecha_vencimiento), 'dd/MM/yyyy'),
        estado: cuota.estado.toUpperCase()
      })),
      empresa: {
        nombre: 'KAWAIT TURISMO',
        direccion: 'Av. Siempreviva 123, CABA, Argentina',
        telefono: '+54 11 1234-5678',
        email: 'info@kawaitturismo.com',
        cuit: '30-12345678-9',
        inicio_actividades: '01/01/2020',
        logo: 'https://kawaitturismo.com/logo.png' // URL del logo de la empresa
      }
    };

    // Generar el PDF
    const pdfBuffer = await createPdfFromHtml('comprobante', data);

    // Configurar los headers de la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-${pago.id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Enviar el PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error al generar el comprobante:', error);
    handleHttpError(res, 'Error al generar el comprobante de pago');
  }
};

module.exports = {
  generarComprobantePago
};
