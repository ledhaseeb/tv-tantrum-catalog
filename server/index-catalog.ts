import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import session from 'express-session';
import { setupVite, serveStatic } from './vite';
import { catalogStorage } from './catalog-storage';
import catalogRoutes from './catalog-routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'catalog-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Routes
app.use('/api', catalogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize the catalog storage
async function initializeCatalogStorage() {
  try {
    await catalogStorage.initialize();
    console.log('✅ Catalog storage initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize catalog storage:', error);
  }
}

const port = Number(process.env.PORT) || 5000;

if (process.env.NODE_ENV === 'development') {
  setupVite(app, server);
} else {
  serveStatic(app, join(__dirname, '..'));
}

// Initialize and start server
initializeCatalogStorage().then(() => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 TV Tantrum Catalog server running on port ${port}`);
    console.log(`📊 Using catalog database tables for improved performance`);
    console.log(`🎯 Simplified content discovery without social features`);
  });
});