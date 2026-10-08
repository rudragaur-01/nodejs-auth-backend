import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import pool from "./config/db";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("DATABASE CONNECTED SUCCESSFULLY");

    app.listen(PORT, () => {
      console.log(`SERVER IS RUNNING AT http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

startServer();