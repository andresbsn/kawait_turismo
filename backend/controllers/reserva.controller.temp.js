// Actualizar una reserva existente
exports.actualizarReserva = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      tour_id,
      clientes = [],
      fecha_reserva,
      cantidad_personas,
      estado,
      notas,
      referencia,
      descripcion,
      monto_total,
      monto_seña,
      cantidad_cuotas,
      tipo_pago,
      // Nuevos campos para tour personalizado
      tour_nombre,
      tour_destino,
      tour_descripcion,
      fecha_inicio,
      fecha_fin
    } = req.body;

    // Buscar la reserva existente
    const reserva = await Reserva.findByPk(id, { transaction: t });
    if (!reserva) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    // Validar que se proporcione un tour_id o datos de tour personalizado
    if (!tour_id && !(tour_nombre && tour_destino)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere un tour existente o los datos completos de un tour personalizado',
      });
    }

    // Si se proporciona un tour_id, verificar que exista
    if (tour_id) {
      const tour = await Tour.findByPk(tour_id, { transaction: t });
      if (!tour) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'El tour especificado no existe',
        });
      }
    }

    // Actualizar la reserva
    const reservaData = {
      ...(tour_id !== undefined && { tour_id }),
      ...(fecha_reserva && { fecha_reserva }),
      ...(cantidad_personas && { cantidad_personas }),
      ...(estado && { estado }),
      ...(notas !== undefined && { notas }),
      ...(referencia !== undefined && { referencia }),
      ...(descripcion !== undefined && { descripcion }),
      ...(monto_total !== undefined && { monto_total }),
      ...(monto_seña !== undefined && { monto_seña }),
      ...(tipo_pago && { tipo_pago }),
      // Agregar datos de tour personalizado si no hay tour_id
      ...(!tour_id && {
        tour_nombre,
        tour_destino,
        tour_descripcion,
        fecha_inicio,
        fecha_fin
      }),
      // Limpiar datos de tour personalizado si se está cambiando a un tour existente
      ...(tour_id && {
        tour_nombre: null,
        tour_destino: null,
        tour_descripcion: null,
        fecha_inicio: null,
        fecha_fin: null
      })
    };

    await reserva.update(reservaData, { transaction: t });

    // Actualizar clientes si se proporcionan
    if (clientes && clientes.length > 0) {
      // Eliminar relaciones existentes
      await reserva.setClientes([], { transaction: t });

      // Agregar los nuevos clientes
      for (const [index, clienteData] of clientes.entries()) {
        const esTitular = index === 0; // El primer cliente es el titular
        
        // Verificar si el cliente ya existe
        let clienteDB = await Cliente.findOne({
          where: { email: clienteData.email },
          transaction: t
        });

        // Si no existe, crearlo
        if (!clienteDB) {
          clienteDB = await Cliente.create({
            nombre: clienteData.nombre,
            apellido: clienteData.apellido || '',
            email: clienteData.email,
            telefono: clienteData.telefono,
            dni: clienteData.dni || null,
            direccion: clienteData.direccion || null
          }, { transaction: t });
        }

        // Asociar cliente a la reserva
        await reserva.addCliente(clienteDB, { 
          through: { 
            tipo_cliente: esTitular ? 'titular' : 'acompanante',
            created_at: new Date(),
            updated_at: new Date()
          },
          transaction: t 
        });
      }
    }

    // Actualizar cuotas si se modifican los montos o número de cuotas
    if (monto_total !== undefined || monto_seña !== undefined || cantidad_cuotas !== undefined) {
      // Eliminar cuotas existentes
      await Cuota.destroy({ 
        where: { reserva_id: reserva.id },
        transaction: t 
      });

      // Crear nuevas cuotas
      if (monto_total && monto_seña && cantidad_cuotas > 0) {
        const montoCuota = (monto_total - monto_seña) / cantidad_cuotas;
        const fechasVencimiento = calcularFechasVencimiento(new Date(), cantidad_cuotas);

        const cuotas = Array.from({ length: cantidad_cuotas }, (_, i) => ({
          reserva_id: reserva.id,
          numero_cuota: i + 1,
          monto: montoCuota,
          fecha_vencimiento: fechasVencimiento[i],
          estado: 'pendiente',
          monto_pagado: 0,
          fecha_pago: null,
          metodo_pago: null,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await Cuota.bulkCreate(cuotas, { transaction: t });
      }
    }

    await t.commit();

    // Obtener la reserva actualizada con sus relaciones
    const reservaActualizada = await Reserva.findByPk(reserva.id, {
      include: [
        {
          model: Cliente,
          as: 'clientes',
          through: { attributes: [] }
        },
        {
          model: Tour,
          as: 'tour'
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      reserva: reservaActualizada
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la reserva',
      error: error.message,
    });
  }
};
