CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

INSERT INTO role (id, role_name) VALUES
(1, 'owner'),
(2, 'admin'),
(3, 'tour_guide'),
(4, 'driver');
