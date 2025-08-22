# 跨网络数据传输系统技术文档

## 系统概述

本系统通过动态二维码实现内网到外网的数据传输，支持文件和文本两种数据类型，完全基于HTML/JS技术栈，无需安装任何软件。

## 系统架构

```
内网环境(发送端)     视觉传输     外网环境(接收端)
┌─────────────┐      ┌────┐      ┌─────────────┐
│ HTML生成器  │ ──→  │屏幕│ ──→  │ 手机浏览器  │
│ 离线独立    │      │显示│      │ 摄像头扫描  │
│ 文件上传    │      │二维│      │ 本地存储    │
│ 文本输入    │      │码流│      │ 数据导出    │
└─────────────┘      └────┘      └─────────────┘
```

## 1. 内网发送端 (sender.html)

### 1.1 功能特性

* **文件上传支持** ：任意格式文件，自动读取为Base64
* **文本输入支持** ：直接输入文本内容，UTF-8编码
* **智能分片** ：根据二维码容量自动分割数据
* **动态播放** ：可调速度的循环播放
* **离线独立** ：无需网络连接，纯本地运行

### 1.2 核心JS库依赖

```html
<!-- 二维码生成库 -->
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

<!-- 或使用离线版本（推荐内网使用） -->
<script src="./libs/qrcode.min.js"></script>
```

### 1.3 数据分片协议

```javascript
// 帧数据格式
const frameFormat = {
    header: "[序号/总数][类型]",
    metadata: "[文件名|大小]" || "[]", // 文件有元数据，文本为空
    payload: "数据内容",
    checksum: "#CRC32校验码"
};

// 示例
// 文件帧：[001/050][F][document.pdf|2048KB]iVBORw0KGgoAAAANSUhEUgAA...#A1B2C3D4
// 文本帧：[001/003][T][]这是文本内容的第一部分#E5F6G7H8
```

### 1.4 关键参数配置

```javascript
const CONFIG = {
    QR_ERROR_LEVEL: 'M',        // 纠错级别：L/M/Q/H
    QR_SIZE: 256,               // 二维码像素大小
    MAX_CHUNK_SIZE: 800,        // 每帧最大数据量(字节)
    PLAY_INTERVAL: 1500,        // 播放间隔(毫秒)
    SYNC_FRAMES: 3,             // 循环间隔帧数
    SUPPORT_FORMATS: [          // 支持的文件类型
        '.txt', '.pdf', '.doc', '.jpg', '.png', 
        '.zip', '.xlsx', '.json', '.xml'
    ]
};
```

### 1.5 核心实现逻辑

```javascript
// 数据处理流程
class DataTransmitter {
    // 1. 文件读取
    async readFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file); // 转为Base64
        });
    }
  
    // 2. 数据分片
    splitData(data, metadata, type) {
        const chunks = [];
        const maxSize = CONFIG.MAX_CHUNK_SIZE;
        const totalChunks = Math.ceil(data.length / maxSize);
      
        for (let i = 0; i < totalChunks; i++) {
            const chunk = data.slice(i * maxSize, (i + 1) * maxSize);
            const frameData = this.buildFrame(i + 1, totalChunks, type, metadata, chunk);
            chunks.push(frameData);
        }
        return chunks;
    }
  
    // 3. 帧构建
    buildFrame(index, total, type, metadata, data) {
        const header = `[${index.toString().padStart(3, '0')}/${total.toString().padStart(3, '0')}][${type}]`;
        const meta = metadata ? `[${metadata}]` : '[]';
        const payload = header + meta + data;
        const checksum = '#' + this.calculateCRC32(payload);
        return payload + checksum;
    }
  
    // 4. 二维码生成和播放
    async playFrames(frames) {
        for (let i = 0; i < frames.length; i++) {
            await this.generateQR(frames[i]);
            await this.sleep(CONFIG.PLAY_INTERVAL);
        }
        // 循环播放
        this.playFrames(frames);
    }
}
```

## 2. 外网接收端 (receiver.html)

### 2.1 功能特性

* **实时摄像头扫描** ：调用手机摄像头进行实时识别
* **自动数据重组** ：智能排序和去重
* **类型自动检测** ：区分文件和文本数据
* **本地数据存储** ：使用localStorage保存接收数据
* **多种导出方式** ：文件下载、文本复制

### 2.2 核心JS库依赖

```html
<!-- 二维码识别库 -->
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>

<!-- CRC32计算库 -->
<script src="https://cdn.jsdelivr.net/npm/crc-32@1.2.2/crc32.js"></script>

<!-- 可选：文件保存库 -->
<script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
```

### 2.3 摄像头访问实现

```javascript
class CameraScanner {
    async initCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 后置摄像头
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            this.video.srcObject = this.stream;
            return true;
        } catch (error) {
            console.error('摄像头访问失败:', error);
            return false;
        }
    }
  
    startScanning() {
        this.scanInterval = setInterval(() => {
            this.scanFrame();
        }, 100); // 每100ms扫描一次
    }
  
    scanFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
      
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        context.drawImage(this.video, 0, 0);
      
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
      
        if (code) {
            this.processQRCode(code.data);
        }
    }
}
```

### 2.4 数据重组逻辑

```javascript
class DataReceiver {
    constructor() {
        this.receivedFrames = new Map(); // 存储已接收帧
        this.totalFrames = 0;
        this.dataType = null;
        this.metadata = null;
    }
  
    processFrame(qrData) {
        try {
            // 解析帧格式
            const parsed = this.parseFrame(qrData);
          
            // 验证校验码
            if (!this.verifyChecksum(parsed)) {
                console.warn('校验码错误，跳过此帧');
                return;
            }
          
            // 存储帧数据
            this.receivedFrames.set(parsed.index, parsed);
            this.totalFrames = parsed.total;
            this.dataType = parsed.type;
            this.metadata = parsed.metadata;
          
            // 更新进度
            this.updateProgress();
          
            // 检查是否接收完成
            if (this.isComplete()) {
                this.assembleData();
            }
          
        } catch (error) {
            console.error('帧处理错误:', error);
        }
    }
  
    parseFrame(frameData) {
        // 正则解析：[001/050][F][filename.pdf|2048KB]数据内容#CRC32
        const regex = /^\[(\d+)\/(\d+)\]\[([FT])\]\[(.*?)\](.*?)#([A-F0-9]+)$/;
        const match = frameData.match(regex);
      
        if (!match) throw new Error('帧格式错误');
      
        return {
            index: parseInt(match[1]),
            total: parseInt(match[2]),
            type: match[3],
            metadata: match[4],
            payload: match[5],
            checksum: match[6]
        };
    }
  
    assembleData() {
        // 按序号排序并拼接数据
        const sortedFrames = Array.from(this.receivedFrames.values())
            .sort((a, b) => a.index - b.index);
      
        const completeData = sortedFrames
            .map(frame => frame.payload)
            .join('');
      
        // 根据类型处理数据
        if (this.dataType === 'F') {
            this.handleFileData(completeData);
        } else {
            this.handleTextData(completeData);
        }
    }
  
    handleFileData(base64Data) {
        // 解析Base64数据并生成下载链接
        const [header, data] = base64Data.split(',');
        const mimeType = header.match(/data:([^;]+)/)[1];
        const fileName = this.metadata.split('|')[0];
      
        const blob = this.base64ToBlob(data, mimeType);
        const url = URL.createObjectURL(blob);
      
        // 创建下载链接
        this.createDownloadLink(url, fileName);
    }
  
    handleTextData(textData) {
        // 显示文本并提供复制功能
        this.displayText(textData);
        this.createCopyButton(textData);
    }
}
```

### 2.5 本地存储策略

```javascript
class LocalStorage {
    saveSession(sessionId, data) {
        const sessionData = {
            timestamp: Date.now(),
            type: data.type,
            metadata: data.metadata,
            frames: data.frames,
            progress: data.progress
        };
        localStorage.setItem(`qr_session_${sessionId}`, JSON.stringify(sessionData));
    }
  
    loadSession(sessionId) {
        const data = localStorage.getItem(`qr_session_${sessionId}`);
        return data ? JSON.parse(data) : null;
    }
  
    clearOldSessions() {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        const now = Date.now();
      
        for (let key in localStorage) {
            if (key.startsWith('qr_session_')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (now - data.timestamp > maxAge) {
                    localStorage.removeItem(key);
                }
            }
        }
    }
}
```

## 3. 安全考虑

### 3.1 数据完整性

* **CRC32校验** ：每帧都包含校验码
* **重复检测** ：自动过滤重复接收的帧
* **缺失检测** ：显示缺失帧列表

### 3.2 隐私保护

* **本地处理** ：所有数据处理在本地进行
* **无网络传输** ：接收端不向服务器发送任何数据
* **临时存储** ：localStorage数据可随时清除

### 3.3 容错机制

* **帧丢失容忍** ：支持部分帧缺失的情况下继续接收
* **错误恢复** ：损坏帧自动跳过，不影响整体传输
* **重传支持** ：发送端可重复播放特定帧

## 4. 部署说明

### 4.1 内网部署

```bash
# 下载必要的离线库文件
mkdir data-transfer-system
cd data-transfer-system
mkdir libs

# 下载离线库文件到libs目录
wget https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js -O libs/qrcode.min.js

# 创建sender.html文件
# 确保引用本地库文件
```

### 4.2 GitHub Pages部署

```bash
# 创建GitHub仓库
git init
git add .
git commit -m "二维码数据传输系统"
git remote add origin https://github.com/username/qr-data-transfer.git
git push -u origin main

# 在GitHub仓库设置中启用Pages
# 选择main分支作为源
# 访问 https://username.github.io/qr-data-transfer/receiver.html
```

## 5. 使用流程

### 5.1 发送流程

1. 在内网电脑打开sender.html
2. 选择文件或输入文本
3. 点击"开始传输"
4. 二维码开始循环播放
5. 调整播放速度和显示大小

### 5.2 接收流程

1. 手机打开 GitHub Pages 上的receiver.html
2. 允许摄像头权限
3. 将摄像头对准电脑屏幕
4. 自动识别并显示接收进度
5. 传输完成后下载文件或复制文本

## 6. 性能优化

### 6.1 传输效率

* **动态调整** ：根据识别成功率调整播放速度
* **容量优化** ：使用中等纠错级别平衡容量和容错
* **批处理** ：大文件自动分批传输

### 6.2 用户体验

* **视觉反馈** ：实时显示传输进度和状态
* **声音提示** ：成功识别时播放提示音
* **暂停恢复** ：支持传输过程的暂停和继续

这个系统提供了完整的跨网络数据传输解决方案，既保证了安全性又具有良好的用户体验。
