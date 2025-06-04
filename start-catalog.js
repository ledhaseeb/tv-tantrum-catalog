#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TV Tantrum Catalog Version...\n');

console.log('Features in this catalog version:');
console.log('✓ Browse page with age range sliders (0-13+)');
console.log('✓ Stimulation score filtering (1-5)');
console.log('✓ Theme-based filtering with AND/OR logic');
console.log('✓ Compare shows side-by-side');
console.log('✓ Research summaries (read-only)');
console.log('✓ Admin panel for content management');
console.log('✓ Same teal/yellow design system');
console.log('✓ All original components and styling\n');

console.log('Removed features:');
console.log('✗ User registration/authentication');
console.log('✗ Reviews and ratings');
console.log('✗ Favorites system');
console.log('✗ Gamification features');
console.log('✗ Social interactions\n');

// Start the catalog server
const serverProcess = spawn('tsx', ['server/index-catalog.ts'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
  }
});

serverProcess.on('error', (error) => {
  console.error('Failed to start catalog server:', error);
});

serverProcess.on('close', (code) => {
  console.log(`Catalog server exited with code ${code}`);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down catalog server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});