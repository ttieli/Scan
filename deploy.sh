#!/bin/bash

echo "GitHub Pages 部署脚本"
echo "====================="
echo ""
echo "请按以下步骤操作："
echo ""
echo "1. 创建GitHub仓库："
echo "   访问: https://github.com/new"
echo "   仓库名: qr-tools"
echo "   设置为: Public"
echo "   不要初始化README"
echo ""
echo "2. 获取您的GitHub用户名后，运行以下命令："
echo ""
echo "   请输入您的GitHub用户名："
read USERNAME

echo ""
echo "正在配置远程仓库..."
git remote add origin https://github.com/$USERNAME/qr-tools.git 2>/dev/null || git remote set-url origin https://github.com/$USERNAME/qr-tools.git

echo "推送代码到GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ 代码已推送！"
echo ""
echo "3. 最后一步 - 启用GitHub Pages："
echo "   访问: https://github.com/$USERNAME/qr-tools/settings/pages"
echo "   Source: Deploy from a branch"
echo "   Branch: main"
echo "   Folder: / (root)"
echo "   点击 Save"
echo ""
echo "4. 几分钟后访问您的网站："
echo "   https://$USERNAME.github.io/qr-tools/"
echo ""