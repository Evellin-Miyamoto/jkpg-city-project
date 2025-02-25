const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "12345",
  database: "postgres",
});

async function initDB() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");

    //if it exists drop table
    const dropTableQuery = `DROP TABLE IF EXISTS stores;`;
    await client.query(dropTableQuery);
    console.log('Dropped existing "stores" table if it existed');

    //create stores table
    const createTableQuery = `
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        url TEXT,
        district VARCHAR(100)
      );
    `;
    await client.query(createTableQuery);
    console.log('Table "stores" created successfully');

    //parse the JSON file
    const storesData = JSON.parse(
      fs.readFileSync("database/stores.json", "utf8")
    );

    for (const store of storesData) {
      const insertQuery = `
        INSERT INTO stores (name, url, district)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING;
      `;
      await client.query(insertQuery, [store.name, store.url, store.district]);
    }
    console.log("Stores data imported successfully");
  } catch (err) {
    console.error("Error initializing database:", err.stack);
  } finally {
    await client.end();
    console.log("Disconnected from database");
  }
}

initDB();
