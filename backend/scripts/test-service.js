'use strict';

const reservaService = require('../services/reserva.service');

async function testService() {
  try {
    const result = await reservaService.getReservas();
    if (result && result.data && result.data.length > 0) {
      console.log('--- FIRST RESERVATION FROM SERVICE ---');
      const r = result.data[0].toJSON();
      console.log('Keys returned:', Object.keys(r));
      console.log('monto_abonado:', r.monto_abonado);
      console.log('estado_pago:', r.estado_pago);
    } else {
      console.log('No reservation found in service!');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testService();
