#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Starting Next.js TV Tantrum Catalog...');

const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000', '--hostname', '0.0.0.0'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...process.env }
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
});