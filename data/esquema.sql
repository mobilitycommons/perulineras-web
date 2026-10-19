-- Base de datos de electrolineras de Perulineras (SQLite).
-- La genera `python3 scripts/electrolineras.py construir` a partir de
-- data/fuentes/*.json (instantáneas por fuente) y data/curado/*.json (capa manual).

CREATE TABLE fuente (
  id          TEXT PRIMARY KEY,          -- aap, ocm, osm, perulineras
  nombre      TEXT NOT NULL,
  url         TEXT,
  licencia    TEXT,
  atribucion  TEXT,
  publicar    INTEGER NOT NULL,          -- 0: se guarda pero no sale en el mapa
  prioridad   INTEGER NOT NULL,
  consultado  TEXT                       -- fecha de la última descarga (AAAA-MM-DD)
);

-- Un registro por estación tal como la publica cada fuente.
CREATE TABLE registro (
  id                 TEXT PRIMARY KEY,   -- "aap:12", "ocm:297116", "osm:node/123"
  fuente_id          TEXT NOT NULL REFERENCES fuente(id),
  id_origen          TEXT NOT NULL,
  nombre             TEXT,
  operador           TEXT,
  equipo             TEXT,               -- marca/modelo del cargador
  direccion          TEXT,
  localidad          TEXT,
  lat                REAL,
  lon                REAL,
  precision          TEXT,               -- exacta | lugar
  acceso             TEXT,               -- publico | clientes | privado | NULL
  costo              TEXT,               -- gratuito | pago | NULL
  horario            TEXT,
  estado             TEXT,               -- operativo | no_operativo | NULL (según la fuente)
  cargadores         INTEGER,
  conectores_total   INTEGER,
  potencia_max_kw    REAL,
  url                TEXT,
  actualizado_origen TEXT,
  excluido           TEXT,               -- motivo si data/curado/ajustes.json lo excluye
  datos              TEXT NOT NULL       -- registro normalizado completo (JSON)
);

CREATE TABLE conector (
  registro_id  TEXT NOT NULL REFERENCES registro(id),
  tipo         TEXT NOT NULL,            -- claves de assets/mapa.js: type2, type2_combo, chademo…
  corriente    TEXT,                     -- AC | DC
  cantidad     INTEGER,
  potencia_kw  REAL
);

-- Estación consolidada: uno o varios registros de distintas fuentes.
CREATE TABLE estacion (
  id                TEXT PRIMARY KEY,    -- "pl-" + registro canónico
  nombre            TEXT,
  operador          TEXT,
  equipo            TEXT,
  direccion         TEXT,
  localidad         TEXT,
  lat               REAL NOT NULL,
  lon               REAL NOT NULL,
  precision         TEXT,
  acceso            TEXT,
  costo             TEXT,
  horario           TEXT,
  cargadores        INTEGER,
  conectores_total  INTEGER,
  potencia_max_kw   REAL,
  corriente         TEXT,                -- AC | DC | AC/DC
  publicada         INTEGER NOT NULL,
  motivo_exclusion  TEXT
);

CREATE TABLE estacion_registro (
  estacion_id  TEXT NOT NULL REFERENCES estacion(id),
  registro_id  TEXT NOT NULL REFERENCES registro(id),
  PRIMARY KEY (estacion_id, registro_id)
);

CREATE TABLE verificacion (
  estacion_id  TEXT NOT NULL REFERENCES estacion(id),
  fecha        TEXT NOT NULL,
  fuente       TEXT,                     -- cómo se verificó (visita, operador, llamada…)
  nota         TEXT
);

-- Pares cercanos de distintas fuentes que no se unieron automáticamente.
CREATE TABLE posible_duplicado (
  registro_a  TEXT NOT NULL,
  registro_b  TEXT NOT NULL,
  distancia_m INTEGER NOT NULL
);

CREATE VIEW estacion_publica AS
  SELECT * FROM estacion WHERE publicada = 1;
