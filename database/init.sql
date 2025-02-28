-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    url VARCHAR(255),
    district VARCHAR(100),
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    categories TEXT[],
    created_by INTEGER REFERENCES users(id),
    last_updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user (password: admin123)
INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', '$2b$10$rMt9c8tP3HqTTgKVyb5EI.KzD3p.CQH6LHqFv.wTGK2m/tepNhKIi', true)
ON CONFLICT (username) DO NOTHING; 