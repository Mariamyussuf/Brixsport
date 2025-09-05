/**
 * Logger PWA Icon Generator Script
 * 
 * This script creates placeholder icon files for the Logger PWA.
 * For production, replace these with proper designed icons.
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

// Directory to save icons
const outputDir = path.join(__dirname, 'public');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
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

console.log('Logger PWA icons generated successfully!');
console.log('Note: For production, replace these with properly designed icons.');