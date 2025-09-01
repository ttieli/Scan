# 开发指南

## 🚀 快速开始

### 环境要求
- Node.js 14+ (可选，用于开发服务器)
- 现代浏览器（Chrome 80+, Firefox 78+, Safari 14+）
- HTTPS环境（生产环境）或 localhost（开发环境）

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/ttieli/Scan.git
cd Scan
```

2. **启动本地服务器**

方式一：Python
```bash
python3 -m http.server 8000
# 访问 http://localhost:8000
```

方式二：Node.js
```bash
npx serve
# 或
npm install -g serve
serve
```

方式三：VS Code Live Server
- 安装 Live Server 扩展
- 右键点击 `index.html` → "Open with Live Server"

## 🏗️ 项目架构

### 技术栈
- **前端**：纯 HTML5 + CSS3 + JavaScript (ES6+)
- **QR生成**：qrcode.js
- **QR扫描**：jsQR
- **PWA**：Service Worker + Web App Manifest
- **测试**：自定义轻量级测试框架

### 核心模块

#### 1. 发送端 (sender.html)
```javascript
// 主要功能
- QR码生成
- 数据分片（大于1000字节自动分片）
- Base64编码
- 播放控制（多片轮播）
```

#### 2. 接收端 (receiver.html)
```javascript
// 主要功能
- 摄像头访问
- QR码扫描
- 数据重组
- 本地存储
- 会话管理
```

#### 3. PWA支持
```javascript
// Service Worker策略
- Cache First：静态资源
- Network First：API请求
- Offline Fallback：离线页面
```

## 📝 代码规范

### HTML规范
```html
<!-- 使用语义化标签 -->
<section class="scanner-section">
  <header>
    <h2>扫描器</h2>
  </header>
  <main>
    <!-- 内容 -->
  </main>
</section>

<!-- 自定义属性使用 data- 前缀 -->
<div data-session-id="123" data-status="active">
```

### CSS规范
```css
/* BEM命名规范 */
.block__element--modifier

/* 示例 */
.qr-scanner__video--active
.status-message--error

/* 使用CSS变量 */
:root {
  --primary-color: #4CAF50;
  --error-color: #f44336;
}
```

### JavaScript规范
```javascript
// 使用ES6+语法
class QRGenerator {
  constructor(options = {}) {
    this.config = {
      size: 256,
      errorCorrectionLevel: 'M',
      ...options
    };
  }

  // 使用async/await
  async generate(data) {
    try {
      const qrCode = await this.createQR(data);
      return qrCode;
    } catch (error) {
      console.error('QR generation failed:', error);
      throw error;
    }
  }
}

// 常量使用大写
const MAX_CHUNK_SIZE = 1000;
const SCAN_INTERVAL = 100;
```

## 🧪 测试

### 运行测试
1. 打开 `test.html` - 基础功能测试
2. 打开 `test-advanced.html` - 高级测试
3. 打开 `pwa-test.html` - PWA功能测试

### 添加新测试
```javascript
// 在test.html中添加测试
runner.addTest('测试名称', '类别', async () => {
  // 测试逻辑
  const result = await someFunction();
  
  // 断言
  assert(result === expected, '错误信息');
  
  return '测试通过的描述';
});
```

## 🔧 功能开发

### 添加新功能流程

1. **创建功能分支**
```bash
git checkout -b feature/your-feature
```

2. **实现功能**
- 遵循现有代码风格
- 添加必要的错误处理
- 考虑边界情况

3. **添加测试**
```javascript
// 在相应的测试文件中添加
runner.addTest('新功能测试', '功能', async () => {
  // 测试新功能
});
```

4. **更新文档**
- 更新 README.md
- 添加使用示例
- 更新 CHANGELOG.md

### 常见开发任务

#### 修改QR码大小
```javascript
// sender.html - 找到配置
this.config = {
  qrSize: 256,  // 修改此值
  // ...
};
```

#### 修改扫描频率
```javascript
// receiver.html
this.scanInterval = setInterval(() => {
  this.scanFrame();
}, 100);  // 修改间隔时间（毫秒）
```

#### 添加新的数据编码
```javascript
// 自定义编码函数
function encodeData(data) {
  // 实现编码逻辑
  return encodedData;
}

function decodeData(encodedData) {
  // 实现解码逻辑
  return originalData;
}
```

## 🐛 调试技巧

### Chrome DevTools

1. **Service Worker调试**
- 打开 DevTools → Application → Service Workers
- 查看注册状态、更新、卸载

2. **PWA调试**
- DevTools → Application → Manifest
- 检查安装状态和配置

3. **缓存调试**
- DevTools → Application → Cache Storage
- 查看和清理缓存内容

### 常见问题排查

#### 摄像头无法访问
```javascript
// 检查权限
navigator.permissions.query({name: 'camera'})
  .then(result => console.log(result.state));

// 检查HTTPS
console.log(location.protocol); // 应该是 'https:' 或 'http://localhost'
```

#### QR码无法扫描
```javascript
// 增加调试输出
console.log('Canvas size:', canvas.width, canvas.height);
console.log('Image data:', imageData);
console.log('Scan result:', code);
```

#### Service Worker不更新
```javascript
// 强制更新
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister();
  window.location.reload();
});
```

## 📦 构建和部署

### 本地构建
项目使用纯静态文件，无需构建步骤。

### 部署到GitHub Pages
```bash
# 确保所有更改已提交
git add .
git commit -m "feat: your feature"

# 推送到GitHub
git push origin main

# GitHub Pages会自动部署
```

### 部署到其他平台

#### Vercel
```bash
npm i -g vercel
vercel
```

#### Netlify
- 拖拽项目文件夹到 Netlify
- 或使用 Git 集成

## 🔒 安全考虑

### 数据安全
- 所有数据本地处理，不上传服务器
- 使用 Base64 编码防止特殊字符问题
- LocalStorage 数据加密（可选）

### CSP策略
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline';">
```

### HTTPS要求
- 摄像头API需要HTTPS
- Service Worker需要HTTPS
- 本地开发可用localhost

## 📚 相关资源

### 文档
- [MDN Web Docs](https://developer.mozilla.org/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### 库文档
- [qrcode.js](https://github.com/davidshimjs/qrcodejs)
- [jsQR](https://github.com/cozmo/jsQR)

### 工具
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Workbox](https://developers.google.com/web/tools/workbox)

## 💡 最佳实践

1. **性能优化**
   - 使用 requestAnimationFrame 进行扫描
   - 懒加载非关键资源
   - 压缩图片资源

2. **用户体验**
   - 提供清晰的错误提示
   - 添加加载状态指示
   - 支持键盘导航

3. **兼容性**
   - 渐进增强策略
   - 功能检测而非浏览器检测
   - 提供降级方案

4. **可维护性**
   - 模块化代码组织
   - 充分的注释
   - 一致的命名规范