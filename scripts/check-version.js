#!/usr/bin/env node

/**
 * 版本一致性检查脚本
 * 确保所有文件中的版本号一致
 */

const fs = require('fs');
const path = require('path');

const files = {
    'version.json': null,
    'package.json': null,
    'service-worker.js': null
};

// 读取version.json
const versionFile = path.join(__dirname, '..', 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
files['version.json'] = versionData.version;

// 读取package.json
const packageFile = path.join(__dirname, '..', 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
files['package.json'] = packageData.version;

// 读取service-worker.js中的版本
const swFile = path.join(__dirname, '..', 'service-worker.js');
const swContent = fs.readFileSync(swFile, 'utf8');
const swMatch = swContent.match(/const CACHE_NAME = 'qr-transfer-v([\d.]+)'/);
if (swMatch) {
    files['service-worker.js'] = swMatch[1];
}

// 检查版本一致性
console.log('🔍 Version Check Report:');
console.log('========================');

let hasError = false;
const versions = Object.values(files).filter(v => v);
const uniqueVersions = [...new Set(versions)];

for (const [file, version] of Object.entries(files)) {
    if (version) {
        const status = version === files['version.json'] ? '✅' : '❌';
        console.log(`${status} ${file}: v${version}`);
        if (version !== files['version.json']) {
            hasError = true;
        }
    }
}

console.log('========================');

if (hasError) {
    console.log('❌ Version mismatch detected!');
    console.log(`   Expected: v${files['version.json']}`);
    console.log('   Run "npm run version:sync" to fix');
    process.exit(1);
} else {
    console.log('✅ All versions are consistent: v' + files['version.json']);
    console.log('📅 Release Date: ' + versionData.releaseDate);
    console.log('🏷️  Codename: ' + versionData.codename);
}