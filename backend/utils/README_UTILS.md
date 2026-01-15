# 📚 Guía de Uso de Utilidades - Fase 1

## 🎯 Objetivo
Esta guía explica cómo usar las nuevas utilidades para escribir código más limpio y consistente.

---

## 1️⃣ Response Handler

### Uso Básico

```javascript
const { success, error, notFound, paginated } = require('../utils/responseHandler');

// Respuesta exitosa
exports.obtenerTour = async (req, res) => {
  const tour = await Tour.findByPk(req.params.id);
  return success(res, { tour }, 'Tour obtenido exitosamente');
};

// Recurso no encontrado
exports.obtenerTour = async (req, res) => {
  const tour = await Tour.findByPk(req.params.id);
  if (!tour) {
    return notFound(res, 'Tour');
  }
  return success(res, { tour });
};

// Error personalizado
exports.crearTour = async (req, res) => {
  if (!req.body.nombre) {
    return error(res, 'El nombre es requerido', 400);
  }
  // ...
};

// Respuesta con paginación
exports.obtenerTours = async (req, res) => {
  const result = await paginate(Tour, options);
  return paginated(res, result, 'Tours obtenidos exitosamente');
};
```

---

## 2️⃣ Async Handler

### Antes
```javascript
exports.obtenerTours = async (req, res) => {
  try {
    const tours = await Tour.findAll();
    res.json({ tours });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### Después
```javascript
const asyncHandler = require('../utils/asyncHandler');

exports.obtenerTours = asyncHandler(async (req, res) => {
  const tours = await Tour.findAll();
  success(res, { tours });
  // Los errores se manejan automáticamente
});
```

---

## 3️⃣ Pagination Helper

### Uso Básico
```javascript
const { paginate, getPaginationParams } = require('../utils/paginationHelper');

exports.obtenerTours = asyncHandler(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  
  const result = await paginate(Tour, {
    page,
    limit,
    where: { activo: true },
    order: [['nombre', 'ASC']]
  });
  
  return paginated(res, result);
});
```

### Con Búsqueda
```javascript
const { paginate } = require('../utils/paginationHelper');
const { buildSearchCondition } = require('../utils/searchHelper');

exports.obtenerTours = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  
  const where = {
    activo: true,
    ...buildSearchCondition(search, ['nombre', 'destino', 'descripcion'])
  };
  
  const result = await paginate(Tour, {
    page,
    limit,
    where,
    order: [['nombre', 'ASC']]
  });
  
  return paginated(res, result);
});
```

---

## 4️⃣ Search Helper

### Búsqueda Simple
```javascript
const { buildSearchCondition } = require('../utils/searchHelper');

// Buscar en múltiples campos
const where = {
  activo: true,
  ...buildSearchCondition(req.query.search, ['nombre', 'apellido', 'email'])
};
```

### Búsqueda en Relaciones
```javascript
const { buildIncludeSearchCondition } = require('../utils/searchHelper');

const result = await Reserva.findAll({
  include: [{
    model: Tour,
    where: buildIncludeSearchCondition(search, ['nombre', 'destino'])
  }]
});
```

### Rango de Fechas
```javascript
const { buildDateRangeCondition } = require('../utils/searchHelper');

const where = {
  ...buildDateRangeCondition(fechaInicio, fechaFin, 'fecha_reserva')
};
```

---

## 5️⃣ Transaction Wrapper

### Uso Básico
```javascript
const { withTransaction } = require('../utils/transactionWrapper');

exports.crearReserva = asyncHandler(async (req, res) => {
  const resultado = await withTransaction(async (transaction) => {
    const reserva = await Reserva.create(data, { transaction });
    const cuenta = await CuentaCorriente.create(cuentaData, { transaction });
    const cuotas = await Cuota.bulkCreate(cuotasData, { transaction });
    
    return { reserva, cuenta, cuotas };
  });
  
  return success(res, resultado, 'Reserva creada exitosamente', 201);
});
```

### Múltiples Operaciones
```javascript
const { executeInTransaction } = require('../utils/transactionWrapper');

const [reserva, cuenta, cuotas] = await executeInTransaction([
  (t) => Reserva.create(data, { transaction: t }),
  (t) => CuentaCorriente.create(cuentaData, { transaction: t }),
  (t) => Cuota.bulkCreate(cuotasData, { transaction: t })
]);
```

---

## 6️⃣ Error Handler

### Lanzar Errores Personalizados
```javascript
const { NotFoundError, ValidationError, ConflictError } = require('../middlewares/errorHandler');

exports.obtenerTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findByPk(req.params.id);
  
  if (!tour) {
    throw new NotFoundError('Tour no encontrado');
  }
  
  return success(res, { tour });
});

exports.crearTour = asyncHandler(async (req, res) => {
  const existe = await Tour.findOne({ where: { nombre: req.body.nombre } });
  
  if (existe) {
    throw new ConflictError('Ya existe un tour con ese nombre');
  }
  
  const tour = await Tour.create(req.body);
  return success(res, { tour }, 'Tour creado exitosamente', 201);
});
```

---

## 📋 Ejemplo Completo: Controlador Refactorizado

### Antes (tour.controller.js - Versión Original)
```javascript
const obtenerTours = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', estado } = req.query;
    const offset = (page - 1) * limit;

    const where = { activo: true };

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { destino: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    const { count, rows: tours } = await Tour.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      tours
    });
  } catch (error) {
    console.error('Error al obtener tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los tours',
      error: error.message
    });
  }
};
```

### Después (tour.controller.js - Refactorizado)
```javascript
const asyncHandler = require('../utils/asyncHandler');
const { paginated } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginationHelper');
const { buildSearchCondition } = require('../utils/searchHelper');

const obtenerTours = asyncHandler(async (req, res) => {
  const { page, limit, search, estado } = req.query;
  
  const where = {
    activo: true,
    ...buildSearchCondition(search, ['nombre', 'destino', 'descripcion'])
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
  
  return paginated(res, result, 'Tours obtenidos exitosamente');
});
```

**Reducción: 40 líneas → 20 líneas (50% menos código)**

---

## ✅ Checklist de Refactorización

Al refactorizar un controlador, asegurate de:

- [ ] Usar `asyncHandler` para eliminar try-catch
- [ ] Usar `responseHandler` para respuestas consistentes
- [ ] Usar `paginationHelper` si hay paginación
- [ ] Usar `searchHelper` si hay búsquedas
- [ ] Usar `transactionWrapper` si hay transacciones
- [ ] Lanzar errores personalizados en lugar de return res.status()
- [ ] Eliminar console.log (usar logger en el futuro)
- [ ] Probar que todo funciona igual que antes

---

## 🚀 Próximos Pasos

1. Refactorizar un controlador a la vez
2. Probar cada endpoint después de refactorizar
3. Verificar que las respuestas sean idénticas
4. Continuar con el siguiente controlador

---

## 📝 Notas

- **No cambiar la lógica funcional**, solo la estructura
- **Mantener compatibilidad** con el frontend
- **Probar exhaustivamente** cada cambio
- **Documentar** cualquier cambio significativo
