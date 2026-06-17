'use strict';

const db = require('../models');

async function inspectDb() {
  console.log('🔍 Inspeccionando base de datos...');
  
  try {
    const reservas = await db.sequelize.models.Reserva.findAll({
      include: [
        {
          model: db.sequelize.models.CuentaCorriente,
          as: 'cuentas_corrientes'
        }
      ]
    });
    
    console.log('\n--- RESERVAS ---');
    console.log(`Total reservas encontradas: ${reservas.length}`);
    reservas.forEach(r => {
      console.log({
        id: r.id,
        codigo: r.codigo,
        nombre_cliente: r.nombre_cliente,
        apellido_cliente: r.apellido_cliente,
        cantidad_personas: r.cantidad_personas,
        precio_unitario: r.precio_unitario,
        monto_abonado: r.monto_abonado,
        estado_pago: r.estado_pago,
        metodo_pago: r.metodo_pago,
        monto_total: r.cantidad_personas * r.precio_unitario,
        cuentas_corrientes_count: r.cuentas_corrientes ? r.cuentas_corrientes.length : 0,
        cuentas_corrientes: r.cuentas_corrientes ? r.cuentas_corrientes.map(cc => ({
          id: cc.id,
          monto_total: cc.monto_total,
          saldo_pendiente: cc.saldo_pendiente,
          estado: cc.estado
        })) : []
      });
    });
    
    const pagos = await db.sequelize.models.Pago.findAll();
    console.log('\n--- PAGOS ---');
    console.log(`Total pagos encontrados: ${pagos.length}`);
    pagos.forEach(p => {
      console.log({
        id: p.id,
        correlativo: p.correlativo,
        numero_comprobante: p.numero_comprobante,
        reserva_id: p.reserva_id,
        cuenta_corriente_id: p.cuenta_corriente_id,
        cuota_id: p.cuota_id,
        monto: p.monto,
        metodo_pago: p.metodo_pago,
        fecha_pago: p.fecha_pago,
        nombre_pagador: p.nombre_pagador,
        email_pagador: p.email_pagador
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inspeccionar:', error);
    process.exit(1);
  }
}

inspectDb();
