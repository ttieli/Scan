#!/bin/bash

echo "GitHub Pages 部署脚本"
echo "====================="
echo ""

# 使用用户提供的仓库
USERNAME="ttieli"
REPO="Scan"

echo "正在部署到: https://github.com/$USERNAME/$REPO"
echo ""

# 检查是否已有远程仓库
if git remote | grep -q origin; then
    echo "更新远程仓库地址..."
    git remote set-url origin https://github.com/$USERNAME/$REPO.git
else
    echo "添加远程仓库..."
    git remote add origin https://github.com/$USERNAME/$REPO.git
fi

echo "推送代码到GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ 代码已推送到 https://github.com/$USERNAME/$REPO"
echo ""
echo "GitHub Pages 应该已经自动部署，请访问："
echo "https://$USERNAME.github.io/$REPO/"
echo ""
echo "如果页面未更新，请检查："
echo "https://github.com/$USERNAME/$REPO/settings/pages"
echo ""