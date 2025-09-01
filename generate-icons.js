#!/usr/bin/env node

/**
 * PWA图标生成器
 * 从单个源图片生成所有PWA所需的图标尺寸
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 定义所需的图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 源图片和输出目录
const sourceImage = path.join(__dirname, 'public', 'icons', 'image.png');
const outputDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  try {
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('🎨 开始生成PWA图标...');
    console.log(`📁 源文件: ${sourceImage}`);
    console.log(`📂 输出目录: ${outputDir}\n`);

    // 检查源文件是否存在
    try {
      await fs.access(sourceImage);
    } catch (error) {
      console.error('❌ 源文件不存在:', sourceImage);
      console.log('请确保 public/icons/image.png 存在');
      process.exit(1);
    }

    // 为每个尺寸生成图标
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      try {
        await sharp(sourceImage)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputFile);
        
        console.log(`✅ 生成成功: icon-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ 生成失败 (${size}x${size}):`, error.message);
      }
    }

    // 生成favicon.ico (多尺寸)
    try {
      // 生成16x16和32x32的favicon
      await sharp(sourceImage)
        .resize(32, 32)
        .toFile(path.join(outputDir, 'favicon-32x32.png'));
      
      await sharp(sourceImage)
        .resize(16, 16)
        .toFile(path.join(outputDir, 'favicon-16x16.png'));
      
      console.log('✅ 生成成功: favicon尺寸');
    } catch (error) {
      console.error('❌ Favicon生成失败:', error.message);
    }

    // 生成Apple Touch图标
    try {
      await sharp(sourceImage)
        .resize(180, 180)
        .png()
        .toFile(path.join(outputDir, 'apple-touch-icon.png'));
      
      console.log('✅ 生成成功: apple-touch-icon.png');
    } catch (error) {
      console.error('❌ Apple Touch图标生成失败:', error.message);
    }

    // 更新manifest.json
    await updateManifest();
    
    console.log('\n🎉 所有图标生成完成！');
    
  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

async function updateManifest() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // 更新图标数组
    manifest.icons = sizes.map(size => ({
      src: `/public/icons/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any maskable'
    }));
    
    // 写回文件
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    
    console.log('✅ manifest.json 已更新');
  } catch (error) {
    console.error('⚠️  更新manifest.json失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateIcons();
}

module.exports = generateIcons;