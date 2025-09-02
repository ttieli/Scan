# QR数据传输系统 - 极简离线版

## 简介
完全离线的QR码数据传输系统，仅需3个HTML文件即可运行。

## 文件结构
```
QR_Group_Scan/
├── standalone/          # 独立版本（主要使用）
│   ├── index.html      # 主页
│   ├── sender.html     # 发送端
│   └── receiver.html   # 接收端
├── LICENSE             # MIT许可证
└── README.md          # 本文件
```

## 使用方法

### 快速开始
1. 进入 `standalone` 目录
2. 双击打开 `index.html`
3. 选择发送端或接收端

### 完整功能（需要本地服务器）
```bash
cd standalone
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 特性
- ✅ 完全离线运行
- ✅ 零外部依赖
- ✅ 所有代码内嵌
- ✅ 支持长文本分片
- ✅ 平铺/循环显示模式

## 版本
- v2.0.0 - 极简离线版

## 许可
MIT License