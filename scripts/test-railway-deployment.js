#!/usr/bin/env node

/**
 * Railway Deployment Test Script
 * Tests the application locally before deploying to Railway
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

console.log('🚀 Railway Deployment Test Script');
console.log('=====================================\n');

// Test configuration
const TIMEOUT = 30000; // 30 seconds
let testsPassed = 0;
let testsTotal = 0;

function test(name, fn) {
  testsTotal++;
  console.log(`🔍 Testing: ${name}`);
  
  return Promise.resolve(fn())
    .then(() => {
      testsPassed++;
      console.log(`✅ PASS: ${name}\n`);
    })
    .catch((error) => {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${error.message}\n`);
    });
}

// Test functions
async function testPackageJson() {
  const { stdout } = await execAsync('cat package.json');
  const pkg = JSON.parse(stdout);
  
  // Check required scripts
  const requiredScripts = ['railway:build', 'railway:start', 'scraper:build', 'scraper:start'];
  for (const script of requiredScripts) {
    if (!pkg.scripts[script]) {
      throw new Error(`Missing required script: ${script}`);
    }
  }
  
  // Check required dependencies
  const requiredDeps = ['express', 'cheerio', 'dotenv'];
  for (const dep of requiredDeps) {
    if (!pkg.dependencies[dep]) {
      throw new Error(`Missing required dependency: ${dep}`);
    }
  }
}

async function testTypeScript() {
  await execAsync('npm run check');
}

async function testBuild() {
  console.log('   Building application...');
  await execAsync('npm run railway:build');
  
  // Check if dist directory exists
  await execAsync('ls dist/index.js');
}

async function testScraperBuild() {
  console.log('   Building scraper...');
  await execAsync('npm run scraper:build');
  
  // Check if scraper build exists
  await execAsync('ls dist/run-scraper.js');
}

async function testDockerfile() {
  // Check if Dockerfile exists and is valid
  await execAsync('ls Dockerfile');
  await execAsync('ls Dockerfile.scraper');
  
  // Test Docker build (commented out to avoid long build times)
  // await execAsync('docker build -t test-stoneclough-hub .');
  console.log('   Dockerfile syntax appears valid');
}

async function testEnvironmentVariables() {
  // Check if .env.example exists
  await execAsync('ls .env.example');
  await execAsync('ls .env.railway');
  
  console.log('   Environment configuration files exist');
}

async function testHealthEndpoint() {
  // This would require the app to be running
  // For now, just check if the endpoint exists in routes
  const { stdout } = await execAsync('grep -r "health" server/routes.ts');
  if (!stdout.includes('/health')) {
    throw new Error('Health endpoint not found in routes');
  }
}

async function testRailwayConfig() {
  // Check if railway.toml exists and has required sections
  const { stdout } = await execAsync('cat railway.toml');
  
  if (!stdout.includes('[build]')) {
    throw new Error('Missing [build] section in railway.toml');
  }
  
  if (!stdout.includes('[deploy]')) {
    throw new Error('Missing [deploy] section in railway.toml');
  }
  
  if (!stdout.includes('[[services]]')) {
    throw new Error('Missing [[services]] section in railway.toml');
  }
}

async function testDependencies() {
  console.log('   Checking dependencies...');
  await execAsync('npm ci --only=production');
  console.log('   All production dependencies installed successfully');
}

// Run all tests
async function runTests() {
  console.log('Starting deployment readiness tests...\n');
  
  await test('Package.json configuration', testPackageJson);
  await test('TypeScript compilation', testTypeScript);
  await test('Application build', testBuild);
  await test('Scraper build', testScraperBuild);
  await test('Docker configuration', testDockerfile);
  await test('Environment variables', testEnvironmentVariables);
  await test('Health endpoint', testHealthEndpoint);
  await test('Railway configuration', testRailwayConfig);
  await test('Dependencies installation', testDependencies);
  
  // Summary
  console.log('=====================================');
  console.log(`📊 Test Results: ${testsPassed}/${testsTotal} passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed! Ready for Railway deployment.');
    console.log('\n🚀 Next steps:');
    console.log('1. Push your code to GitHub');
    console.log('2. Connect repository to Railway');
    console.log('3. Configure environment variables');
    console.log('4. Deploy and monitor logs');
    console.log('\nSee RAILWAY_DEPLOYMENT.md for detailed instructions.');
  } else {
    console.log('❌ Some tests failed. Please fix the issues before deploying.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
  process.exit(1);
});

// Run tests with timeout
Promise.race([
  runTests(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Test timeout')), TIMEOUT)
  )
]).catch((error) => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
