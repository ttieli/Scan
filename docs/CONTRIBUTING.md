# 贡献指南

感谢您对QR数据传输系统项目的关注！我们欢迎各种形式的贡献。

## 📋 贡献方式

### 报告问题
- 使用 [GitHub Issues](https://github.com/ttieli/Scan/issues) 报告bug
- 描述问题的复现步骤
- 提供浏览器和操作系统信息
- 如可能，提供截图或错误信息

### 功能建议
- 先检查是否已有相似的建议
- 清晰描述功能需求和使用场景
- 说明这个功能如何改善用户体验

### 提交代码

#### 1. Fork 和克隆
```bash
# Fork 项目到您的账号
# 然后克隆到本地
git clone https://github.com/YOUR_USERNAME/Scan.git
cd Scan
```

#### 2. 创建分支
```bash
# 基于main创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/bug-description
```

#### 3. 开发规范

##### 代码风格
- 使用 2 空格缩进
- 使用有意义的变量名
- 添加必要的注释
- 遵循现有代码风格

##### 提交信息格式
```
<type>: <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

示例：
```bash
git commit -m "feat: 添加数据压缩功能

- 实现gzip压缩算法
- 自动检测数据大小并压缩
- 添加压缩率显示

Closes #123"
```

#### 4. 测试
```bash
# 运行测试
# 打开浏览器访问 test.html
# 确保所有测试通过
```

#### 5. 提交 Pull Request
- 推送分支到您的 Fork
- 在 GitHub 上创建 Pull Request
- 填写 PR 模板
- 等待代码审查

## 🏗️ 项目结构

```
/
├── index.html       # 主页
├── sender.html      # 发送端
├── receiver.html    # 接收端
├── test.html        # 测试页面
└── service-worker.js # PWA支持
```

## 🧪 测试要求

### 功能测试
- 所有新功能必须包含测试
- 修复bug需要添加回归测试
- 测试覆盖率不低于80%

### 浏览器兼容性
请在以下浏览器中测试：
- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)
- 移动端浏览器

## 📝 文档要求

### 代码注释
```javascript
/**
 * 生成QR码
 * @param {string} data - 要编码的数据
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} QR码图片URL
 */
function generateQR(data, options = {}) {
  // 实现代码
}
```

### README更新
- 新功能需要更新使用说明
- API变更需要更新文档
- 添加配置示例

## 🔍 代码审查标准

### 必须满足
- [ ] 代码可以正常运行
- [ ] 通过所有测试
- [ ] 没有明显的性能问题
- [ ] 没有安全漏洞

### 建议满足
- [ ] 代码简洁易懂
- [ ] 有适当的错误处理
- [ ] 有单元测试
- [ ] 文档完整

## 🚀 发布流程

### 版本号规范
遵循语义化版本：`MAJOR.MINOR.PATCH`

- MAJOR: 不兼容的API修改
- MINOR: 向下兼容的功能新增
- PATCH: 向下兼容的问题修复

### 发布步骤
1. 更新版本号
2. 更新 CHANGELOG
3. 创建 Release Tag
4. 发布 Release Notes

## 💬 交流方式

### 技术讨论
- 使用 GitHub Discussions
- 提 Issue 前先搜索

### 行为准则
- 尊重所有贡献者
- 建设性的批评
- 帮助新手入门
- 保持专业态度

## 🙏 致谢

感谢所有贡献者的付出！您的每一个贡献都让这个项目变得更好。

### 贡献者列表
<!-- 自动生成贡献者列表 -->
<a href="https://github.com/ttieli/Scan/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ttieli/Scan" />
</a>

## 📄 许可证

通过提交代码，您同意您的贡献将按照项目的 MIT 许可证进行许可。

---

如有任何问题，请随时：
- 提交 [Issue](https://github.com/ttieli/Scan/issues)
- 发起 [Discussion](https://github.com/ttieli/Scan/discussions)
- 查看 [Wiki](https://github.com/ttieli/Scan/wiki)