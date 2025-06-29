#!/usr/bin/env node

/**
 * Unified Build System for FinanceAI Multi-Version Architecture
 * Builds: Server Web, PWA, and Android APK from shared codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSIONS = {
  'server-web': {
    name: 'Server Web (Enterprise)',
    buildDir: 'dist/server-web',
    commands: [
      'npm run build:shared',
      'npm run build:server',
      'npm run build:client'
    ],
    assets: ['client', 'server', 'shared'],
    environment: ['production'],
    output: 'dist/server-web'
  },
  
  'pwa': {
    name: 'Progressive Web App',
    buildDir: 'dist/pwa',
    commands: [
      'npm run build:shared',
      'npm run build:pwa-client',
      'npm run build:pwa-server'
    ],
    assets: ['pwa', 'shared'],
    environment: ['pwa'],
    output: 'dist/pwa',
    manifest: 'pwa/manifest/app.webmanifest',
    serviceWorker: 'pwa/offline/service-worker.js'
  },
  
  'android': {
    name: 'Android APK',
    buildDir: 'dist/android',
    commands: [
      'npm run build:shared',
      'npm run build:pwa-client',
      './gradlew assembleRelease'
    ],
    assets: ['android', 'shared'],
    environment: ['android'],
    output: 'app/build/outputs/apk/release',
    apk: 'app-release.apk'
  }
};

class UnifiedBuilder {
  constructor() {
    this.version = process.env.npm_package_version || '2.8.0';
    this.timestamp = new Date().toISOString();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async buildAll() {
    this.log('Starting unified build process for FinanceAI v' + this.version);
    
    for (const [versionKey, config] of Object.entries(VERSIONS)) {
      await this.buildVersion(versionKey, config);
    }
    
    this.generateBuildReport();
    this.log('All versions built successfully!');
  }

  async buildVersion(versionKey, config) {
    this.log(`Building ${config.name}...`);
    
    try {
      // Clean previous build
      this.cleanBuildDir(config.buildDir);
      
      // Create build directory
      this.ensureDir(config.buildDir);
      
      // Copy shared assets
      this.copySharedAssets(config);
      
      // Run build commands
      for (const command of config.commands) {
        this.log(`Running: ${command}`);
        this.executeCommand(command, versionKey);
      }
      
      // Version-specific post-processing
      await this.postProcess(versionKey, config);
      
      this.log(`${config.name} built successfully`);
      
    } catch (error) {
      this.log(`Failed to build ${config.name}: ${error.message}`, 'error');
      throw error;
    }
  }

  cleanBuildDir(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  copySharedAssets(config) {
    for (const asset of config.assets) {
      if (fs.existsSync(asset)) {
        const dest = path.join(config.buildDir, asset);
        this.ensureDir(path.dirname(dest));
        this.copyRecursive(asset, dest);
      }
    }
  }

  copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    
    if (stat.isDirectory()) {
      this.ensureDir(dest);
      const items = fs.readdirSync(src);
      
      for (const item of items) {
        this.copyRecursive(
          path.join(src, item),
          path.join(dest, item)
        );
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  executeCommand(command, version) {
    try {
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          BUILD_VERSION: version,
          BUILD_TIMESTAMP: this.timestamp
        }
      });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }

  async postProcess(versionKey, config) {
    switch (versionKey) {
      case 'pwa':
        await this.processPWA(config);
        break;
      case 'android':
        await this.processAndroid(config);
        break;
      case 'server-web':
        await this.processServerWeb(config);
        break;
    }
  }

  async processPWA(config) {
    this.log('Processing PWA-specific assets...');
    
    // Copy manifest
    if (config.manifest && fs.existsSync(config.manifest)) {
      const manifestDest = path.join(config.buildDir, 'manifest.json');
      fs.copyFileSync(config.manifest, manifestDest);
    }
    
    // Copy service worker
    if (config.serviceWorker && fs.existsSync(config.serviceWorker)) {
      const swDest = path.join(config.buildDir, 'sw.js');
      fs.copyFileSync(config.serviceWorker, swDest);
    }
    
    // Generate PWA metadata
    const pwaInfo = {
      version: this.version,
      buildTime: this.timestamp,
      type: 'pwa',
      features: {
        offline: true,
        installable: true,
        pushNotifications: true
      }
    };
    
    fs.writeFileSync(
      path.join(config.buildDir, 'pwa-info.json'),
      JSON.stringify(pwaInfo, null, 2)
    );
  }

  async processAndroid(config) {
    this.log('Processing Android-specific assets...');
    
    // Copy APK to build directory if it exists
    const apkSource = path.join(config.output, config.apk);
    if (fs.existsSync(apkSource)) {
      const apkDest = path.join(config.buildDir, `financeai-v${this.version}.apk`);
      fs.copyFileSync(apkSource, apkDest);
    }
    
    // Generate Android metadata
    const androidInfo = {
      version: this.version,
      versionCode: this.getVersionCode(),
      buildTime: this.timestamp,
      type: 'android',
      minSdkVersion: 24,
      targetSdkVersion: 34
    };
    
    fs.writeFileSync(
      path.join(config.buildDir, 'android-info.json'),
      JSON.stringify(androidInfo, null, 2)
    );
  }

  async processServerWeb(config) {
    this.log('Processing Server Web assets...');
    
    // Generate server metadata
    const serverInfo = {
      version: this.version,
      buildTime: this.timestamp,
      type: 'server-web',
      nodeVersion: process.version,
      features: {
        fullLLM: true,
        adminPanel: true,
        knowledgeBase: true,
        multiUser: true
      }
    };
    
    fs.writeFileSync(
      path.join(config.buildDir, 'server-info.json'),
      JSON.stringify(serverInfo, null, 2)
    );
  }

  getVersionCode() {
    // Convert semantic version to Android version code
    const parts = this.version.split('.').map(n => parseInt(n));
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  generateBuildReport() {
    const report = {
      buildTime: this.timestamp,
      version: this.version,
      versions: {}
    };
    
    for (const [key, config] of Object.entries(VERSIONS)) {
      const buildDir = config.buildDir;
      const exists = fs.existsSync(buildDir);
      
      report.versions[key] = {
        name: config.name,
        built: exists,
        buildDir: buildDir,
        size: exists ? this.getDirSize(buildDir) : 0
      };
    }
    
    // Write report
    const reportPath = 'dist/build-report.json';
    this.ensureDir('dist');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Log summary
    this.log('\n📊 Build Report:');
    for (const [key, info] of Object.entries(report.versions)) {
      const status = info.built ? '✅' : '❌';
      const size = (info.size / 1024 / 1024).toFixed(2);
      this.log(`${status} ${info.name}: ${size}MB`);
    }
  }

  getDirSize(dirPath) {
    let totalSize = 0;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        totalSize += this.getDirSize(itemPath);
      } else {
        totalSize += stat.size;
      }
    }
    
    return totalSize;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const builder = new UnifiedBuilder();
  
  try {
    switch (command) {
      case 'all':
        await builder.buildAll();
        break;
      case 'server-web':
      case 'pwa':
      case 'android':
        await builder.buildVersion(command, VERSIONS[command]);
        break;
      default:
        console.log('Usage: node unified-build.js [all|server-web|pwa|android]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UnifiedBuilder;