'use strict';

const db = require('../models');

async function testJson() {
  try {
    const r = await db.sequelize.models.Reserva.findOne();
    if (r) {
      console.log('--- KEYS ON SEQUELIZE INSTANCE ---');
      console.log(Object.keys(r.dataValues));
      
      console.log('\n--- KEYS ON JSON SERIALIZATION ---');
      console.log(Object.keys(r.toJSON()));
      
      console.log('\n--- VALUES ---');
      console.log('monto_abonado:', r.monto_abonado);
      console.log('montoAbonado:', r.montoAbonado);
    } else {
      console.log('No reservation found to test!');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testJson();
