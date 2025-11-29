// ==================== 首页交互功能 ====================

document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initAnimations();
});

// ==================== 粒子背景效果 ====================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    // 创建动态星空粒子
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 3 + 1}px;
        height: ${Math.random() * 3 + 1}px;
        background: ${Math.random() > 0.5 ? '#00f3ff' : '#ffbb00'};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.8 + 0.2};
        animation: twinkle ${Math.random() * 3 + 2}s infinite alternate;
        box-shadow: 0 0 ${Math.random() * 10 + 5}px currentColor;
    `;
    
    container.appendChild(particle);
}

// ==================== 页面动画效果 ====================
function initAnimations() {
    // 简单的入场动画，不使用 gsap
    const elements = document.querySelectorAll('.logo, .game-info, .preview-area, .footer');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s ease';
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // 功能特性动画
    const features = document.querySelectorAll('.feature-item');
    features.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 1000 + index * 100);
    });
}

// ==================== 模态框控制 ====================
function showInstructions() {
    const modal = document.getElementById('instructionModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    modal.style.opacity = '0';
    
    // 简单的显示动画
    setTimeout(() => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
    }, 10);
    
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}

function hideInstructions() {
    const modal = document.getElementById('instructionModal');
    if (!modal) return;
    
    modal.style.transition = 'opacity 0.3s ease';
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// ==================== 点击外部关闭模态框 ====================
document.addEventListener('click', function(e) {
    const modal = document.getElementById('instructionModal');
    if (e.target === modal) {
        hideInstructions();
    }
});

// ==================== ESC 键关闭模态框 ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('instructionModal');
        if (modal && modal.style.display === 'block') {
            hideInstructions();
        }
    }
});

// ==================== 鼠标跟踪光晕效果 ====================
let mouseGlow = null;

document.addEventListener('mousemove', function(e) {
    if (!mouseGlow) {
        mouseGlow = document.createElement('div');
        mouseGlow.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(0, 243, 255, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: all 0.1s ease;
        `;
        document.body.appendChild(mouseGlow);
    }
    
    mouseGlow.style.left = (e.clientX - 10) + 'px';
    mouseGlow.style.top = (e.clientY - 10) + 'px';
});

// ==================== 页面可见性变化处理 ====================
document.addEventListener('visibilitychange', function() {
    // 简单的页面可见性处理
    if (document.hidden) {
        console.log('页面隐藏');
    } else {
        console.log('页面显示');
    }
});

// ==================== 预加载游戏资源 ====================
function preloadGameAssets() {
    const assets = [
        'html/abcShoot.html',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    ];
    
    assets.forEach(asset => {
        if (asset.endsWith('.js')) {
            const script = document.createElement('script');
            script.src = asset;
            script.async = true;
            document.head.appendChild(script);
        } else {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = asset;
            document.head.appendChild(link);
        }
    });
}

// ==================== 性能监控 ====================
function monitorPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('页面加载时间:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }
}

// ==================== 初始化所有功能 ====================
document.addEventListener('DOMContentLoaded', function() {
    preloadGameAssets();
    monitorPerformance();
});

// ==================== 启动游戏功能 ====================
function startGame() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        // 显示输入提示
        playerNameInput.style.borderColor = '#ff0055';
        playerNameInput.focus();
        
        setTimeout(() => {
            playerNameInput.style.borderColor = 'rgba(0, 243, 255, 0.3)';
        }, 2000);
        
        return;
    }
    
    // 记录用户名到本地存储
    const timestamp = new Date().toISOString();
    const playerRecord = {
        name: playerName,
        timestamp: timestamp,
        sessionId: generateSessionId()
    };
    
    // 保存到 localStorage
    localStorage.setItem('currentPlayer', JSON.stringify(playerRecord));
    
    // 记录到飞行日志
    saveToFlightLog(playerRecord);
    
    // 跳转到游戏页面
    window.location.href = 'html/abcShoot.html';
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveToFlightLog(playerRecord) {
    try {
        // 获取现有的飞行日志
        let flightLog = JSON.parse(localStorage.getItem('flightLog') || '[]');
        
        // 添加新记录
        flightLog.push(playerRecord);
        
        // 保持最近50条记录
        if (flightLog.length > 50) {
            flightLog = flightLog.slice(-50);
        }
        
        // 保存回 localStorage
        localStorage.setItem('flightLog', JSON.stringify(flightLog));
        
        console.log('飞行员记录已保存:', playerRecord);
        
    } catch (error) {
        console.error('保存飞行日志失败:', error);
    }
}

// ==================== 输入框回车键支持 ====================
document.addEventListener('DOMContentLoaded', function() {
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startGame();
            }
        });
        
        // 自动生成默认呼号
        if (!playerNameInput.value) {
            playerNameInput.placeholder = `飞行员${Math.floor(Math.random() * 9000) + 1000}`;
        }
    }
});

// ==================== 全局函数导出 ====================
window.showInstructions = showInstructions;
window.hideInstructions = hideInstructions;
window.startGame = startGame;