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
    email varchar(100) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation (
    id serial PRIMARY KEY,
    user_id int NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    lock_id int NOT NULL REFERENCES lock(id) ON UPDATE CASCADE ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    UNIQUE (user_id, lock_id, start_time, end_time)
);


COMMIT;
