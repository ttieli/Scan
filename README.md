# QR数据传输系统 - 完全离线版

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-brightgreen)](https://ttieli.github.io/Scan/)

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

- **sender.html** - 生成QR码，支持平铺/循环显示
- **receiver.html** - 扫描QR码，自动合并多片数据
- **index.html** - 导航主页

## ⚠️ 注意事项

摄像头功能需要HTTPS或localhost环境（浏览器安全限制）

## 📄 许可证

MIT License - 自由使用

---

极简、安全、可靠的离线数据传输方案