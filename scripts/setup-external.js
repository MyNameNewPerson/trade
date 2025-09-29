#!/usr/bin/env node

/**
 * Setup script for external deployment
 * This script helps configure the environment for deployment outside of Replit
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up CryptoFlow for external deployment...\n');

// Generate a secure session secret
function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    // Copy .env.example to .env
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    
    // Replace placeholder session secret with generated one
    const sessionSecret = generateSessionSecret();
    const envContent = envExample.replace(
      'SESSION_SECRET=your-super-secret-session-key-min-32-chars',
      `SESSION_SECRET=${sessionSecret}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file from template');
    console.log('🔐 Generated secure session secret');
  } else {
    console.log('❌ .env.example file not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  .env file already exists');
}

// Create production build directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

console.log('\n📋 Next steps for external deployment:');
console.log('1. Edit .env file with your actual configuration values');
console.log('2. Set up your PostgreSQL database (optional)');
console.log('3. Configure OAuth providers (optional)');
console.log('4. Run: npm run build');
console.log('5. Run: npm start');
console.log('\n🔧 For development: npm run dev');
console.log('\n📖 Check the deployment documentation for more details.');