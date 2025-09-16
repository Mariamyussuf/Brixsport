/**
 * PWA Icon Generator Script
 * 
 * This script creates placeholder icon files for PWA.
 * For production, replace these with proper designed icons.
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Define icon sizes
const icons = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-256x256.png', size: 256 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-167x167.png', size: 167 },
  { name: 'apple-touch-icon-180x180.png', size: 180 }
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
  
  // Fill background
  ctx.fillStyle = '#1e40af'; // Blue-800 from Tailwind
  ctx.fillRect(0, 0, icon.size, icon.size);
  
  // Draw app initial
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(icon.size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', icon.size / 2, icon.size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, icon.name), buffer);
  
  console.log(`Created: ${icon.name}`);
});

// Create favicon.ico by copying the 96x96 icon (browsers will accept PNG as ICO)
const sourceIcon = path.join(outputDir, 'icon-96x96.png');
const faviconPath = path.join(outputDir, 'favicon.ico');

// Copy the PNG file as favicon.ico
if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, faviconPath);
  console.log('Created: favicon.ico (copied from icon-96x96.png)');
} else {
  console.log('Warning: Could not create favicon.ico - source icon not found');
}

console.log('PWA icons generated successfully!');
console.log('Note: For production, replace these with properly designed icons.');