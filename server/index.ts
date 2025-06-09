import express from "express";
import { registerRoutes } from "./routes-simplified";

const app = express();

// Register all routes and start server
registerRoutes(app).then((server) => {
  const port = Number(process.env.PORT) || 5000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`TV Tantrum server running on port ${port}`);
    console.log(`Using database with 302 authentic TV shows`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});