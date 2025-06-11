// Script to restore research summary images from backup or regenerate them
const fs = require('fs');
const path = require('path');

// Create research directory structure
const researchDir = 'client/public/research';
if (!fs.existsSync(researchDir)) {
  fs.mkdirSync(researchDir, { recursive: true });
}

// Check if we can restore from any backup locations
const possibleBackupPaths = [
  '../attached_assets/research-images-export',
  './backup/research',
  './client/public/research-backup'
];

let restored = false;
for (const backupPath of possibleBackupPaths) {
  if (fs.existsSync(backupPath)) {
    console.log(`Restoring research images from ${backupPath}`);
    // Copy files from backup
    const files = fs.readdirSync(backupPath);
    files.forEach(file => {
      if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
        fs.copyFileSync(path.join(backupPath, file), path.join(researchDir, file));
      }
    });
    restored = true;
    break;
  }
}

if (!restored) {
  console.log('No backup found. Research images need to be restored from original source.');
}

console.log(`Research directory contents: ${fs.readdirSync(researchDir).length} files`);