const { Op } = require('sequelize');
const db = require('../models');
const ReservaAdjunto = db.ReservaAdjunto;
const Reserva = db.Reserva;
const fs = require('fs');
const path = require('path');

const esAdmin = (req) => {
    const rol = req.usuario?.role || req.usuario?.rol || '';
    return String(rol).toUpperCase().trim() === 'ADMIN';
};

const uploadAttachment = async (req, res, next) => {
    try {
        const { id } = req.params; // reserva id
        const { tipo } = req.body;
        const file = req.file;

        // Verificar si existe la reserva
        const reserva = await Reserva.findByPk(id);
        if (!reserva) {
            if (file) {
                fs.unlinkSync(file.path);
            }
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Verificar tipo de documento
        const allowedTypes = ['presupuesto', 'voucher', 'ticket_aereo', 'asistencia_viajero', 'factura', 'liquidacion_reserva', 'otro'];
        if (!allowedTypes.includes(tipo)) {
            if (file) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ message: 'Tipo de documento no válido' });
        }

        if (!file) {
            return res.status(400).json({ message: 'Archivo no proporcionado' });
        }

        // Guardar en la base de datos
        const adjunto = await ReservaAdjunto.create({
            reserva_id: id,
            tipo: tipo,
            nombre_archivo: file.originalname,
            ruta_archivo: path.relative(path.join(__dirname, '../'), file.path), // Ruta relativa
            mimetype: file.mimetype,
            size: file.size
        });

        res.status(201).json({
            message: 'Archivo subido correctamente',
            adjunto
        });

    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path); // Eliminar si falla la DB
        }
        next(error);
    }
};

const getAttachments = async (req, res, next) => {
    try {
        const { id } = req.params; // reserva id

        const whereCondition = { reserva_id: id };

        // Los clientes (no admin) no pueden ver archivos de liquidación
        if (!esAdmin(req)) {
            whereCondition.tipo = { [Op.ne]: 'liquidacion_reserva' };
        }

        const adjuntos = await ReservaAdjunto.findAll({
            where: whereCondition,
            order: [['created_at', 'DESC']]
        });

        res.json(adjuntos);
    } catch (error) {
        next(error);
    }
};

const deleteAttachment = async (req, res, next) => {
    try {
        const { id, adjuntoId } = req.params;

        const adjunto = await ReservaAdjunto.findOne({
            where: {
                id: adjuntoId,
                reserva_id: id
            }
        });

        if (!adjunto) {
            return res.status(404).json({ message: 'Adjunto no encontrado' });
        }

        // Construir la ruta absoluta
        const safePath = adjunto.ruta_archivo.replace(/^(\.\.(\/|\\|$))+/, '');
        const absolutePath = path.join(__dirname, '../', safePath);

        // Eliminar archivo físico
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        } else {
            console.warn(`Archivo no encontrado en sistema de archivos: ${absolutePath}`);
        }

        // Eliminar registro
        await adjunto.destroy();

        res.json({ message: 'Adjunto eliminado correctamente' });

    } catch (error) {
        next(error);
    }
};

const downloadAttachment = async (req, res, next) => {
    try {
        const { id, adjuntoId } = req.params;

        const adjunto = await ReservaAdjunto.findOne({
            where: {
                id: adjuntoId,
                reserva_id: id
            }
        });

        if (!adjunto) {
            return res.status(404).json({ message: 'Adjunto no encontrado' });
        }

        // Los clientes no pueden descargar archivos de liquidación
        if (adjunto.tipo === 'liquidacion_reserva' && !esAdmin(req)) {
            return res.status(403).json({ message: 'No tiene permiso para descargar este archivo' });
        }

        // Construir la ruta absoluta de forma segura
        const safePath = adjunto.ruta_archivo.replace(/^(\.\.(\/|\\|$))+/, '');
        const absolutePath = path.join(__dirname, '../', safePath);

        if (fs.existsSync(absolutePath)) {
            res.download(absolutePath, adjunto.nombre_archivo);
        } else {
            res.status(404).json({ message: 'Archivo físico no encontrado' });
        }

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadAttachment,
    getAttachments,
    deleteAttachment,
    downloadAttachment
};
