import path from "path";
import fs from "fs";
import express from "express";
import { createServer } from "./index.js";

const app = createServer();
const port = process.env.PORT || 3000;

// Optionally serve a built SPA when present alongside the server bundle
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distPath = path.join(__dirname, "../spa");
const hasSpa = fs.existsSync(distPath);

if (hasSpa) {
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return next();
    }
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).json({ error: "SPA not built" });
  });
}

app.listen(port, () => {
  console.log("Fusion Starter backend is up.");
  console.log(`Listening on port ${port}`);
  console.log(`API base: http://localhost:${port}/api`);
  console.log(`Health check: http://localhost:${port}/api/ping`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
