# QR数据传输系统

通过动态二维码实现内网到外网的安全数据传输。

## 系统特点

- 🔒 **物理隔离**: 内网与外网完全隔离，数据通过二维码视觉传输
- 📱 **无需安装**: 纯HTML/JavaScript实现，浏览器直接运行
- 🚀 **简单易用**: 内网生成二维码，外网扫描接收
- 💾 **离线运行**: sender.html完全离线，所有代码内嵌

## 使用方法

### 发送端（内网）
1. 打开 `sender.html`
2. 输入要传输的文本
3. 点击"生成二维码"
4. 二维码将在屏幕上显示

### 接收端（外网）
1. 访问 GitHub Pages: https://[你的用户名].github.io/qr-data-transfer/receiver.html
2. 点击"启动摄像头"
3. 将摄像头对准屏幕上的二维码
4. 数据自动接收并保存

## 技术规格

- **最大数据量**: 单帧10,000字符
- **纠错级别**: M级（15%容错）
- **二维码尺寸**: 可调节（128-512像素）
- **扫描频率**: 100ms/次

## 部署说明

1. Fork此项目
2. 在Settings中启用GitHub Pages
3. 选择main分支作为源
4. 访问 `https://[你的用户名].github.io/qr-data-transfer/`

## 文件说明

- `sender.html` - 内网发送端（完全离线）
- `receiver.html` - 外网接收端（GitHub Pages托管）
- `groupscan.md` - 技术文档

## 开发计划

- [x] Phase 1: 基础文本传输
- [ ] Phase 2: 数据分片协议
- [ ] Phase 3: 文件传输支持
- [ ] Phase 4: 生产环境优化

## License

MIT