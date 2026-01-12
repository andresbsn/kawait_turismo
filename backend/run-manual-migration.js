const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize({
  database: 'postgres',
  username: 'postgres',
  password: 'postgres_35702',
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  logging: console.log,
  define: {
    schema: 'public',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    paranoid: true
  }
});

// Función para ejecutar una consulta SQL
async function executeQuery(query) {
  try {
    console.log(`Ejecutando: ${query}`);
    const [results] = await sequelize.query(query);
    console.log('Consulta ejecutada con éxito');
    return results;
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error.message);
    throw error;
  }
}

// Crear la tabla de cuentas corrientes
async function createCuentasCorrientesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS public.cuentas_corrientes (
      id SERIAL PRIMARY KEY,
      reserva_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      monto_total DECIMAL(12,2) NOT NULL,
      saldo_pendiente DECIMAL(12,2) NOT NULL DEFAULT 0,
      cantidad_cuotas INTEGER NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado')),
      fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      fecha_actualizacion TIMESTAMP WITH TIME ZONE,
      deleted_at TIMESTAMP WITH TIME ZONE,
      
      CONSTRAINT fk_reserva
        FOREIGN KEY (reserva_id) 
        REFERENCES public.reservas(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
      CONSTRAINT fk_cliente
        FOREIGN KEY (cliente_id) 
        REFERENCES public.clientes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
      CONSTRAINT uq_reserva UNIQUE (reserva_id)
    );
    
    -- Índices
    CREATE INDEX IF NOT EXISTS idx_cuentas_corrientes_cliente_id ON public.cuentas_corrientes(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_cuentas_corrientes_estado ON public.cuentas_corrientes(estado);
  `;
  
  return executeQuery(query);
}

// Crear la tabla de cuotas
async function createCuotasTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS public.cuotas (
      id SERIAL PRIMARY KEY,
      cuenta_corriente_id INTEGER NOT NULL,
      numero_cuota INTEGER NOT NULL,
      monto DECIMAL(12,2) NOT NULL,
      fecha_vencimiento DATE NOT NULL,
      fecha_pago TIMESTAMP WITH TIME ZONE,
      monto_pagado DECIMAL(12,2) DEFAULT 0,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada_parcial', 'pagada_total', 'vencida', 'cancelada')),
      metodo_pago VARCHAR(50),
      observaciones TEXT,
      fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      fecha_actualizacion TIMESTAMP WITH TIME ZONE,
      deleted_at TIMESTAMP WITH TIME ZONE,
      
      CONSTRAINT fk_cuenta_corriente
        FOREIGN KEY (cuenta_corriente_id) 
        REFERENCES public.cuentas_corrientes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
      CONSTRAINT uq_cuenta_cuota UNIQUE (cuenta_corriente_id, numero_cuota)
    );
    
    -- Índices
    CREATE INDEX IF NOT EXISTS idx_cuotas_cuenta_corriente_id ON public.cuotas(cuenta_corriente_id);
    CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_vencimiento ON public.cuotas(fecha_vencimiento);
    CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON public.cuotas(estado);
  `;
  
  return executeQuery(query);
}

// Función principal
async function main() {
  try {
    // Verificar la conexión
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // Crear las tablas
    console.log('\n=== Creando tabla de cuentas corrientes ===');
    await createCuentasCorrientesTable();
    
    console.log('\n=== Creando tabla de cuotas ===');
    await createCuotasTable();
    
    console.log('\n=== Migración completada exitosamente ===');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la migración
main();
