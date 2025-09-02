# 项目目录结构

## 📁 推荐的项目结构

```
QR_Group_Scan/
│
├── 📄 核心文件
│   ├── index.html           # 主页入口
│   ├── sender.html          # 发送端页面
│   ├── receiver.html        # 接收端页面
│   ├── manifest.json        # PWA配置
│   └── service-worker.js    # Service Worker
│
├── 📁 public/               # 公共资源（建议创建）
│   ├── icons/              # PWA图标
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── images/             # 其他图片资源
│
├── 📁 tests/                # 测试文件
│   ├── test.html           # 基础测试页面
│   ├── test-advanced.html  # 高级测试页面
│   └── pwa-test.html       # PWA测试页面
│
├── 📁 docs/                 # 文档（建议创建）
│   ├── README.md           # 项目说明
│   ├── DEVELOPMENT.md      # 开发指南
│   ├── DEPLOYMENT.md       # 部署指南
│   ├── API.md             # API文档
│   └── CHANGELOG.md        # 更新日志
│
├── 📁 scripts/              # 脚本文件（建议创建）
│   └── deploy.sh           # 部署脚本
│
├── 📄 配置文件
│   ├── package.json        # 项目配置
│   ├── package-lock.json   # 依赖锁定
│   └── .gitignore         # Git忽略配置
│
└── 📁 临时/生成文件（应忽略）
    ├── node_modules/       # 依赖包
    ├── coverage/           # 测试覆盖率
    ├── test-results/       # 测试结果
    └── playwright-report/  # Playwright报告
```

## 🗂️ 目录说明

### 核心目录
- **根目录**: 存放主要的HTML文件和PWA配置
- **public/**: 静态资源文件（图标、图片等）
- **tests/**: 所有测试相关文件
- **docs/**: 项目文档
- **scripts/**: 构建和部署脚本

### 需要创建的目录
1. `public/icons/` - 存放PWA所需的各种尺寸图标
2. `docs/` - 整理和存放项目文档
3. `scripts/` - 存放自动化脚本

### 应该忽略的目录
- `node_modules/` - npm依赖
- `coverage/` - 测试覆盖率报告
- `test-results/` - 测试结果
- `playwright-report/` - E2E测试报告
- `.DS_Store` - macOS系统文件
- `*.log` - 日志文件

## 🔧 建议的重组操作

### 1. 移动测试相关文件
```bash
# 创建tests目录（如果不存在）
mkdir -p tests

# 移动测试文件
mv test.html tests/
mv test-advanced.html tests/
mv pwa-test.html tests/
```

### 2. 创建公共资源目录
```bash
# 创建public目录结构
mkdir -p public/icons
mkdir -p public/images
```

### 3. 整理文档
```bash
# 创建docs目录
mkdir -p docs

# 移动文档文件
mv README.md docs/
# 创建软链接到根目录
ln -s docs/README.md README.md
```

### 4. 清理不需要的文件
```bash
# 删除旧的测试产物
rm -rf test-results/
rm -rf playwright-report/
rm -rf coverage/

# 删除不需要上传的文件
rm -f qr-generator.html
rm -f qr-scanner-enhanced.html
rm -f qr-tool.html
```

## 📝 文件命名规范

### HTML文件
- 使用小写字母和连字符：`sender.html`, `receiver.html`
- 测试文件加`test`前缀：`test-*.html`

### JavaScript文件
- Service Worker：`service-worker.js`
- 模块使用驼峰命名：`qrGenerator.js`

### 配置文件
- 使用标准名称：`manifest.json`, `package.json`
- 点文件：`.gitignore`, `.env`

### 文档文件
- 使用大写：`README.md`, `LICENSE`
- 描述性命名：`DEVELOPMENT.md`, `DEPLOYMENT.md`

## 🚀 GitHub Pages部署结构

对于GitHub Pages部署，保持以下结构：

```
/                     # 根目录作为部署目录
├── index.html       # 主页
├── sender.html      # 核心功能页面
├── receiver.html
├── manifest.json    # PWA配置
├── service-worker.js
└── public/          # 静态资源
    └── icons/       # 图标文件
```

注意：GitHub Pages会从根目录或`docs/`目录提供服务，建议使用根目录以简化路径。