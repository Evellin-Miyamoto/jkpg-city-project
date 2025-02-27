const { Client } = require("pg");
const fs = require("fs");
const bcrypt = require("bcrypt");

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "evellinmiyamoto",
  database: "postgres",
});

async function initDB() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");

    // Drop existing tables if they exist
    const dropTablesQuery = `
      DROP TABLE IF EXISTS stores;
      DROP TABLE IF EXISTS users;
    `;
    await client.query(dropTablesQuery);
    console.log("Dropped existing tables if they existed");

    // Create users table
    const createUsersTableQuery = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersTableQuery);
    console.log('Table "users" created successfully');

    // Create stores table with extended information
    const createStoresTableQuery = `
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        url TEXT,
        district VARCHAR(100),
        description TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        categories TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        last_updated_by INTEGER REFERENCES users(id)
      );
    `;
    await client.query(createStoresTableQuery);
    console.log('Table "stores" created successfully');

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const createAdminQuery = `
      INSERT INTO users (username, email, password_hash, is_admin)
      VALUES ($1, $2, $3, true);
    `;
    await client.query(createAdminQuery, [
      "admin",
      "admin@example.com",
      adminPassword,
    ]);
    console.log("Admin user created successfully");

    // Read and parse the JSON file
    const storesData = JSON.parse(
      fs.readFileSync("database/stores.json", "utf8")
    );

    // Insert data with extended information
    for (const store of storesData) {
      const insertQuery = `
        INSERT INTO stores (
          name, 
          url, 
          district,
          description,
          categories,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, 1)
        ON CONFLICT (name) DO NOTHING;
      `;
      await client.query(insertQuery, [
        store.name,
        store.url,
        store.district,
        "Description will be added later",
        [store.district || "Uncategorized"],
      ]);
    }
    console.log("Stores data imported successfully");
  } catch (err) {
    console.error("Error starting database:", err.stack);
  } finally {
    await client.end();
    console.log("Disconnected from database");
  }
}

initDB();
