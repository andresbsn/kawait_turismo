# 📚 Guía de Servicios - Capa de Lógica de Negocio

## 🎯 Propósito

La capa de servicios separa la **lógica de negocio** de los **controladores HTTP**, siguiendo el principio de **Separación de Responsabilidades**.

### **Beneficios:**
- ✅ Controladores ultra simples (10-20 líneas)
- ✅ Lógica de negocio reutilizable
- ✅ Más fácil de testear
- ✅ Mejor organización del código
- ✅ Servicios independientes del protocolo HTTP

---

## 📁 Estructura

```
backend/
├── services/
│   ├── BaseService.js              # Clase base con operaciones CRUD
│   ├── tour.service.js             # Lógica de tours
│   ├── cliente.service.js          # Lógica de clientes
│   ├── usuario.service.js          # Lógica de usuarios
│   ├── cuota.service.js            # Lógica de cuotas
│   ├── cuentaCorriente.service.js  # Lógica de cuentas corrientes
│   └── README_SERVICES.md          # Esta guía
└── controllers/
    ├── tour.controller.js          # Solo manejo HTTP
    ├── cliente.controller.js       # Solo manejo HTTP
    └── ...
```

---

## 🏗️ BaseService

Clase base que proporciona operaciones CRUD comunes para todos los servicios.

### **Métodos Disponibles:**

```javascript
class BaseService {
  // Obtener todos con paginación
  async getAll(options = {})
  
  // Obtener por ID
  async getById(id, options = {})
  
  // Crear registro
  async create(data, options = {})
  
  // Actualizar registro
  async update(id, data, options = {})
  
  // Eliminar registro
  async delete(id, options = {})
  
  // Buscar múltiples
  async findAll(options = {})
  
  // Buscar uno
  async findOne(options = {})
  
  // Contar registros
  async count(where = {})
  
  // Verificar existencia
  async exists(where = {})
  
  // Buscar o crear
  async findOrCreate(options = {})
}
```

### **Ejemplo de Uso:**

```javascript
const BaseService = require('./BaseService');
const { MiModelo } = require('../models');

class MiServicio extends BaseService {
  constructor() {
    super(MiModelo, 'MiModelo');
  }
  
  // Métodos personalizados aquí
}

module.exports = new MiServicio();
```

---

## 📖 Ejemplos por Servicio

### **1. TourService**

```javascript
const tourService = require('../services/tour.service');

// Obtener tours con filtros
const tours = await tourService.getTours({
  page: 1,
  limit: 10,
  search: 'Paris',
  estado: 'disponible'
});

// Obtener tour por ID
const tour = await tourService.getTourById(1);

// Crear tour
const nuevoTour = await tourService.createTour({
  nombre: 'Tour a París',
  destino: 'Francia',
  precio: 1500,
  cupos_totales: 20
});

// Actualizar tour
const tourActualizado = await tourService.updateTour(1, {
  precio: 1600
});

// Eliminar tour (soft delete)
await tourService.deleteTour(1);

// Verificar disponibilidad
const disponibilidad = await tourService.verificarDisponibilidad(1, 5);
// { disponible: true, cuposDisponibles: 15, cuposSolicitados: 5 }

// Actualizar cupos (en transacción)
await tourService.actualizarCupos(1, 5, { transaction });
```

---

### **2. ClienteService**

```javascript
const clienteService = require('../services/cliente.service');

// Obtener clientes con paginación
const clientes = await clienteService.getClientes({
  page: 1,
  limit: 10,
  search: 'Juan'
});

// Buscar clientes (autocomplete)
const resultados = await clienteService.buscarClientes('Jua');

// Crear cliente (valida duplicados automáticamente)
const nuevoCliente = await clienteService.createCliente({
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  dni: '12345678'
});

// Actualizar cliente (valida duplicados)
const clienteActualizado = await clienteService.updateCliente(1, {
  telefono: '123456789'
});

// Buscar por email
const cliente = await clienteService.getClienteByEmail('juan@example.com');

// Buscar por DNI
const cliente = await clienteService.getClienteByDNI('12345678');

// Obtener clientes con reservas
const clientesConReservas = await clienteService.getClientesConReservas({
  page: 1,
  limit: 10
});
```

---

### **3. UsuarioService**

```javascript
const usuarioService = require('../services/usuario.service');

// Obtener usuarios
const usuarios = await usuarioService.getUsuarios({
  page: 1,
  limit: 10,
  search: 'admin'
});

// Crear usuario (hashea password automáticamente)
const nuevoUsuario = await usuarioService.createUsuario({
  username: 'admin',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin'
});

// Actualizar usuario (hashea password si se proporciona)
const usuarioActualizado = await usuarioService.updateUsuario(1, {
  email: 'newemail@example.com',
  password: 'newpassword123' // Opcional
});

// Eliminar usuario (valida que no sea el mismo usuario)
await usuarioService.deleteUsuario(1, currentUserId);

// Buscar por username (incluye password para autenticación)
const usuario = await usuarioService.getUsuarioByUsername('admin');

// Verificar password
const esValido = await usuarioService.verificarPassword(
  'password123',
  usuario.password
);

// Cambiar password
await usuarioService.cambiarPassword(1, 'oldpass', 'newpass');

// Activar/Desactivar usuario
await usuarioService.toggleActive(1);
```

---

### **4. CuotaService**

```javascript
const cuotaService = require('../services/cuota.service');

// Registrar pago de cuota (en transacción)
const resultado = await withTransaction(async (transaction) => {
  return await cuotaService.registrarPago(
    cuotaId,
    {
      monto_pagado: 500,
      metodo_pago: 'efectivo',
      observaciones: 'Pago en efectivo'
    },
    usuarioId,
    transaction
  );
});
// { pago: {...}, cuotaId: 1 }

// Actualizar cuota (en transacción)
const cuotaId = await withTransaction(async (transaction) => {
  return await cuotaService.actualizarCuota(
    1,
    {
      fecha_vencimiento: new Date(),
      monto: 600,
      estado: 'pendiente'
    },
    transaction
  );
});

// Obtener cuota con detalles completos
const cuota = await cuotaService.getCuotaConDetalles(1);
```

---

### **5. CuentaCorrienteService**

```javascript
const cuentaCorrienteService = require('../services/cuentaCorriente.service');

// Obtener cuentas con filtros
const cuentas = await cuentaCorrienteService.getCuentasCorrientes({
  page: 1,
  limit: 10,
  estado: 'pendiente',
  cliente_id: 5
});

// Obtener mis cuentas (usuario autenticado)
const misCuentas = await cuentaCorrienteService.getMisCuentas('user@example.com');
// { cliente: {...}, cuentas: [...] }

// Obtener cuenta por ID con detalles
const cuenta = await cuentaCorrienteService.getCuentaCorrienteById(1);

// Actualizar estado (en transacción)
const cuenta = await withTransaction(async (transaction) => {
  return await cuentaCorrienteService.actualizarEstado(
    1,
    'pagado',
    transaction
  );
});

// Obtener cuentas por cliente
const cuentas = await cuentaCorrienteService.getCuentasPorCliente(5);

// Obtener resumen de cuenta
const resumen = await cuentaCorrienteService.getResumenCuenta(1);
// {
//   cuenta: {...},
//   resumen: {
//     total_cuotas: 12,
//     cuotas_pagadas: 5,
//     cuotas_pendientes: 7,
//     cuotas_vencidas: 0,
//     monto_total: 12000,
//     monto_abonado: 5000,
//     saldo_pendiente: 7000,
//     porcentaje_pagado: '41.67'
//   }
// }
```

---

## 🎨 Patrón de Uso en Controladores

### **Antes (Sin Servicios):**

```javascript
const obtenerTours = asyncHandler(async (req, res) => {
  const { page, limit, search, estado } = req.query;
  
  const where = {
    activo: true,
    ...buildSearchCondition(search, ['nombre', 'destino'])
  };
  
  if (estado) {
    where.estado = estado;
  }
  
  const result = await paginate(Tour, {
    page,
    limit,
    where,
    order: [['fecha_inicio', 'ASC']]
  });
  
  const response = {
    tours: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Tours obtenidos exitosamente');
});
```

### **Después (Con Servicios):**

```javascript
const obtenerTours = asyncHandler(async (req, res) => {
  const result = await tourService.getTours(req.query);
  
  const response = {
    tours: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Tours obtenidos exitosamente');
});
```

**Reducción: 27 líneas → 9 líneas (67% menos código)**

---

## 🔄 Uso con Transacciones

Los servicios están diseñados para trabajar con transacciones:

```javascript
const { withTransaction } = require('../utils/transactionWrapper');

// En el controlador
const resultado = await withTransaction(async (transaction) => {
  // Llamar al servicio pasando la transacción
  return await miServicio.operacionCompleja(data, transaction);
});
```

### **Ejemplo Completo:**

```javascript
// En el servicio
async registrarPago(cuotaId, data, usuarioId, transaction) {
  // Todas las operaciones usan la misma transacción
  const cuota = await Cuota.findByPk(cuotaId, { transaction });
  await cuota.update(data, { transaction });
  const pago = await Pago.create(data, { transaction });
  return { pago, cuotaId };
}

// En el controlador
exports.registrarPago = asyncHandler(async (req, res) => {
  const resultado = await withTransaction(async (transaction) => {
    return await cuotaService.registrarPago(
      req.params.id,
      req.body,
      req.usuario?.id,
      transaction
    );
  });
  
  return success(res, resultado, 'Pago registrado');
});
```

---

## ✅ Mejores Prácticas

### **1. Servicios como Singletons**
```javascript
// ✅ Correcto - Exportar instancia
class MiServicio extends BaseService {
  constructor() {
    super(MiModelo, 'MiModelo');
  }
}

module.exports = new MiServicio();

// ❌ Incorrecto - Exportar clase
module.exports = MiServicio;
```

### **2. Validaciones en Servicios**
```javascript
// ✅ Correcto - Validaciones de negocio en servicios
async createCliente(data) {
  await this.verificarDuplicados(data.email, data.dni);
  return await this.create(data);
}

// ❌ Incorrecto - Validaciones en controlador
```

### **3. Errores Tipados**
```javascript
// ✅ Correcto - Usar clases de error personalizadas
if (!cliente) {
  throw new NotFoundError('Cliente no encontrado');
}

if (emailDuplicado) {
  throw new ConflictError('Email ya existe');
}

// ❌ Incorrecto - Errores genéricos
throw new Error('Error');
```

### **4. Métodos Específicos**
```javascript
// ✅ Correcto - Métodos descriptivos
async getTourById(id)
async getToursDisponibles(params)
async verificarDisponibilidad(tourId, cantidad)

// ❌ Incorrecto - Métodos genéricos
async get(id)
async list(params)
async check(id, data)
```

### **5. Retornar Datos, No Respuestas HTTP**
```javascript
// ✅ Correcto - Retornar datos
async getTours(params) {
  return await this.getAll({ ...params });
}

// ❌ Incorrecto - Retornar respuesta HTTP
async getTours(params, res) {
  const data = await this.getAll({ ...params });
  return res.json(data);
}
```

---

## 🧪 Testing de Servicios

Los servicios son fáciles de testear porque no dependen de HTTP:

```javascript
const tourService = require('../services/tour.service');

describe('TourService', () => {
  describe('getTours', () => {
    it('debe retornar tours con paginación', async () => {
      const result = await tourService.getTours({
        page: 1,
        limit: 10
      });
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toBeInstanceOf(Array);
    });
  });
  
  describe('createTour', () => {
    it('debe crear un tour correctamente', async () => {
      const tourData = {
        nombre: 'Test Tour',
        destino: 'Test',
        precio: 1000
      };
      
      const tour = await tourService.createTour(tourData);
      
      expect(tour).toHaveProperty('id');
      expect(tour.nombre).toBe('Test Tour');
    });
  });
});
```

---

## 📊 Comparación: Antes vs Después

### **Controlador Tour**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código | 229 | 74 | 68% ↓ |
| Lógica de negocio | En controlador | En servicio | ✅ |
| Testeable | Difícil | Fácil | ✅ |
| Reutilizable | No | Sí | ✅ |

### **Controlador Cliente**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código | 177 | 78 | 56% ↓ |
| Validaciones | Duplicadas | Centralizadas | ✅ |
| Búsquedas | En controlador | En servicio | ✅ |

### **Controlador Usuario**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código | 208 | 116 | 44% ↓ |
| Hash passwords | En controlador | En servicio | ✅ |
| Verificaciones | Duplicadas | Centralizadas | ✅ |

---

## 🎯 Ventajas de la Capa de Servicios

### **1. Separación de Responsabilidades**
- **Controladores:** Solo manejan HTTP (req/res)
- **Servicios:** Solo lógica de negocio
- **Modelos:** Solo estructura de datos

### **2. Reutilización**
```javascript
// El mismo servicio puede usarse en:
// - Controladores HTTP
// - Jobs/Cron
// - WebSockets
// - CLI commands
// - Tests
```

### **3. Testabilidad**
```javascript
// Fácil de testear sin HTTP
const result = await tourService.getTours({ page: 1 });
expect(result.data).toHaveLength(10);
```

### **4. Mantenibilidad**
```javascript
// Cambiar lógica en un solo lugar
// Afecta a todos los controladores que lo usan
```

### **5. Escalabilidad**
```javascript
// Fácil agregar nuevos métodos
// Sin tocar los controladores
```

---

## 🚀 Próximos Pasos

### **Opcional: Crear más servicios**
- `reserva.service.js` - Lógica de reservas
- `pago.service.js` - Lógica de pagos
- `auth.service.js` - Lógica de autenticación

### **Opcional: Agregar caché**
```javascript
class TourService extends BaseService {
  async getTourById(id) {
    const cacheKey = `tour:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    const tour = await this.getById(id);
    await cache.set(cacheKey, tour, 3600);
    return tour;
  }
}
```

### **Opcional: Agregar eventos**
```javascript
class ClienteService extends BaseService {
  async createCliente(data) {
    const cliente = await this.create(data);
    eventEmitter.emit('cliente:created', cliente);
    return cliente;
  }
}
```

---

## 📝 Resumen

La capa de servicios proporciona:

✅ **Código más limpio** - Controladores de 10-20 líneas
✅ **Mejor organización** - Lógica separada de HTTP
✅ **Reutilización** - Servicios usables en cualquier contexto
✅ **Testabilidad** - Fácil de testear sin HTTP
✅ **Mantenibilidad** - Cambios en un solo lugar
✅ **Escalabilidad** - Fácil agregar funcionalidad

**¡La arquitectura ahora es profesional y escalable! 🎉**
