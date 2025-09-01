/**
 * 资源加载器 - 支持离线和在线双模式
 * 优先使用本地缓存，失败时从CDN加载
 */

class ResourceLoader {
    constructor() {
        // 使用全局config配置，如果存在的话
        const basePath = (typeof config !== 'undefined' && config.basePath) ? config.basePath : '';
        
        this.resources = {
            qrcode: {
                local: basePath ? `${basePath}/libs/qrcode.min.js` : 'libs/qrcode.min.js',
                cdns: [
                    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
                    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
                    'https://unpkg.com/qrcodejs@1.0.0/qrcode.min.js'
                ],
                test: () => typeof QRCode !== 'undefined'
            },
            jsQR: {
                local: basePath ? `${basePath}/libs/jsQR.js` : 'libs/jsQR.js',
                cdns: [
                    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
                    'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js'
                ],
                test: () => typeof jsQR !== 'undefined'
            }
        };
        
        this.loadedResources = new Set();
        this.loadingPromises = new Map();
    }
    
    /**
     * 加载指定资源
     * @param {string} resourceName - 资源名称
     * @returns {Promise} 加载完成的Promise
     */
    async loadResource(resourceName) {
        // 如果已加载，直接返回
        if (this.loadedResources.has(resourceName)) {
            return Promise.resolve();
        }
        
        // 如果正在加载，返回现有的Promise
        if (this.loadingPromises.has(resourceName)) {
            return this.loadingPromises.get(resourceName);
        }
        
        const resource = this.resources[resourceName];
        if (!resource) {
            return Promise.reject(new Error(`Unknown resource: ${resourceName}`));
        }
        
        // 创建加载Promise
        const loadPromise = this._loadResourceImpl(resourceName, resource);
        this.loadingPromises.set(resourceName, loadPromise);
        
        try {
            await loadPromise;
            this.loadedResources.add(resourceName);
            this.loadingPromises.delete(resourceName);
        } catch (error) {
            this.loadingPromises.delete(resourceName);
            throw error;
        }
        
        return loadPromise;
    }
    
    /**
     * 实际加载资源的实现
     */
    async _loadResourceImpl(resourceName, resource) {
        // 检查是否已经加载
        if (resource.test && resource.test()) {
            console.log(`Resource ${resourceName} already loaded`);
            return;
        }
        
        // 尝试从本地加载
        try {
            await this._loadScript(resource.local);
            if (resource.test && resource.test()) {
                console.log(`Loaded ${resourceName} from local`);
                return;
            }
        } catch (error) {
            console.warn(`Failed to load ${resourceName} from local:`, error);
        }
        
        // 尝试从CDN加载
        for (const cdn of resource.cdns) {
            try {
                await this._loadScript(cdn);
                if (resource.test && resource.test()) {
                    console.log(`Loaded ${resourceName} from CDN: ${cdn}`);
                    return;
                }
            } catch (error) {
                console.warn(`Failed to load ${resourceName} from ${cdn}:`, error);
            }
        }
        
        throw new Error(`Failed to load resource: ${resourceName}`);
    }
    
    /**
     * 加载脚本文件
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已存在
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                if (existingScript.dataset.loaded === 'true') {
                    resolve();
                    return;
                }
                // 等待现有脚本加载
                existingScript.addEventListener('load', resolve, { once: true });
                existingScript.addEventListener('error', reject, { once: true });
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            
            script.onerror = () => {
                script.remove();
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * 检查网络状态
     */
    isOnline() {
        return navigator.onLine;
    }
    
    /**
     * 等待资源加载完成
     */
    async waitForResource(resourceName, timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                await this.loadResource(resourceName);
                return;
            } catch (error) {
                if (Date.now() - startTime + 1000 >= timeout) {
                    throw error;
                }
                // 等待1秒后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error(`Timeout loading resource: ${resourceName}`);
    }
}

// 创建全局实例
window.resourceLoader = new ResourceLoader();

// 自动检测环境并配置
(function() {
    // 检测是否在GitHub Pages
    const isGitHubPages = window.location.hostname === 'ttieli.github.io';
    const basePath = isGitHubPages ? '/Scan' : '';
    
    // 更新本地资源路径
    if (basePath) {
        Object.values(window.resourceLoader.resources).forEach(resource => {
            if (resource.local) {
                resource.local = basePath + '/' + resource.local;
            }
        });
    }
})();