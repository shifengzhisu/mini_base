/* ==================== 3D 引擎管理 ==================== */
class GameEngine3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.starMesh = null;
        this.enemyMesh = null;
        this.weaponLasers = [];
        this.particles = [];
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('webgl-container').appendChild(this.renderer.domElement);
        
        this.setupLighting();
        this.createStarField();
        this.animate();
    }

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x404040));
        
        const pointLight1 = new THREE.PointLight(0x00f3ff, 1, 100);
        pointLight1.position.set(10, 10, 10);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff0055, 0.8, 100);
        pointLight2.position.set(-10, -10, 5);
        this.scene.add(pointLight2);
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(6000);
        
        for (let i = 0; i < 6000; i++) {
            positionArray[i] = (Math.random() - 0.5) * 100;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        this.starMesh = new THREE.Points(
            starGeometry, 
            new THREE.PointsMaterial({ size: 0.1, color: 0xffffff })
        );
        this.scene.add(this.starMesh);
    }

    spawnEnemy(type) {
        if (this.enemyMesh) {
            this.scene.remove(this.enemyMesh);
        }

        let geometry, material;
        const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
        const solidMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0077be, 
            roughness: 0.3, 
            metalness: 0.8, 
            transparent: true, 
            opacity: 0.8 
        });

        switch (type) {
            case 'easy':
                geometry = new THREE.TetrahedronGeometry(3);
                this.enemyMesh = new THREE.Mesh(geometry, wireMaterial);
                break;
            case 'hard':
                geometry = new THREE.IcosahedronGeometry(3.5, 0);
                this.enemyMesh = new THREE.Mesh(geometry, solidMaterial);
                const outerGeometry = new THREE.IcosahedronGeometry(4, 1);
                const outerMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffbb00,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                });
                this.enemyMesh.add(new THREE.Mesh(outerGeometry, outerMaterial));
                break;
            default: // boss
                geometry = new THREE.TorusKnotGeometry(2.5, 0.8, 100, 16);
                material = new THREE.MeshStandardMaterial({
                    color: 0xff0055,
                    emissive: 0x550022,
                    roughness: 0.1
                });
                this.enemyMesh = new THREE.Mesh(geometry, material);
        }
        
        this.enemyMesh.position.y = 2;
        this.scene.add(this.enemyMesh);
    }

    fireLaser(level) {
        const colors = [0x00f3ff, 0xffbb00, 0xff00ff];
        const count = level === 1 ? 1 : (level === 2 ? 2 : 5);
        const color = colors[level - 1];

        this.createExplosion(this.enemyMesh.position, color);
        
        if (this.enemyMesh) {
            this.enemyMesh.visible = false;
        }

        for (let i = 0; i < count; i++) {
            const laserGeometry = new THREE.CylinderGeometry(
                level === 3 ? 0.5 : 0.2,
                level === 3 ? 0.5 : 0.2,
                50,
                8
            );
            const laserMaterial = new THREE.MeshBasicMaterial({ color: color });
            const laser = new THREE.Mesh(laserGeometry, laserMaterial);
            
            laser.position.set((i - (count - 1) / 2) * 2, -25, 0);
            this.scene.add(laser);
            this.weaponLasers.push({ mesh: laser, life: 1.0 });
        }
    }

    createExplosion(position, color) {
        const geometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(150);
        const velocities = [];

        for (let i = 0; i < 50; i++) {
            const index = i * 3;
            positionArray[index] = position.x;
            positionArray[index + 1] = position.y;
            positionArray[index + 2] = position.z;
            
            velocities.push({
                x: (Math.random() - 0.5),
                y: (Math.random() - 0.5),
                z: (Math.random() - 0.5)
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        const particleSystem = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({ size: 0.5, color: color })
        );
        
        this.scene.add(particleSystem);
        this.particles.push({
            mesh: particleSystem,
            velocities: velocities,
            life: 1.0
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 更新星空
        const positions = this.starMesh.geometry.attributes.position.array;
        for (let i = 0; i < 2000; i++) {
            positions[i * 3 + 2] += 0.5;
            if (positions[i * 3 + 2] > 20) {
                positions[i * 3 + 2] = -100;
            }
        }
        this.starMesh.geometry.attributes.position.needsUpdate = true;

        // 更新敌人动画
        if (this.enemyMesh && this.enemyMesh.visible) {
            this.enemyMesh.rotation.x += 0.01;
            this.enemyMesh.rotation.y += 0.02;
        }

        // 更新激光
        for (let i = this.weaponLasers.length - 1; i >= 0; i--) {
            const laser = this.weaponLasers[i];
            laser.life -= 0.1;
            laser.mesh.position.y += 2;
            
            if (laser.life <= 0) {
                this.scene.remove(laser.mesh);
                this.weaponLasers.splice(i, 1);
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= 0.03;
            
            const positions = particle.mesh.geometry.attributes.position.array;
            for (let j = 0; j < particle.velocities.length; j++) {
                const index = j * 3;
                positions[index] += particle.velocities[j].x;
                positions[index + 1] += particle.velocities[j].y;
                positions[index + 2] += particle.velocities[j].z;
            }
            
            particle.mesh.geometry.attributes.position.needsUpdate = true;
            particle.mesh.material.opacity = particle.life;
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

/* ==================== 游戏状态管理 ==================== */
class GameState {
    constructor() {
        this.queue = [];
        this.current = null;
        this.index = 0;
        this.score = 0;
        this.streak = 0;
        this.freeMode = false;
        this.freeText = "";
        this.isUpperCase = false;
    }

    reset() {
        this.queue = [];
        this.current = null;
        this.index = 0;
        this.score = 0;
        this.streak = 0;
        this.freeMode = false;
        this.freeText = "";
        this.isUpperCase = false;
    }

    nextTarget() {
        this.current = this.queue.shift();
        this.queue.push(GameData.getRandomWord());
        this.index = 0;
    }

    processInput(character) {
        if (this.freeMode) {
            this.freeText += character;
            return { success: true, type: 'free' };
        }

        const targetChar = this.current.en[this.index].toUpperCase();
        if (character === targetChar) {
            this.index++;
            this.streak++;
            
            if (this.index >= this.current.en.length) {
                const level = this.streak > 15 ? 3 : (this.streak > 5 ? 2 : 1);
                this.score += (100 + this.streak * 10);
                return { success: true, type: 'complete', level: level };
            }
            
            return { success: true, type: 'continue' };
        } else {
            this.streak = 0;
            return { success: false, type: 'miss' };
        }
    }

    backspace() {
        if (this.freeMode && this.freeText.length > 0) {
            this.freeText = this.freeText.slice(0, -1);
            return true;
        }
        return false;
    }
}

/* ==================== 游戏数据管理 ==================== */
class GameData {
    static dictionary = [
        { en: "PLANET", cn: "行星", type: "easy" },
        { en: "GALAXY", cn: "银河系", type: "easy" },
        { en: "ROCKET", cn: "火箭", type: "easy" },
        { en: "ALIEN", cn: "外星人", type: "hard" },
        { en: "LASER", cn: "激光", type: "easy" },
        { en: "SYSTEM", cn: "系统", type: "hard" },
        { en: "FUTURE", cn: "未来", type: "hard" },
        { en: "ATTACK", cn: "攻击", type: "boss" },
        { en: "COMBAT", cn: "战斗", type: "hard" },
        { en: "SHIELD", cn: "护盾", type: "easy" },
        { en: "WEAPON", cn: "武器", type: "easy" },
        { en: "TARGET", cn: "目标", type: "easy" }
    ];

    static getRandomWord() {
        return this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
    }

    static initializeQueue(size = 5) {
        const queue = [];
        for (let i = 0; i < size; i++) {
            queue.push(this.getRandomWord());
        }
        return queue;
    }
}

/* ==================== UI 管理器 ==================== */
class UIManager {
    constructor() {
        this.elements = {
            cn: document.getElementById('cn-display'),
            en: document.getElementById('word-display'),
            queue: document.getElementById('queue-list'),
            chargeBar: document.getElementById('charge-bar'),
            chargeNum: document.getElementById('charge-txt'),
            score: document.getElementById('score'),
            streak: document.getElementById('streak'),
            overdrive: document.getElementById('overdrive'),
            freeLabel: document.getElementById('free-mode-label'),
            btnFree: document.getElementById('btn-free'),
            btnCaps: document.getElementById('btn-caps'),
            flash: document.getElementById('flash'),
            pilotName: document.getElementById('pilot-name')
        };
        this.initPlayerName();
    }

    initPlayerName() {
        try {
            const currentPlayer = JSON.parse(localStorage.getItem('currentPlayer') || '{}');
            const playerName = currentPlayer.name || 'UNKNOWN';
            
            if (this.elements.pilotName) {
                this.elements.pilotName.innerText = `NAME: ${playerName.toUpperCase()}`;
            }
            
            console.log('当前飞行员:', playerName);
        } catch (error) {
            console.error('读取飞行员信息失败:', error);
            if (this.elements.pilotName) {
                this.elements.pilotName.innerText = 'NAME: GUEST';
            }
        }
    }

    updateDisplay(gameState) {
        if (gameState.freeMode) {
            this.updateFreeMode(gameState);
        } else {
            this.updateGameMode(gameState);
        }
    }

    updateFreeMode(gameState) {
        this.elements.cn.innerText = "自由输入模式";
        this.elements.en.innerHTML = gameState.freeText + `<span class="cursor"></span>`;
    }

    updateGameMode(gameState) {
        this.elements.cn.innerText = gameState.current.cn;
        
        let html = "";
        let targetText = gameState.isUpperCase ? 
            gameState.current.en.toUpperCase() : 
            gameState.current.en.toLowerCase();

        // 正确处理字符显示逻辑
        for (let i = 0; i < targetText.length; i++) {
            if (i < gameState.index) {
                html += `<span class="char-done">${targetText[i]}</span>`;
            } else {
                html += `<span class="char-todo">${targetText[i]}</span>`;
            }
        }

        this.elements.en.innerHTML = html;

        // 更新队列显示
        this.elements.queue.innerHTML = gameState.queue.slice(0, 5).map(w => {
            let txt = gameState.isUpperCase ? w.en.toUpperCase() : w.en.toLowerCase();
            return `<div class="queue-item">${txt} <span class="queue-cn">${w.cn}</span></div>`;
        }).join('');

        // 更新进度条
        let percentage = Math.floor((gameState.index / gameState.current.en.length) * 100);
        this.elements.chargeBar.style.width = percentage + "%";
        this.elements.chargeNum.innerText = percentage + "%";

        // 更新分数和连击
        this.elements.score.innerText = gameState.score;
        this.elements.streak.innerText = gameState.streak;

        // 更新连击颜色
        this.elements.streak.style.color = gameState.streak > 15 ? 
            "#ff00ff" : (gameState.streak > 5 ? "#ffbb00" : "#fff");

        // 更新超载条
        this.elements.overdrive.style.height = Math.min(gameState.streak * 5, 100) + "%";
        this.elements.overdrive.style.background = gameState.streak > 15 ? 
            "#ff00ff" : (gameState.streak > 5 ? "#ffbb00" : "#00f3ff");
    }

    showFlash() {
        this.elements.flash.style.opacity = 0.5;
        setTimeout(() => {
            this.elements.flash.style.opacity = 0;
        }, 100);
    }

    updateModeButtons(gameState) {
        // 更新自由模式按钮
        if (gameState.freeMode) {
            this.elements.freeLabel.style.display = "block";
            this.elements.btnFree.classList.add('active');
            this.elements.btnFree.innerText = "[F1] 自由模式: ON";
        } else {
            this.elements.freeLabel.style.display = "none";
            this.elements.btnFree.classList.remove('active');
            this.elements.btnFree.innerText = "[F1] 自由模式: OFF";
        }

        // 更新大小写按钮
        this.elements.btnCaps.innerText = gameState.isUpperCase ? 
            "[CAPS] 单词: 大写" : "[CAPS] 单词: 小写";
        this.elements.btnCaps.classList.toggle('active', gameState.isUpperCase);
    }
}

/* ==================== 键盘管理器 ==================== */
class KeyboardManager {
    constructor() {
        this.createVirtualKeyboard();
        this.setupEventListeners();
    }

    createVirtualKeyboard() {
        const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
        const keyboardContainer = document.getElementById('keyboard');
        
        rows.forEach(row => {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            
            row.split('').forEach(char => {
                const key = document.createElement('div');
                key.className = 'key';
                key.innerText = char.toLowerCase();
                key.dataset.k = char;
                rowElement.appendChild(key);
            });
            
            keyboardContainer.appendChild(rowElement);
        });

        // 添加空格键
        const spaceRow = document.createElement('div');
        spaceRow.className = 'row';
        const spaceKey = document.createElement('div');
        spaceKey.className = 'key space';
        spaceKey.innerText = 'SPACE';
        spaceKey.dataset.k = ' ';
        spaceRow.appendChild(spaceKey);
        keyboardContainer.appendChild(spaceRow);
    }

    updateKeyLabels(isUpperCase) {
        document.querySelectorAll('.key:not(.space)').forEach(key => {
            const char = key.dataset.k;
            key.innerText = isUpperCase ? char.toUpperCase() : char.toLowerCase();
        });
    }

    animateKey(key) {
        const keyElement = document.querySelector(`.key[data-k="${key}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => {
                keyElement.classList.remove('active');
            }, 150);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const rawKey = e.key;
            let animKey = (rawKey.length === 1) ? rawKey.toUpperCase() : (rawKey === " " ? " " : "");
            
            if (animKey) {
                this.animateKey(animKey);
            }
        });
    }
}

/* ==================== 主游戏控制器 ==================== */
class GameController {
    constructor() {
        this.engine3D = null;
        this.gameState = new GameState();
        this.uiManager = new UIManager();
        this.keyboardManager = new KeyboardManager();
        this.init();
    }

    init() {
        this.engine3D = new GameEngine3D();
        
        // 初始化游戏队列
        this.gameState.queue = GameData.initializeQueue();
        this.nextTarget();
        
        this.setupEventListeners();
        this.uiManager.updateModeButtons(this.gameState);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        window.addEventListener('resize', () => this.engine3D.resize());
    }

    handleKeyPress(event) {
        const key = event.key;

        // 功能键处理
        if (key === 'F1') {
            event.preventDefault();
            this.toggleFreeMode();
            return;
        }

        if (key === 'CapsLock') {
            event.preventDefault();
            this.toggleCaseMode();
            return;
        }

        if (key === 'Escape') {
            this.clearInput();
            return;
        }

        if (key === 'Backspace') {
            if (this.gameState.backspace()) {
                this.uiManager.updateDisplay(this.gameState);
            }
            return;
        }

        // 字母输入处理
        if (key.length === 1 && key.match(/[a-zA-Z]/)) {
            const result = this.gameState.processInput(key.toUpperCase());
            
            if (result.success) {
                // 先更新UI显示
                this.uiManager.updateDisplay(this.gameState);
                
                if (result.type === 'complete') {
                    this.engine3D.fireLaser(result.level);
                    setTimeout(() => this.nextTarget(), 500);
                }
            } else {
                this.uiManager.showFlash();
                this.uiManager.updateDisplay(this.gameState);
            }
        }
    }

    nextTarget() {
        this.gameState.nextTarget();
        this.engine3D.spawnEnemy(this.gameState.current.type);
        this.uiManager.updateDisplay(this.gameState);
    }

    toggleFreeMode() {
        this.gameState.freeMode = !this.gameState.freeMode;
        this.gameState.freeText = "";
        
        if (this.gameState.freeMode) {
            if (this.engine3D.enemyMesh) {
                this.engine3D.enemyMesh.visible = false;
            }
        } else {
            if (this.engine3D.enemyMesh) {
                this.engine3D.enemyMesh.visible = true;
            }
        }
        
        this.uiManager.updateModeButtons(this.gameState);
        this.uiManager.updateDisplay(this.gameState);
    }

    toggleCaseMode() {
        this.gameState.isUpperCase = !this.gameState.isUpperCase;
        this.uiManager.updateModeButtons(this.gameState);
        this.uiManager.updateDisplay(this.gameState);
        this.keyboardManager.updateKeyLabels(this.gameState.isUpperCase);
    }

    clearInput() {
        if (this.gameState.freeMode) {
            this.gameState.freeText = "";
            this.uiManager.updateDisplay(this.gameState);
        }
    }

    cheatMode(streakValue) {
        this.gameState.streak = streakValue;
        this.uiManager.updateDisplay(this.gameState);
        this.engine3D.fireLaser(streakValue > 15 ? 3 : 2);
        setTimeout(() => {
            if (this.engine3D.enemyMesh) {
                this.engine3D.enemyMesh.visible = true;
            }
        }, 1000);
    }
}

/* ==================== 全局函数 ==================== */
let gameController;

function toggleFreeMode() {
    if (gameController) {
        gameController.toggleFreeMode();
    }
}

function toggleCaseMode() {
    if (gameController) {
        gameController.toggleCaseMode();
    }
}

function clearInput() {
    if (gameController) {
        gameController.clearInput();
    }
}

function nextTarget() {
    if (gameController) {
        gameController.nextTarget();
    }
}

function cheatMode(value) {
    if (gameController) {
        gameController.cheatMode(value);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
});

// 导出给全局使用
window.toggleFreeMode = toggleFreeMode;
window.toggleCaseMode = toggleCaseMode;
window.clearInput = clearInput;
window.nextTarget = nextTarget;
window.cheatMode = cheatMode;