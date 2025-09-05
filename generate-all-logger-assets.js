/**
 * Logger PWA Assets Generator Script
 * 
 * This script generates all required icons and splash screens for the Logger PWA.
 * For production, replace these with properly designed assets.
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Define icon sizes for logger
const icons = [
  { name: 'logger-apple-touch-icon.png', size: 180 },
  { name: 'logger-apple-touch-icon-152x152.png', size: 152 },
  { name: 'logger-apple-touch-icon-167x167.png', size: 167 },
  { name: 'logger-apple-touch-icon-180x180.png', size: 180 }
];

// Define splash screen sizes for logger
const splashScreens = [
  { name: 'logger-splash-640x1136.png', width: 640, height: 1136 },
  { name: 'logger-splash-750x1334.png', width: 750, height: 1334 },
  { name: 'logger-splash-1242x2208.png', width: 1242, height: 2208 },
  { name: 'logger-splash-1125x2436.png', width: 1125, height: 2436 },
  { name: 'logger-splash-1536x2048.png', width: 1536, height: 2048 }
];

// Directory to save assets
const outputDir = path.join(__dirname, 'public');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
console.log('Generating Logger icons...');
icons.forEach(icon => {
  const canvas = createCanvas(icon.size, icon.size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with a different color to distinguish logger icons
  ctx.fillStyle = '#dc2626'; // Red-600 from Tailwind for logger
  ctx.fillRect(0, 0, icon.size, icon.size);
  
  // Draw app initial
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(icon.size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', icon.size / 2, icon.size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, icon.name), buffer);
  
  console.log(`Created: ${icon.name}`);
});

// Generate splash screens
console.log('Generating Logger splash screens...');
splashScreens.forEach(screen => {
  const canvas = createCanvas(screen.width, screen.height);
  const ctx = canvas.getContext('2d');
  
  // Fill background with a different color to distinguish logger splash screens
  ctx.fillStyle = '#dc2626'; // Red-600 from Tailwind for logger
  ctx.fillRect(0, 0, screen.width, screen.height);
  
  // Draw app name
  ctx.fillStyle = '#ffffff';
  const fontSize = Math.min(screen.width, screen.height) * 0.15;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Logger', screen.width / 2, screen.height / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, screen.name), buffer);
  
  console.log(`Created: ${screen.name}`);
});

console.log('Logger PWA assets generated successfully!');
console.log('Note: For production, replace these with properly designed assets.');