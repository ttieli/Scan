#!/usr/bin/env node

/**
 * 版本发布脚本
 * 用法: node scripts/release.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取版本类型
const releaseType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major'];

if (!validTypes.includes(releaseType)) {
    console.error(`Invalid release type: ${releaseType}`);
    console.log('Usage: node scripts/release.js [patch|minor|major]');
    process.exit(1);
}

// 读取当前版本
const versionFile = path.join(__dirname, '..', 'version.json');
const packageFile = path.join(__dirname, '..', 'package.json');

const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));

// 解析版本号
const currentVersion = versionData.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 计算新版本号
let newVersion;
switch (releaseType) {
    case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
    case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
}

// 更新版本文件
versionData.version = newVersion;
versionData.releaseDate = new Date().toISOString().split('T')[0];

// 确定代号
const codenames = {
    '1.0.0': 'Genesis',
    '1.1.0': 'Phoenix',
    '1.2.0': 'Quantum',
    '1.3.0': 'Aurora',
    '2.0.0': 'Horizon',
    '2.1.0': 'Nebula',
    '2.2.0': 'Eclipse',
    '3.0.0': 'Infinity'
};

// 如果有预定义代号就使用，否则生成一个
versionData.codename = codenames[newVersion] || `Release-${newVersion}`;

// 更新package.json
packageData.version = newVersion;

// 写入文件
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');

console.log(`✅ Version updated from ${currentVersion} to ${newVersion}`);
console.log(`📝 Codename: ${versionData.codename}`);
console.log(`📅 Release Date: ${versionData.releaseDate}`);

// 更新Service Worker缓存版本
const swFile = path.join(__dirname, '..', 'service-worker.js');
let swContent = fs.readFileSync(swFile, 'utf8');
swContent = swContent.replace(
    /const CACHE_NAME = 'qr-transfer-v[\d.]+'/,
    `const CACHE_NAME = 'qr-transfer-v${newVersion}'`
);
fs.writeFileSync(swFile, swContent);
console.log('✅ Service Worker cache version updated');

// 询问是否创建Git标签
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n📌 Create Git tag for this release? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
        try {
            // 添加所有更改
            execSync('git add -A', { stdio: 'inherit' });
            
            // 提交更改
            const commitMessage = `chore: release v${newVersion} "${versionData.codename}"`;
            execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
            
            // 创建标签
            const tagMessage = `Release v${newVersion} - ${versionData.codename}`;
            execSync(`git tag -a v${newVersion} -m "${tagMessage}"`, { stdio: 'inherit' });
            
            console.log(`\n✅ Git tag v${newVersion} created`);
            console.log('\n📤 To push the release:');
            console.log('   git push origin main');
            console.log(`   git push origin v${newVersion}`);
        } catch (error) {
            console.error('❌ Git operations failed:', error.message);
        }
    }
    
    console.log('\n🎉 Release preparation complete!');
    rl.close();
});