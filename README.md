# QR数据传输系统 / QR Data Transfer System

通过动态二维码实现跨网络的安全数据传输。一个简单实用的二维码生成和扫描工具集。

## 🚀 在线体验

- **接收端**: https://ttieli.github.io/Scan/receiver.html
- **主页**: https://ttieli.github.io/Scan/

## 系统特点

- 🔒 **物理隔离**: 内网与外网完全隔离，数据通过二维码视觉传输
- 📱 **无需安装**: 纯HTML/JavaScript实现，浏览器直接运行
- 🚀 **简单易用**: 内网生成二维码，外网扫描接收
- 💾 **离线运行**: sender.html完全离线，所有代码内嵌
- 🔄 **多片支持**: 支持长文本自动分片和自动合并
- ✅ **测试驱动**: 完整的测试套件确保可靠性

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

### 本地使用
```bash
# 克隆仓库
git clone https://github.com/ttieli/Scan.git

# 使用HTTP服务器运行
python -m http.server 8000
# 或
npx serve
```

## 技术栈
- 纯 HTML/CSS/JavaScript
- jsQR 库用于二维码扫描
- qrcode.js 用于二维码生成
- 无需任何构建工具或框架

## 文件结构

```
Scan/
├── index.html         # 项目主页
├── sender.html        # 发送端（完全离线）
├── receiver.html      # 接收端（支持在线托管）
├── README.md          # 项目说明
└── package.json       # 项目配置
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

## License

MIT License