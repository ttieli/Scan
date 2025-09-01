# QR数据传输系统 / QR Data Transfer System

通过动态二维码实现内网到外网的安全数据传输。一个简单实用的二维码生成和扫描工具集。

## 项目状态 (Project Status)

✅ **Phase 1 完成**: 核心QR逻辑测试 - 49个测试全部通过
- QR生成测试: 8个测试
- QR解析测试: 16个测试  
- 数据重组测试: 9个测试
- 性能验证: 8个测试 (全部 <10ms)

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

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/ttieli/Scan.git

# 安装依赖
npm install

# 运行测试
npm run test:segmented:phase1  # 运行核心逻辑测试
npm run test:all               # 运行所有测试

# 使用HTTP服务器运行
python -m http.server 8000
# 或
npx serve
```

## 技术栈
- 纯 HTML/CSS/JavaScript
- jsQR 库用于二维码扫描
- qrcode.js 用于二维码生成
- Jest 测试框架
- Playwright E2E测试
- 无需任何构建工具

## 测试覆盖率

当前测试覆盖:
- ✅ 核心QR逻辑 (100%)
- ✅ 数据分块算法 (100%)
- ✅ 错误处理 (100%)
- ⏳ 浏览器API集成 (计划中)
- ⏳ E2E用户流程 (计划中)

## 文件结构

```
QR_Group_Scan/
├── sender.html         # 内网发送端（完全离线）
├── receiver.html       # 外网接收端（GitHub Pages托管）
├── groupscan.md       # 技术文档
├── package.json       # 项目配置
├── tests/            
│   ├── core/         # 核心逻辑测试（Phase 1完成）
│   ├── unit/         # 单元测试
│   ├── integration/  # 集成测试
│   └── e2e/         # 端到端测试
└── TESTING.md        # 测试策略文档
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

## 开发计划

- [x] Phase 1: 核心逻辑测试（完成）
- [ ] Phase 2: 浏览器API集成测试
- [ ] Phase 3: 文件传输支持
- [ ] Phase 4: 生产环境优化

## License

MIT License