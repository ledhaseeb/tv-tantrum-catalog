// TV Tantrum Next.js Catalog Server
import { exec } from 'child_process';

console.log('Starting TV Tantrum Next.js Catalog...');

// Start Next.js development server
const nextProcess = exec('npx next dev --port 5000 --hostname 0.0.0.0');

nextProcess.stdout?.on('data', (data) => {
  console.log(data.toString());
});

nextProcess.stderr?.on('data', (data) => {
  console.error(data.toString());
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => nextProcess.kill('SIGTERM'));
process.on('SIGINT', () => nextProcess.kill('SIGINT'));