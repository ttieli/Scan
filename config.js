// 配置文件 - 自动检测运行环境
const config = (() => {
  // 检测是否在GitHub Pages上运行
  const isGitHubPages = window.location.hostname === 'ttieli.github.io';
  const basePath = isGitHubPages ? '/Scan' : '';
  
  return {
    basePath: basePath,
    baseUrl: window.location.origin + basePath,
    isGitHubPages: isGitHubPages,
    
    // 获取正确的路径
    getPath: (path) => {
      // 移除开头的斜杠
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return basePath ? `${basePath}/${cleanPath}` : cleanPath;
    },
    
    // Service Worker路径
    serviceWorkerPath: basePath ? `${basePath}/service-worker.js` : 'service-worker.js',
    
    // Manifest路径
    manifestPath: basePath ? `${basePath}/manifest.json` : 'manifest.json'
  };
})();

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}