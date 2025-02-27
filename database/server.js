const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 3000;
const path = require("path");

const JWT_SECRET = "your-secret-key";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "evellinmiyamoto",
  database: "postgres",
});

//athentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

//Admin
const isAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const startServer = async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");

    //API Routes
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        console.log("Login attempt for:", username);

        const result = await client.query(
          "SELECT * FROM users WHERE username = $1",
          [username]
        );

        const user = result.rows[0];
        console.log("User found:", user ? "yes" : "no");

        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        const validPassword = await bcrypt.compare(
          password,
          user.password_hash
        );
        console.log("Password valid:", validPassword);

        if (!validPassword) {
          return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin,
          },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        const { password_hash, ...userWithoutPassword } = user;
        res.json({
          token,
          user: userWithoutPassword,
        });
      } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/auth/verify", authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });

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

    app.get("/api/stores/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await client.query(
          "SELECT * FROM stores WHERE id = $1",
          [id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }

        res.json(result.rows[0]);
      } catch (err) {
        console.error("Error fetching store:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/api/stores", authenticateToken, isAdmin, async (req, res) => {
      try {
        const {
          name,
          url,
          district,
          description,
          phone,
          email,
          address,
          categories,
        } = req.body;

        const result = await client.query(
          `INSERT INTO stores (
            name,
            url,
            district,
            description,
            phone,
            email,
            address,
            categories,
            created_by,
            last_updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
          RETURNING *`,
          [
            name,
            url,
            district,
            description,
            phone,
            email,
            address,
            categories,
            req.user.id,
          ]
        );

        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error("Error creating store:", err);
        if (err.code === "23505") {
          res
            .status(400)
            .json({ error: "A store with this name already exists" });
        } else {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    });

    app.put("/api/stores/:id", authenticateToken, isAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const {
          name,
          url,
          district,
          description,
          phone,
          email,
          address,
          categories,
        } = req.body;

        const result = await client.query(
          `UPDATE stores 
          SET name = $1,
              url = $2,
              district = $3,
              description = $4,
              phone = $5,
              email = $6,
              address = $7,
              categories = $8,
              last_updated_by = $9,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *`,
          [
            name,
            url,
            district,
            description,
            phone,
            email,
            address,
            categories,
            req.user.id,
            id,
          ]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Store not found" });
        }

        res.json(result.rows[0]);
      } catch (err) {
        console.error("Error updating store:", err);
        if (err.code === "23505") {
          res
            .status(400)
            .json({ error: "A store with this name already exists" });
        } else {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    });

    app.delete(
      "/api/stores/:id",
      authenticateToken,
      isAdmin,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await client.query(
            "DELETE FROM stores WHERE id = $1 RETURNING *",
            [id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ error: "Store not found" });
          }

          res.json({ message: "Store deleted successfully" });
        } catch (err) {
          console.error("Error deleting store:", err);
          res.status(500).json({ error: "Internal server error" });
        }
      }
    );

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

    //static files
    app.use(express.static(path.join(__dirname, "../public")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Connection error:", err.stack);
  }
};

startServer();
