# QR数据传输系统 - 完全离线版

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-brightgreen)](https://ttieli.github.io/Scan/)
[![Version](https://img.shields.io/badge/Version-2.1.0-blue)](https://github.com/ttieli/Scan)

通过QR码实现完全离线的数据传输，仅需3个HTML文件。

## 🚀 在线体验

- **GitHub Pages**: https://ttieli.github.io/Scan/
- **发送端**: https://ttieli.github.io/Scan/sender.html
- **接收端**: https://ttieli.github.io/Scan/receiver.html

## 📦 极简结构

```
仅3个文件：
├── index.html      # 主页（6.7KB）
├── sender.html     # 发送端（23.5KB）
└── receiver.html   # 接收端（254KB）
```

## ✨ 核心特性

- 🔒 **完全离线** - 所有代码内嵌，无需网络
- 📱 **零依赖** - 无需安装任何软件
- 🚀 **即开即用** - 下载即可使用
- 🌐 **跨平台** - 支持所有现代浏览器
- 📊 **智能分片** - 自动处理长文本
- 🎯 **iOS优化** - 完美支持Safari浏览器
- 📷 **摄像头控制** - 可调整显示大小/隐藏画面
- 🔊 **音效反馈** - 扫描成功提示音

## 💡 使用方法

### 方式一：直接使用（仅发送）
1. 下载3个HTML文件
2. 双击打开 `sender.html`
3. 输入文本，生成QR码

### 方式二：完整功能（推荐）
```bash
# 启动本地服务器
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 方式三：GitHub Pages
直接访问 https://ttieli.github.io/Scan/

## 📱 功能说明

### 发送端 (sender.html)
- 📝 文本输入，支持中文和特殊字符
- 🎯 智能分片：根据文本长度自动优化
- 📊 两种显示模式：平铺/循环播放
- ⚡ Base64编码确保中文兼容性

### 接收端 (receiver.html)
- 📷 摄像头扫描QR码
- 🔍 实时显示扫描进度（X/Y片）
- 📊 可视化片段接收状态
- 🎮 摄像头显示控制（隐藏/最小化/正常）
- 📱 iOS Safari完美支持
- 🔊 扫描成功音效提示

### 主页 (index.html)
- 🏠 快速导航到发送/接收端
- 📖 功能介绍和使用说明

## 🎯 最新更新 (v2.1.0)

### 2025-09-02
- ✅ **智能分片优化**：长文本自动调整分片大小，减少QR码数量
- ✅ **iOS Safari支持**：修复扫描界面显示问题，优化移动端体验
- ✅ **摄像头控制**：新增隐藏/最小化功能，节省屏幕空间
- ✅ **进度可视化**：彩色显示片段接收状态（绿色已接收，红色待接收）
- ✅ **音效反馈**：扫描成功时播放提示音
- ✅ **中文编码修复**：Base64编码解决微信等扫描器乱码问题

## ⚠️ 注意事项

- 摄像头功能需要HTTPS或localhost环境（浏览器安全限制）
- iOS用户建议使用Safari浏览器以获得最佳体验
- 长文本会自动分片，建议控制在1000字符以内

## 🔧 技术细节

- **分片策略**：
  - 短文本（≤500字符）：15字符/片
  - 中文本（501-1000字符）：25字符/片
  - 长文本（>1000字符）：动态计算，最多25片
- **编码方式**：Base64编码支持中文和特殊字符
- **QR纠错级别**：自适应（L/M级别）

## 📄 许可证

MIT License - 自由使用

---

极简、安全、可靠的离线数据传输方案 | [报告问题](https://github.com/ttieli/Scan/issues)