#!/usr/bin/env node

// TV Tantrum Next.js Catalog Startup
import { exec } from 'child_process';

console.log('Starting TV Tantrum Next.js Catalog...');

const nextProcess = exec('npx next dev --port 3000 --hostname 0.0.0.0', {
  env: process.env
});

nextProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

nextProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGTERM', () => nextProcess.kill('SIGTERM'));
process.on('SIGINT', () => nextProcess.kill('SIGINT'));