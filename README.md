# QR数据传输系统 / QR Data Transfer System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ttieli/Scan/releases)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://ttieli.github.io/Scan/)

通过动态二维码实现跨网络的安全数据传输。一个简单实用的二维码生成和扫描工具集。

## 🚀 在线体验

- **接收端**: https://ttieli.github.io/Scan/receiver.html
- **主页**: https://ttieli.github.io/Scan/

## 系统特点

- 🔒 **物理隔离**: 内网与外网完全隔离，数据通过二维码视觉传输
- 📱 **无需安装**: 纯HTML/JavaScript实现，浏览器直接运行
- 🚀 **简单易用**: 内网生成二维码，外网扫描接收
- 💾 **离线运行**: 支持完全离线使用，内置所有依赖库
- 🔄 **多片支持**: 支持长文本自动分片和自动合并
- ✅ **测试驱动**: 完整的测试套件确保可靠性
- 📲 **PWA支持**: 可安装为应用，支持离线使用
- 🌐 **双环境支持**: 同时支持纯内网部署和GitHub Pages托管

## 功能特性

### 二维码生成器
- 支持长文本自动分片（每片最大1000字节）
- 实时显示文本长度和字节数
- 纯前端实现，数据安全
- 最大数据量: 单帧10,000字符
- 纠错级别: M级（15%容错）
- 二维码尺寸: 可调节（128-512像素）

### 二维码扫描器（手机专用）
- 无需安装APP，浏览器直接使用
- 支持多片二维码自动合并
- 支持乱序扫描，自动排序
- 扫描完成自动复制到剪贴板
- 震动反馈提升扫描体验
- 扫描频率: 100ms/次

## 🎯 快速开始

### 在线使用（推荐）
直接访问 [GitHub Pages](https://ttieli.github.io/Scan/) 即可使用，无需安装。

### 本地部署
```bash
# 克隆仓库
git clone https://github.com/ttieli/Scan.git
cd Scan

# 安装依赖（可选，仅用于开发）
npm install

# 启动本地服务器
npm run serve
# 或使用Python
python -m http.server 8888
```

访问 `http://localhost:8888`

## 使用方法

### 发送端（内网）
1. 打开 `sender.html`
2. 输入要传输的文本
3. 点击"生成二维码"
4. 二维码将在屏幕上显示

### 接收端（外网）
1. 访问 GitHub Pages: https://ttieli.github.io/Scan/receiver.html
2. 点击"启动摄像头"
3. 将摄像头对准屏幕上的二维码
4. 数据自动接收并保存


## 技术栈
- 纯 HTML/CSS/JavaScript
- jsQR 库用于二维码扫描
- qrcode.js 用于二维码生成
- 无需任何构建工具或框架

## 文件结构

```
Scan/
├── index.html           # 项目主页
├── sender.html          # 发送端（支持离线）
├── receiver.html        # 接收端（支持离线）
├── manifest.json        # PWA配置
├── service-worker.js    # Service Worker缓存策略
├── config.js           # 环境检测配置
├── js/
│   └── resource-loader.js  # 资源加载器
├── libs/
│   ├── qrcode.min.js   # QR码生成库（本地）
│   └── jsQR.js         # QR码扫描库（本地）
├── public/icons/       # PWA图标
├── tests/              # 测试文件
├── README.md           # 项目说明
└── package.json        # 项目配置
```

## 浏览器兼容性
- Chrome/Edge 80+
- Safari 14+
- Firefox 78+
- 需要支持 WebRTC (getUserMedia API)

## 部署说明

1. Fork此项目
2. 在Settings中启用GitHub Pages
3. 选择main分支作为源
4. 访问 `https://[你的用户名].github.io/Scan/`

## 应用场景

- 📱 跨设备文本传输
- 🔒 物理隔离网络间的数据传递
- 📋 临时数据分享
- 🚀 无需安装APP的快速传输

## 📚 项目文档

- [更新日志](docs/CHANGELOG.md) - 版本历史和更新内容
- [功能特性](docs/FEATURES.md) - 详细功能说明
- [开发指南](docs/DEVELOPMENT.md) - 开发环境搭建
- [贡献指南](docs/CONTRIBUTING.md) - 如何参与贡献
- [项目结构](docs/PROJECT_STRUCTURE.md) - 代码结构说明

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](docs/CONTRIBUTING.md)。

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [qrcode.js](https://github.com/davidshimjs/qrcodejs) - QR码生成库
- [jsQR](https://github.com/cozmo/jsQR) - QR码扫描库
- 所有贡献者和用户

---

Made with ❤️ by [TieLi](https://github.com/ttieli)