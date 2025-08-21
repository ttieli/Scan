# QR 工具集

一个简单实用的二维码生成和扫描工具集，无需安装任何应用。

## 功能特性

### 二维码生成器
- 支持长文本自动分片（每片最大1000字节）
- 实时显示文本长度和字节数
- 纯前端实现，数据安全

### 二维码扫描器（手机专用）
- 无需安装APP，浏览器直接使用
- 支持多片二维码自动合并
- 支持乱序扫描，自动排序
- 扫描完成自动复制到剪贴板
- 震动反馈提升扫描体验

## 使用方法

### 在线访问
访问 GitHub Pages 部署的在线版本：`https://[your-username].github.io/qr-tools/`

### 本地使用
1. 克隆仓库
```bash
git clone https://github.com/[your-username]/qr-tools.git
```

2. 使用任意 HTTP 服务器运行
```bash
python -m http.server 8000
# 或
npx serve
```

3. 在浏览器访问 `http://localhost:8000`

## 技术栈
- 纯 HTML/CSS/JavaScript
- jsQR 库用于二维码扫描
- 自实现的二维码生成算法
- 无需任何构建工具

## 浏览器兼容性
- Chrome/Edge 80+
- Safari 14+
- Firefox 78+
- 需要支持 WebRTC (getUserMedia API)

## 许可证
MIT License