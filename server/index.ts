import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDatabaseConnection } from "./db";
import multer from "multer";
import * as fs from "fs";
import axios from "axios";

async function askClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  const body = {
    model: "claude-opus-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      body,
      { headers },
    );
    return response.data.content[0].text;
  } catch (error: any) {
    console.error(
      "Error talking to Claude:",
      error.response?.data || error.message,
    );
    return "Sorry, Claude couldn’t respond.";
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve TV show images from the primary media directory
app.use(
  "/media/tv-shows",
  express.static(path.join(process.cwd(), "public/media/tv-shows")),
);

// Keep serving from the old locations for backward compatibility
app.use(
  "/custom-images",
  express.static(path.join(process.cwd(), "client/public/custom-images")),
);
app.use(
  "/custom-images",
  express.static(path.join(process.cwd(), "public/media/tv-shows")),
);

// Serve research files
app.use(
  "/research",
  express.static(path.join(process.cwd(), "public/research")),
);

// Make sure research directory exists
const researchDir = path.join(process.cwd(), "public/research");
if (!fs.existsSync(researchDir)) {
  fs.mkdirSync(researchDir, { recursive: true });
}

// Configure file upload for research images
const researchStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, researchDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const researchUpload = multer({
  storage: researchStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload endpoint
app.post("/api/upload", researchUpload.single("file"), (req, res) => {
  try {
    console.log("Research file upload request received");

    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/research/${req.file.filename}`;
    console.log(`File uploaded successfully to ${fileUrl}`);

    return res.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

// ✅ Claude integration endpoint
app.get("/ask-claude", async (req: Request, res: Response) => {
  const question = (req.query.q as string) || "Say hello!";
  const answer = await askClaude(question);
  res.json({ answer });
});

// Request/response logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check database connection before starting the server
  await checkDatabaseConnection();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  const existingServer = await new Promise<Server>((resolve) => {
    const testServer = createServer();
    testServer.listen(port, "0.0.0.0", () => {
      testServer.close(() => resolve(server));
    });
    testServer.on("error", () => resolve(server));
  });

  existingServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
