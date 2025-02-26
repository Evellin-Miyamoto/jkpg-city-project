const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "12345",
  database: "postgres",
});

//connection to the database and start the server
const startServer = async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");

    //get all stores
    app.get("/api/stores", async (req, res) => {
      try {
        const result = await client.query("SELECT * FROM stores ORDER BY name");
        res.json(result.rows);
      } catch (err) {
        console.error("Error fetching stores:", err.stack);
        res
          .status(500)
          .json({ error: "Internal server error", details: err.message });
      }
    });

    app.get("/api/stores/district/:district", async (req, res) => {
      try {
        const result = await client.query(
          "SELECT * FROM stores WHERE district = $1 ORDER BY name",
          [req.params.district]
        );
        res.json(result.rows);
      } catch (err) {
        console.error("Error fetching stores by district:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/districts", async (req, res) => {
      try {
        const result = await client.query(
          "SELECT DISTINCT district FROM stores WHERE district IS NOT NULL ORDER BY district"
        );
        res.json(result.rows.map((row) => row.district));
      } catch (err) {
        console.error("Error fetching districts:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/stores/search/:query", async (req, res) => {
      try {
        const result = await client.query(
          "SELECT * FROM stores WHERE name ILIKE $1 ORDER BY name",
          [`%${req.params.query}%`]
        );
        res.json(result.rows);
      } catch (err) {
        console.error("Error searching stores:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/health", (req, res) => {
      res.json({ status: "OK", message: "Server is running" });
    });

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    //error handling
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: "Something went wrong!" });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Connection error:", err.stack);
  }
};

startServer();
