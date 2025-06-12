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

CREATE TABLE IF NOT EXISTS user (
    id serial PRIMARY KEY,
    email varchar(100) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
);

CREATE TABLE IF NOT EXISTS reservation (
    id serial PRIMARY KEY,
    user_id int NOT NULL REFERENCES user(id) ON UPDATE CASCADE ON DELETE CASCADE,
    lock_id int NOT NULL REFERENCES lock(id) ON UPDATE CASCADE ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    UNIQUE (user_id, lock_id, start_time, end_time)
);

INSERT INTO gateway (name, status, latitude, longitude) VALUES
('Gateway 1', 'connected', 40.712776, -74.005974),
('Gateway 2', 'connected', 34.052235, -118.243683),
('Gateway 3', 'connected', 51.507351, -0.127758);

INSERT INTO lock (gateway_id, latitude, longitude, status, alarm, magneticsensor) VALUES
(1, 45.4642, 9.19, 'free', 'off', 'off'),
(1, 45.4645, 9.191, 'free', 'off', 'off'),
(2, 45.465, 9.192, 'free', 'off', 'off'),
(3, 45.466, 9.193, 'free', 'off', 'off');

INSERT INTO user (email, password_hash) VALUES
('user1@example.com', 'password1'),
('user2@example.com', 'password2'),
('user3@example.com', 'password3');

COMMIT;
