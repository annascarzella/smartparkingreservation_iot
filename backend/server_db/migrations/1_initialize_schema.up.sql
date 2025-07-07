BEGIN;

CREATE SCHEMA IF NOT EXISTS smartparking;
set search_path to smartparking;

create type gateway_status as enum ('connected', 'not_connected', 'unknown');

create type lock_status as enum ('reserved', 'occupied', 'free', 'out_of_order');

create type lock_alarm as enum ('on', 'off');

create type lock_magneticsensor as enum ('on', 'off');



CREATE TABLE IF NOT EXISTS gateway (
    id serial PRIMARY KEY,
    name varchar(50) NOT NULL,
    status gateway_status DEFAULT 'unknown',
    latitude numeric(9, 6) NOT NULL,
    longitude numeric(9, 6) NOT NULL,
    UNIQUE (name, latitude, longitude)
);


CREATE TABLE IF NOT EXISTS lock (
    id serial PRIMARY KEY,
    status lock_status DEFAULT 'free',
    alarm lock_alarm DEFAULT 'off',
    magneticsensor lock_magneticsensor DEFAULT 'off',
    gateway_id int NOT NULL REFERENCES gateway(id) ON UPDATE CASCADE,
    latitude numeric(9, 6) NOT NULL,
    longitude numeric(9, 6) NOT NULL,
    UNIQUE (gateway_id, latitude, longitude)
);

CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    name varchar(50) NOT NULL,
    email varchar(100) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation (
    id serial PRIMARY KEY,
    user_id int NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    lock_id int NOT NULL REFERENCES lock(id) ON UPDATE CASCADE ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    plate_number varchar(7) NOT NULL,
    UNIQUE (user_id, lock_id, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS heartbeats (
    id serial PRIMARY KEY,
    gateway_id int NOT NULL REFERENCES gateway(id) ON UPDATE CASCADE ON DELETE CASCADE,
    lock_id int NOT NULL REFERENCES lock(id) ON UPDATE CASCADE ON DELETE CASCADE,
    status lock_status DEFAULT 'free',
    timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gateway (name, status, latitude, longitude) VALUES
('Gateway 1', 'connected', 44.401986, 8.971098),
('Gateway 2', 'connected', 44.401412, 8.971528),
('Gateway 3', 'connected', 44.400338, 8.970780);

INSERT INTO lock (gateway_id, latitude, longitude, status, alarm, magneticsensor) VALUES
(1, 44.401303, 8.970888, 'free', 'off', 'off'),
(1, 44.401333, 8.971132, 'free', 'off', 'off'),
(2, 44.400877, 8.971206, 'free', 'off', 'off'),
(3, 44.400657, 8.970861, 'free', 'off', 'off');

INSERT INTO users (name, email, password_hash) VALUES
('Anna', 'anna@gmail.com', '$2a$12$MrvOSALMutnnPQzDIOxh7.GNhI13wC.Hut9oVE9l2w4BSztglZVGu'), -- password1
('Luigi', 'luigi@gmail.com', '$2a$12$MrvOSALMutnnPQzDIOxh7.GNhI13wC.Hut9oVE9l2w4BSztglZVGu'), -- password1
('Michele', 'michele@gmail.com', '$2a$12$MrvOSALMutnnPQzDIOxh7.GNhI13wC.Hut9oVE9l2w4BSztglZVGu'); -- password1

COMMIT;
