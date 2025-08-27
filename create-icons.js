const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create the icon sizes needed for the PWA
const sizes = [192, 256, 384, 512];

// Create a basic icon - this will be a simple colored square with "BS" text
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1E40AF'; // blue-700
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.font = `bold ${size/3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('BS', size/2, size/2);
  
  // Add a sport ball icon
  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.75, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#EC4899'; // pink-500
  ctx.fill();

  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'public', `icon-${size}x${size}.png`), buffer);
  console.log(`Created icon-${size}x${size}.png`);
}

// Create all icon sizes
sizes.forEach(size => createIcon(size));

console.log('All icons created successfully!');