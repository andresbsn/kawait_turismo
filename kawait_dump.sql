--
-- PostgreSQL database dump
--

\restrict ERwuEtvna5g4PctnzmShgKE6wlMMLt8X2biZpr7NbZHTTTuDZRRaVapzt37ocJV

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: enum_User_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_User_role" AS ENUM (
    'ADMIN',
    'CLIENTE',
    'admin',
    'user',
    'guide',
    'USER',
    'GUIDE'
);


--
-- Name: enum_cuentas_corrientes_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cuentas_corrientes_estado AS ENUM (
    'pendiente',
    'en_proceso',
    'pagado',
    'atrasado',
    'cancelado'
);


--
-- Name: enum_cuotas_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cuotas_estado AS ENUM (
    'pendiente',
    'pagada_parcial',
    'pagada_total',
    'vencida',
    'cancelada'
);


--
-- Name: enum_pagos_metodo_pago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pagos_metodo_pago AS ENUM (
    'efectivo',
    'transferencia',
    'tarjeta_credito',
    'tarjeta_debito',
    'deposito',
    'cheque',
    'echq',
    'otro'
);


--
-- Name: enum_reservas_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_reservas_estado AS ENUM (
    'pendiente',
    'confirmada',
    'cancelada',
    'completada'
);


--
-- Name: enum_reservas_estado_pago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_reservas_estado_pago AS ENUM (
    'pendiente',
    'parcial',
    'completo'
);


--
-- Name: enum_reservas_metodo_pago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_reservas_metodo_pago AS ENUM (
    'efectivo',
    'transferencia',
    'tarjeta_credito',
    'otro'
);


--
-- Name: enum_reservas_tipo_reserva; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_reservas_tipo_reserva AS ENUM (
    'alojamiento',
    'actividad'
);


--
-- Name: enum_tours_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_tours_estado AS ENUM (
    'disponible',
    'completo',
    'cancelado',
    'finalizado'
);


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'ADMIN',
    'CLIENTE',
    'admin',
    'user',
    'guide'
);


--
-- Name: enum_users_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


--
-- Name: enum_usuarios_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_usuarios_role AS ENUM (
    'ADMIN',
    'USER',
    'GUIDE'
);


--
-- Name: enum_usuarios_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_usuarios_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividades (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    destino_id integer NOT NULL,
    duracion_horas numeric(5,2),
    precio numeric(10,2),
    capacidad_maxima integer,
    fecha_hora_inicio timestamp with time zone,
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: actividades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: actividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actividades_id_seq OWNED BY public.actividades.id;


--
-- Name: alojamientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alojamientos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    destino_id integer NOT NULL,
    tipo character varying(50),
    direccion character varying(255),
    telefono character varying(20),
    email character varying(100),
    precio_noche numeric(10,2),
    capacidad_personas integer,
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: alojamientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alojamientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alojamientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alojamientos_id_seq OWNED BY public.alojamientos.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    apellido character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(20),
    direccion character varying(255),
    dni character varying(20) NOT NULL,
    fecha_nacimiento date,
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: cuentas_corrientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_corrientes (
    id integer NOT NULL,
    reserva_id integer NOT NULL,
    cliente_id integer NOT NULL,
    monto_total numeric(12,2) NOT NULL,
    saldo_pendiente numeric(12,2) DEFAULT 0 NOT NULL,
    cantidad_cuotas integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_actualizacion timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT cuentas_corrientes_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'pagado'::character varying, 'atrasado'::character varying, 'cancelado'::character varying])::text[])))
);


--
-- Name: cuentas_corrientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuentas_corrientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuentas_corrientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuentas_corrientes_id_seq OWNED BY public.cuentas_corrientes.id;


--
-- Name: cuotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuotas (
    id integer NOT NULL,
    cuenta_corriente_id integer NOT NULL,
    numero_cuota integer NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha_vencimiento date NOT NULL,
    fecha_pago timestamp with time zone,
    monto_pagado numeric(12,2) DEFAULT 0,
    estado public.enum_cuotas_estado DEFAULT 'pendiente'::public.enum_cuotas_estado NOT NULL,
    metodo_pago character varying(255),
    observaciones text,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_actualizacion timestamp with time zone
);


--
-- Name: cuotas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuotas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuotas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuotas_id_seq OWNED BY public.cuotas.id;


--
-- Name: destinos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.destinos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    ubicacion character varying(255) NOT NULL,
    categoria_id integer,
    imagen_url character varying(255),
    precio_promedio numeric(10,2),
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: destinos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.destinos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: destinos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.destinos_id_seq OWNED BY public.destinos.id;


--
-- Name: inscripciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscripciones (
    id integer NOT NULL,
    torneo_id integer NOT NULL,
    jugador_id integer NOT NULL,
    fecha_inscripcion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pagado boolean DEFAULT false,
    monto_abonado numeric(10,2) DEFAULT 0,
    fecha_pago timestamp without time zone,
    metodo_pago character varying(50)
);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscripciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscripciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscripciones_id_seq OWNED BY public.inscripciones.id;


--
-- Name: movimientos_cuenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_cuenta (
    id integer NOT NULL,
    jugador_id integer,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    descripcion text,
    referencia_id integer,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_cuenta_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['DEBE'::character varying, 'HABER'::character varying])::text[])))
);


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_cuenta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_cuenta_id_seq OWNED BY public.movimientos_cuenta.id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    correlativo integer NOT NULL,
    numero_comprobante character varying(20) NOT NULL,
    cuenta_corriente_id integer NOT NULL,
    cuota_id integer NOT NULL,
    cliente_id integer NOT NULL,
    usuario_id integer,
    monto numeric(12,2) NOT NULL,
    metodo_pago public.enum_pagos_metodo_pago NOT NULL,
    fecha_pago timestamp with time zone NOT NULL,
    observaciones text,
    extra jsonb,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    contacto character varying(100),
    telefono character varying(50),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: resenas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resenas (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    destino_id integer,
    alojamiento_id integer,
    actividad_id integer,
    calificacion integer NOT NULL,
    comentario text,
    fecha_creacion timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: resenas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resenas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resenas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resenas_id_seq OWNED BY public.resenas.id;


--
-- Name: reserva_clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserva_clientes (
    id integer NOT NULL,
    reserva_id integer NOT NULL,
    cliente_id integer NOT NULL,
    tipo_cliente character varying(255) DEFAULT 'titular'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN reserva_clientes.tipo_cliente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reserva_clientes.tipo_cliente IS 'Tipo de cliente en la reserva (ej: titular, acompañante)';


--
-- Name: reserva_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reserva_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reserva_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reserva_clientes_id_seq OWNED BY public.reserva_clientes.id;


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas (
    id integer NOT NULL,
    codigo character varying(255) NOT NULL,
    tour_id integer,
    fecha_reserva date NOT NULL,
    cantidad_personas integer DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    estado public.enum_reservas_estado DEFAULT 'pendiente'::public.enum_reservas_estado NOT NULL,
    notas text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    referencia character varying(255),
    descripcion text,
    tour_nombre character varying(255),
    tour_destino character varying(255),
    tour_descripcion text,
    fecha_inicio date,
    fecha_fin date,
    moneda_precio_unitario character varying(3) DEFAULT 'ARS'::character varying NOT NULL
);


--
-- Name: COLUMN reservas.tour_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.tour_id IS 'Opcional: ID del tour asociado a la reserva';


--
-- Name: COLUMN reservas.referencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.referencia IS 'Código o referencia de la reserva';


--
-- Name: COLUMN reservas.descripcion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.descripcion IS 'Detalles adicionales del viaje';


--
-- Name: COLUMN reservas.tour_nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.tour_nombre IS 'Nombre del tour personalizado';


--
-- Name: COLUMN reservas.tour_destino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.tour_destino IS 'Destino del tour personalizado';


--
-- Name: COLUMN reservas.tour_descripcion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.tour_descripcion IS 'Descripción detallada del tour personalizado';


--
-- Name: COLUMN reservas.fecha_inicio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.fecha_inicio IS 'Fecha de inicio del tour personalizado';


--
-- Name: COLUMN reservas.fecha_fin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reservas.fecha_fin IS 'Fecha de finalización del tour personalizado';


--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- Name: sequelize_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sequelize_meta (
    name character varying(255) NOT NULL
);


--
-- Name: tours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tours (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text DEFAULT ''::text,
    destino character varying(255) NOT NULL,
    fecha_inicio timestamp with time zone,
    fecha_fin timestamp with time zone,
    precio numeric(10,2) DEFAULT 0,
    cupo_maximo integer DEFAULT 10,
    cupos_disponibles integer DEFAULT 10 NOT NULL,
    estado public.enum_tours_estado DEFAULT 'disponible'::public.enum_tours_estado,
    imagen_url character varying(255),
    activo boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: tours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tours_id_seq OWNED BY public.tours.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_usuarios_role DEFAULT 'USER'::public.enum_usuarios_role NOT NULL,
    active boolean DEFAULT true,
    last_login timestamp with time zone,
    reset_password_token character varying(255),
    reset_password_expire timestamp with time zone,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: actividades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id SET DEFAULT nextval('public.actividades_id_seq'::regclass);


--
-- Name: alojamientos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamientos ALTER COLUMN id SET DEFAULT nextval('public.alojamientos_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: cuentas_corrientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_corrientes ALTER COLUMN id SET DEFAULT nextval('public.cuentas_corrientes_id_seq'::regclass);


--
-- Name: cuotas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas ALTER COLUMN id SET DEFAULT nextval('public.cuotas_id_seq'::regclass);


--
-- Name: destinos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinos ALTER COLUMN id SET DEFAULT nextval('public.destinos_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones ALTER COLUMN id SET DEFAULT nextval('public.inscripciones_id_seq'::regclass);


--
-- Name: movimientos_cuenta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_cuenta ALTER COLUMN id SET DEFAULT nextval('public.movimientos_cuenta_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: resenas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas ALTER COLUMN id SET DEFAULT nextval('public.resenas_id_seq'::regclass);


--
-- Name: reserva_clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clientes ALTER COLUMN id SET DEFAULT nextval('public.reserva_clientes_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- Name: tours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours ALTER COLUMN id SET DEFAULT nextval('public.tours_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividades (id, nombre, descripcion, destino_id, duracion_horas, precio, capacidad_maxima, fecha_hora_inicio, activo, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: alojamientos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alojamientos (id, nombre, descripcion, destino_id, tipo, direccion, telefono, email, precio_noche, capacidad_personas, activo, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias (id, nombre, descripcion, activo, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, nombre, apellido, email, telefono, direccion, dni, fecha_nacimiento, activo, created_at, updated_at, deleted_at) FROM stdin;
1	ANDRES	BURGUES	andresburgues@gmail.com	03407406148	Rivadavia\n691	35702164	\N	t	2025-11-01 14:56:22.526-03	2025-11-01 14:56:22.526-03	\N
2	SANTIAGO	BURGUES	santi@gmail.com			35888466	\N	t	2026-01-05 22:20:46.666-03	2026-01-05 22:20:46.666-03	\N
4	ADRIAN	LUCIANI	dni-33255555-6888@placeholder.local	\N	\N	33255555	\N	t	2026-01-10 11:22:51.376-03	2026-01-10 11:22:51.376-03	\N
3	PEDRO	MARTINEZ	pedro@gmail.com	3407412563		23666654	\N	t	2026-01-05 22:21:07.926-03	2026-01-10 15:02:37.263-03	\N
\.


--
-- Data for Name: cuentas_corrientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_corrientes (id, reserva_id, cliente_id, monto_total, saldo_pendiente, cantidad_cuotas, estado, fecha_creacion, fecha_actualizacion, deleted_at) FROM stdin;
2	7	1	700000.00	450000.00	1	en_proceso	2026-01-10 11:56:34.568-03	2026-01-10 12:19:53.941-03	\N
1	6	1	2400000.00	2000000.00	6	en_proceso	2026-01-10 11:22:51.385-03	2026-01-10 12:21:42.792-03	\N
3	8	3	600.00	0.00	1	pagado	2026-01-10 15:03:53.769-03	2026-01-10 15:04:13.408-03	\N
\.


--
-- Data for Name: cuotas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuotas (id, cuenta_corriente_id, numero_cuota, monto, fecha_vencimiento, fecha_pago, monto_pagado, estado, metodo_pago, observaciones, fecha_creacion, fecha_actualizacion) FROM stdin;
2	1	2	400000.00	2026-03-10	\N	0.00	pendiente	\N	\N	2026-01-10 11:22:51.418-03	2026-01-10 11:22:51.418-03
3	1	3	400000.00	2026-04-10	\N	0.00	pendiente	\N	\N	2026-01-10 11:22:51.418-03	2026-01-10 11:22:51.418-03
4	1	4	400000.00	2026-05-10	\N	0.00	pendiente	\N	\N	2026-01-10 11:22:51.418-03	2026-01-10 11:22:51.418-03
5	1	5	400000.00	2026-06-10	\N	0.00	pendiente	\N	\N	2026-01-10 11:22:51.418-03	2026-01-10 11:22:51.418-03
6	1	6	400000.00	2026-07-10	\N	0.00	pendiente	\N	\N	2026-01-10 11:22:51.418-03	2026-01-10 11:22:51.418-03
7	2	1	700000.00	2026-02-10	2026-01-10 12:19:53.905-03	0.00	pagada_parcial	transferencia	\N	2026-01-10 11:56:34.578-03	2026-01-10 12:19:53.914-03
1	1	1	400000.00	2026-02-10	2026-01-10 12:21:42.785-03	0.00	pagada_parcial	transferencia	\N	2026-01-10 11:22:51.418-03	2026-01-10 12:21:42.787-03
8	3	1	600.00	2026-02-10	2026-01-10 15:04:13.401-03	600.00	pagada_total	efectivo	\N	2026-01-10 15:03:53.776-03	2026-01-10 15:04:13.404-03
\.


--
-- Data for Name: destinos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.destinos (id, nombre, descripcion, ubicacion, categoria_id, imagen_url, precio_promedio, activo, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: inscripciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscripciones (id, torneo_id, jugador_id, fecha_inscripcion, pagado, monto_abonado, fecha_pago, metodo_pago) FROM stdin;
\.


--
-- Data for Name: movimientos_cuenta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos_cuenta (id, jugador_id, tipo, monto, descripcion, referencia_id, fecha) FROM stdin;
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, correlativo, numero_comprobante, cuenta_corriente_id, cuota_id, cliente_id, usuario_id, monto, metodo_pago, fecha_pago, observaciones, extra, fecha_creacion, fecha_actualizacion) FROM stdin;
1	1	REC-000001	2	7	1	1	250000.00	transferencia	2026-01-10 12:19:53.95-03	\N	\N	2026-01-10 12:19:53.95-03	\N
2	2	REC-000002	1	1	1	1	400000.00	transferencia	2026-01-10 12:21:42.796-03	\N	\N	2026-01-10 12:21:42.796-03	\N
3	3	REC-000003	3	8	3	1	600.00	efectivo	2026-01-10 15:04:13.432-03	\N	\N	2026-01-10 15:04:13.432-03	\N
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedores (id, nombre, contacto, telefono, email, created_at) FROM stdin;
\.


--
-- Data for Name: resenas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resenas (id, usuario_id, destino_id, alojamiento_id, actividad_id, calificacion, comentario, fecha_creacion, updated_at, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: reserva_clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserva_clientes (id, reserva_id, cliente_id, tipo_cliente, created_at, updated_at) FROM stdin;
2	6	1	titular	2026-01-10 11:22:51.354-03	2026-01-10 11:22:51.354-03
3	6	4	titular	2026-01-10 11:22:51.381-03	2026-01-10 11:22:51.381-03
4	7	1	titular	2026-01-10 11:56:34.544-03	2026-01-10 11:56:34.544-03
5	8	3	titular	2026-01-10 15:03:53.749-03	2026-01-10 15:03:53.749-03
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reservas (id, codigo, tour_id, fecha_reserva, cantidad_personas, precio_unitario, estado, notas, activo, created_at, updated_at, deleted_at, referencia, descripcion, tour_nombre, tour_destino, tour_descripcion, fecha_inicio, fecha_fin, moneda_precio_unitario) FROM stdin;
6	RES-1768054971330	\N	2026-01-10	2	1200000.00	pendiente	\N	t	2026-01-10 11:22:51.33-03	2026-01-10 11:22:51.331-03	\N	\N	\N	bariloche economy	bariloche	viaje de 5 noches	2026-01-15	2026-01-21	ARS
7	RES-1768056994489	\N	2026-01-10	1	700000.00	pendiente	\N	t	2026-01-10 11:56:34.49-03	2026-01-10 11:56:34.496-03	\N	125635	\N	santiago del estero en avion	santiago del estero	viaje unico	2026-01-16	2026-01-23	ARS
8	RES-1768068233722	\N	2026-01-10	1	600.00	pendiente	\N	t	2026-01-10 15:03:53.723-03	2026-01-10 15:03:53.726-03	\N	9877777	\N	calafate baja temporada	calafate	4 noches en avion	2026-02-18	2026-02-22	USD
\.


--
-- Data for Name: sequelize_meta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sequelize_meta (name) FROM stdin;
20231025235000-create-tours.js
20231025235100-create-reservas.js
20251101154856-create-reservas.js
20231025235200-add-cliente-id-to-reservas.js
20231112235000-add-payment-fields-to-reservas.js
20251107130000-create-cuentas-corrientes.js
20251107130100-create-cuotas.js
20251118000000-update-reservas-table.js
20251120000000-create-reserva-clientes.js
20250106000000-add-tour-fields-to-reservas.js
\.


--
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tours (id, nombre, descripcion, destino, fecha_inicio, fecha_fin, precio, cupo_maximo, cupos_disponibles, estado, imagen_url, activo, created_at, updated_at, deleted_at) FROM stdin;
3	Tour economy interanitonal		Mexico, Cancun	\N	\N	0.00	4	4	disponible	\N	t	2025-11-01 12:13:17.069-03	2025-11-01 12:13:17.069-03	\N
2	Pablo		Cancun	\N	\N	0.00	10	10	disponible	\N	f	2025-11-01 12:10:11.742-03	2025-11-01 12:12:58.894-03	\N
1	Tour economy interanitonal		Mexico, Cancun	\N	\N	0.00	10	10	disponible	\N	f	2025-11-01 12:08:42.276-03	2025-11-01 12:13:00.377-03	\N
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, username, email, password, role, active, last_login, reset_password_token, reset_password_expire, email_verified, created_at, updated_at, deleted_at) FROM stdin;
2	gustavo	gustavo@gmail.com	$2a$10$FslPx/mv5ni97gD/gX8HKeyNAd3FUm0U.tadQoBOQB/JCZH14eW4G	ADMIN	t	\N	\N	\N	f	2026-01-11 01:03:37.33-03	2026-01-11 01:03:37.33-03	\N
3	delfina	delfina@gmail.com	$2a$10$ZTUmNC6yEKlMqY7Re9eixuufDy/l7hIJbIofBOgT.x3ja8zuO3bbm	USER	t	\N	\N	\N	f	2026-01-11 01:04:05.68-03	2026-01-11 01:04:05.68-03	\N
1	andres	andres@gmail.com	$2a$10$PV19LA6RMGy8RwNih56hN.gntuOOpEf5IJ3pFm1TmXTgKP99135T.	ADMIN	t	2026-01-11 01:04:05.881-03	\N	\N	t	2025-11-01 00:00:00-03	2026-01-11 01:04:05.881-03	\N
\.


--
-- Name: actividades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actividades_id_seq', 1, false);


--
-- Name: alojamientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alojamientos_id_seq', 1, false);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_id_seq', 1, false);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clientes_id_seq', 4, true);


--
-- Name: cuentas_corrientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuentas_corrientes_id_seq', 3, true);


--
-- Name: cuotas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuotas_id_seq', 8, true);


--
-- Name: destinos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.destinos_id_seq', 1, false);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscripciones_id_seq', 1, false);


--
-- Name: movimientos_cuenta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_cuenta_id_seq', 1, false);


--
-- Name: pagos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pagos_id_seq', 3, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 1, false);


--
-- Name: resenas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resenas_id_seq', 1, false);


--
-- Name: reserva_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserva_clientes_id_seq', 5, true);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservas_id_seq', 8, true);


--
-- Name: tours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tours_id_seq', 3, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: alojamientos alojamientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamientos
    ADD CONSTRAINT alojamientos_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_dni_key UNIQUE (dni);


--
-- Name: clientes clientes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_email_key UNIQUE (email);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cuentas_corrientes cuentas_corrientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_corrientes
    ADD CONSTRAINT cuentas_corrientes_pkey PRIMARY KEY (id);


--
-- Name: cuotas cuotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas
    ADD CONSTRAINT cuotas_pkey PRIMARY KEY (id);


--
-- Name: destinos destinos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinos
    ADD CONSTRAINT destinos_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_torneo_id_jugador_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_torneo_id_jugador_id_key UNIQUE (torneo_id, jugador_id);


--
-- Name: movimientos_cuenta movimientos_cuenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_cuenta
    ADD CONSTRAINT movimientos_cuenta_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_correlativo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_correlativo_key UNIQUE (correlativo);


--
-- Name: pagos pagos_cuota_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cuota_id_key UNIQUE (cuota_id);


--
-- Name: pagos pagos_numero_comprobante_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_numero_comprobante_key UNIQUE (numero_comprobante);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: resenas resenas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_pkey PRIMARY KEY (id);


--
-- Name: reserva_clientes reserva_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clientes
    ADD CONSTRAINT reserva_clientes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_codigo_key UNIQUE (codigo);


--
-- Name: reservas reservas_codigo_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_codigo_key1 UNIQUE (codigo);


--
-- Name: reservas reservas_codigo_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_codigo_key2 UNIQUE (codigo);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: sequelize_meta sequelize_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sequelize_meta
    ADD CONSTRAINT sequelize_meta_pkey PRIMARY KEY (name);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: reserva_clientes unique_reserva_cliente; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clientes
    ADD CONSTRAINT unique_reserva_cliente UNIQUE (reserva_id, cliente_id);


--
-- Name: cuentas_corrientes uq_reserva; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_corrientes
    ADD CONSTRAINT uq_reserva UNIQUE (reserva_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: usuarios usuarios_username_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key1 UNIQUE (username);


--
-- Name: usuarios usuarios_username_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key2 UNIQUE (username);


--
-- Name: cuentas_corrientes_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_corrientes_cliente_id ON public.cuentas_corrientes USING btree (cliente_id);


--
-- Name: cuentas_corrientes_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_corrientes_estado ON public.cuentas_corrientes USING btree (estado);


--
-- Name: cuentas_corrientes_reserva_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_corrientes_reserva_id ON public.cuentas_corrientes USING btree (reserva_id);


--
-- Name: cuotas_cuenta_corriente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuotas_cuenta_corriente_id ON public.cuotas USING btree (cuenta_corriente_id);


--
-- Name: cuotas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuotas_estado ON public.cuotas USING btree (estado);


--
-- Name: cuotas_fecha_vencimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuotas_fecha_vencimiento ON public.cuotas USING btree (fecha_vencimiento);


--
-- Name: cuotas_numero_cuota_cuenta_corriente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuotas_numero_cuota_cuenta_corriente_id ON public.cuotas USING btree (numero_cuota, cuenta_corriente_id);


--
-- Name: idx_cuentas_corrientes_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuentas_corrientes_cliente_id ON public.cuentas_corrientes USING btree (cliente_id);


--
-- Name: idx_cuentas_corrientes_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuentas_corrientes_estado ON public.cuentas_corrientes USING btree (estado);


--
-- Name: idx_reservas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_reservas_codigo ON public.reservas USING btree (codigo);


--
-- Name: idx_reservas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reservas_estado ON public.reservas USING btree (estado);


--
-- Name: actividades actividades_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_destino_id_fkey FOREIGN KEY (destino_id) REFERENCES public.destinos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alojamientos alojamientos_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamientos
    ADD CONSTRAINT alojamientos_destino_id_fkey FOREIGN KEY (destino_id) REFERENCES public.destinos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cuentas_corrientes cuentas_corrientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_corrientes
    ADD CONSTRAINT cuentas_corrientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuentas_corrientes cuentas_corrientes_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_corrientes
    ADD CONSTRAINT cuentas_corrientes_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cuotas cuotas_cuenta_corriente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas
    ADD CONSTRAINT cuotas_cuenta_corriente_id_fkey FOREIGN KEY (cuenta_corriente_id) REFERENCES public.cuentas_corrientes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: destinos destinos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinos
    ADD CONSTRAINT destinos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_cuenta_corriente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cuenta_corriente_id_fkey FOREIGN KEY (cuenta_corriente_id) REFERENCES public.cuentas_corrientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_cuota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cuota_id_fkey FOREIGN KEY (cuota_id) REFERENCES public.cuotas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pagos pagos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resenas resenas_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resenas resenas_alojamiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_alojamiento_id_fkey FOREIGN KEY (alojamiento_id) REFERENCES public.alojamientos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resenas resenas_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_destino_id_fkey FOREIGN KEY (destino_id) REFERENCES public.destinos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resenas resenas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resenas
    ADD CONSTRAINT resenas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE;


--
-- Name: reserva_clientes reserva_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clientes
    ADD CONSTRAINT reserva_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reserva_clientes reserva_clientes_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_clientes
    ADD CONSTRAINT reserva_clientes_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reservas reservas_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ERwuEtvna5g4PctnzmShgKE6wlMMLt8X2biZpr7NbZHTTTuDZRRaVapzt37ocJV

