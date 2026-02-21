const BaseService = require('./BaseService');
const db = require('../models');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

// Lazy model getters to avoid circular dependency issues
const getModels = () => {
    const { Gasto, Reserva, Tour } = db.sequelize.models;
    return { Gasto, Reserva, Tour };
};

class GastoService extends BaseService {
    constructor() {
        super(null, 'Gasto');
        this._modelInitialized = false;
    }

    _ensureModel() {
        if (!this._modelInitialized) {
            const { Gasto } = getModels();
            this.model = Gasto;
            this._modelInitialized = true;
        }
    }

    /**
     * Obtener todos los gastos con filtros
     */
    async getGastos(params = {}) {
        this._ensureModel();
        const { Reserva, Tour } = getModels();
        const { page, limit, estado, categoria, desde, hasta, reserva_id } = params;

        const where = {};
        if (estado) where.estado = estado;
        if (categoria) where.categoria = categoria;
        if (reserva_id) where.reserva_id = reserva_id;

        if (desde || hasta) {
            where.fecha_vencimiento = {};
            if (desde) where.fecha_vencimiento[Op.gte] = desde;
            if (hasta) where.fecha_vencimiento[Op.lte] = hasta;
        }

        return await this.getAll({
            page,
            limit,
            where,
            include: [
                {
                    model: Reserva,
                    as: 'reserva',
                    attributes: ['id', 'codigo', 'tour_nombre', 'tour_destino'],
                    required: false,
                    include: [
                        {
                            model: Tour,
                            as: 'tour',
                            attributes: ['id', 'nombre', 'destino'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['fecha_vencimiento', 'ASC']]
        });
    }

    /**
     * Obtener un gasto por ID
     */
    async getGastoById(id) {
        this._ensureModel();
        const { Gasto, Reserva, Tour } = getModels();

        const gasto = await Gasto.findByPk(id, {
            include: [
                {
                    model: Reserva,
                    as: 'reserva',
                    attributes: ['id', 'codigo', 'tour_nombre', 'tour_destino'],
                    required: false,
                    include: [
                        {
                            model: Tour,
                            as: 'tour',
                            attributes: ['id', 'nombre', 'destino'],
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!gasto) {
            throw new NotFoundError('Gasto no encontrado');
        }

        return gasto;
    }

    /**
     * Crear un gasto
     */
    async crearGasto(data, transaction) {
        this._ensureModel();
        const { Gasto, Reserva } = getModels();

        const {
            descripcion,
            categoria = 'otro',
            importe,
            moneda = 'ARS',
            fecha_vencimiento,
            fecha_pago,
            estado = 'pendiente',
            metodo_pago,
            proveedor,
            numero_factura,
            reserva_id,
            observaciones
        } = data;

        if (!descripcion || !descripcion.trim()) {
            throw new ValidationError('La descripción es obligatoria');
        }
        if (!importe || parseFloat(importe) <= 0) {
            throw new ValidationError('El importe debe ser mayor a 0');
        }
        if (!fecha_vencimiento) {
            throw new ValidationError('La fecha de vencimiento es obligatoria');
        }

        // Verificar reserva si se proporciona
        if (reserva_id) {
            const reserva = await Reserva.findByPk(reserva_id, { transaction });
            if (!reserva) {
                throw new NotFoundError('La reserva asociada no existe');
            }
        }

        const gasto = await Gasto.create({
            descripcion: descripcion.trim(),
            categoria,
            importe: parseFloat(importe),
            moneda,
            fecha_vencimiento,
            fecha_pago: fecha_pago || null,
            estado: fecha_pago ? 'pagado' : estado,
            metodo_pago: metodo_pago || null,
            proveedor: proveedor || null,
            numero_factura: numero_factura || null,
            reserva_id: reserva_id || null,
            observaciones: observaciones || null
        }, { transaction });

        return gasto;
    }

    /**
     * Actualizar un gasto
     */
    async actualizarGasto(id, data, transaction) {
        this._ensureModel();
        const { Gasto } = getModels();

        const gasto = await Gasto.findByPk(id, { transaction });
        if (!gasto) {
            throw new NotFoundError('Gasto no encontrado');
        }

        const updateData = {};

        if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
        if (data.categoria !== undefined) updateData.categoria = data.categoria;
        if (data.importe !== undefined) updateData.importe = parseFloat(data.importe);
        if (data.moneda !== undefined) updateData.moneda = data.moneda;
        if (data.fecha_vencimiento !== undefined) updateData.fecha_vencimiento = data.fecha_vencimiento;
        if (data.fecha_pago !== undefined) updateData.fecha_pago = data.fecha_pago;
        if (data.estado !== undefined) updateData.estado = data.estado;
        if (data.metodo_pago !== undefined) updateData.metodo_pago = data.metodo_pago;
        if (data.proveedor !== undefined) updateData.proveedor = data.proveedor;
        if (data.numero_factura !== undefined) updateData.numero_factura = data.numero_factura;
        if (data.reserva_id !== undefined) updateData.reserva_id = data.reserva_id || null;
        if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

        await gasto.update(updateData, { transaction });

        return gasto;
    }

    /**
     * Marcar un gasto como pagado
     */
    async marcarPagado(id, data, transaction) {
        this._ensureModel();
        const { Gasto } = getModels();

        const gasto = await Gasto.findByPk(id, { transaction });
        if (!gasto) {
            throw new NotFoundError('Gasto no encontrado');
        }

        await gasto.update({
            estado: 'pagado',
            fecha_pago: data.fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: data.metodo_pago || gasto.metodo_pago
        }, { transaction });

        return gasto;
    }

    /**
     * Eliminar un gasto (soft delete)
     */
    async eliminarGasto(id, transaction) {
        this._ensureModel();
        const { Gasto } = getModels();

        const gasto = await Gasto.findByPk(id, { transaction });
        if (!gasto) {
            throw new NotFoundError('Gasto no encontrado');
        }

        await gasto.destroy({ transaction });
        return true;
    }

    /**
     * Resumen de gastos
     */
    async getResumen(params = {}) {
        this._ensureModel();
        const { Gasto } = getModels();
        const { desde, hasta } = params;

        const where = {};
        if (desde || hasta) {
            where.fecha_vencimiento = {};
            if (desde) where.fecha_vencimiento[Op.gte] = desde;
            if (hasta) where.fecha_vencimiento[Op.lte] = hasta;
        }

        const gastos = await Gasto.findAll({ where });

        const totalPagado = gastos
            .filter(g => g.estado === 'pagado')
            .reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);

        const totalPendiente = gastos
            .filter(g => g.estado === 'pendiente' || g.estado === 'vencido')
            .reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);

        const totalCancelado = gastos
            .filter(g => g.estado === 'cancelado')
            .reduce((sum, g) => sum + parseFloat(g.importe || 0), 0);

        // Agrupar por categoría
        const porCategoria = {};
        gastos.forEach(g => {
            if (!porCategoria[g.categoria]) {
                porCategoria[g.categoria] = { pagado: 0, pendiente: 0, total: 0 };
            }
            porCategoria[g.categoria].total += parseFloat(g.importe || 0);
            if (g.estado === 'pagado') {
                porCategoria[g.categoria].pagado += parseFloat(g.importe || 0);
            } else if (g.estado === 'pendiente' || g.estado === 'vencido') {
                porCategoria[g.categoria].pendiente += parseFloat(g.importe || 0);
            }
        });

        return {
            total_gastos: gastos.length,
            total_pagado: totalPagado,
            total_pendiente: totalPendiente,
            total_cancelado: totalCancelado,
            total_general: totalPagado + totalPendiente,
            por_categoria: porCategoria
        };
    }
}

module.exports = new GastoService();
