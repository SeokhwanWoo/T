document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const rankingScreen = document.getElementById('ranking-screen');
    const levelUpScreen = document.getElementById('level-up-screen');
    const shopScreen = document.getElementById('shop-screen');
    const upgradeCardsContainer = document.getElementById('upgrade-cards');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    const goHomeBtn = document.getElementById('go-home-btn');
    const resetRankingBtn = document.getElementById('reset-ranking-btn');
    const shopBtn = document.getElementById('shop-btn');
    const shopBackBtn = document.getElementById('shop-back-btn');
    
    const battleArena = document.getElementById('battle-arena');
    const playerContainer = document.getElementById('player-container');
    const playerRocketEmoji = document.getElementById('player-rocket-emoji');
    const appContainer = document.getElementById('app');
    const virtualJoystick = document.getElementById('virtual-joystick');
    const joystickKnob = document.getElementById('joystick-knob');
    
    // HUD Elements
    const scoreEl = document.getElementById('score');
    const playerLevelEl = document.getElementById('player-level');
    const expBar = document.getElementById('exp-bar');
    const playerHpText = document.getElementById('player-hp-text');
    const ultBar = document.getElementById('ult-bar');
    const ultReadyText = document.getElementById('ult-ready-text');
    const bossHpContainer = document.getElementById('boss-hp-container');
    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossNameText = document.getElementById('boss-name-text');
    
    const totalCreditsEl = document.getElementById('total-credits');
    const shopCreditsEl = document.getElementById('shop-credits');
    
    // Shop Upgrades Elements
    const upgDmgLevel = document.getElementById('upg-dmg-level');
    const upgDmgCost = document.getElementById('upg-dmg-cost');
    const buyDmgBtn = document.getElementById('buy-dmg-btn');
    const upgSpdLevel = document.getElementById('upg-spd-level');
    const upgSpdCost = document.getElementById('upg-spd-cost');
    const buySpdBtn = document.getElementById('buy-spd-btn');
    const upgFirerateLevel = document.getElementById('upg-firerate-level');
    const upgFirerateCost = document.getElementById('upg-firerate-cost');
    const buyFirerateBtn = document.getElementById('buy-firerate-btn');

    // Customizer Elements
    const rocketPreview = document.getElementById('rocket-preview');
    const colorBtns = document.querySelectorAll('.color-btn');
    const charBtns = document.querySelectorAll('.char-btn');
    
    // --- Audio System (Placeholder) ---
    function playSound(type) {
        // console.log('Playing sound:', type);
    }

    // --- Game State ---
    let gameWidth = window.innerWidth;
    let gameHeight = window.innerHeight;
    const bgCanvas = document.getElementById('bg-canvas');
    const ctx = bgCanvas.getContext('2d');
    let stars = [];

    window.addEventListener('resize', () => {
        gameWidth = window.innerWidth;
        gameHeight = window.innerHeight;
        bgCanvas.width = gameWidth;
        bgCanvas.height = gameHeight;
        
        if (player.x > gameWidth) player.x = gameWidth - 20;
        if (player.y > gameHeight) player.y = gameHeight - 20;
    });
    // Set initial size
    bgCanvas.width = gameWidth;
    bgCanvas.height = gameHeight;

    let animationFrameId;
    let isPlaying = false;
    let isPaused = false;
    let lastTime = 0;
    
    let score = 0;
    let rankings = JSON.parse(localStorage.getItem('spaceRaidRankings')) || [];
    let playerChar = localStorage.getItem('spaceRaidPlayerChar') || '🛸';
    let rocketColor = localStorage.getItem('spaceRaidRocketColor') || 'hue-rotate(0deg)';
    
    let totalCredits = parseInt(localStorage.getItem('spaceRaidCredits')) || 0;
    let persistentUpgrades = JSON.parse(localStorage.getItem('spaceRaidUpgrades')) || { damage: 0, speed: 0, fireRate: 0 };
    if (persistentUpgrades.fireRate === undefined) persistentUpgrades.fireRate = 0;

    const player = {
        x: gameWidth / 2, y: gameHeight / 2,
        speed: 300, // px per second
        hp: 100, maxHp: 100,
        level: 1, exp: 0, maxExp: 10,
        damage: 20, 
        ultGauge: 0,
        magnetRange: 150, // px
        isHit: false,
        fireRate: 500,
        fireTimer: 0,
        multishotLevel: 0,
        piercingLevel: 0,
        hasDrone: false
    };

    const TRACKED_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']);
    const keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowdown: false, arrowleft: false, arrowright: false };

    function resetAllKeys() {
        for (const k in keys) keys[k] = false;
    }
    const joystickVector = { x: 0, y: 0 };
    let joystickActive = false;
    let joystickTouchId = null;
    let joystickBaseX = 0, joystickBaseY = 0;
    const maxRadius = 50;
    
    let enemies = [];
    let bullets = [];
    let enemyBullets = [];
    let gems = [];
    let drones = [];
    let mousePos = { x: gameWidth / 2, y: gameHeight / 4 }; 
    
    let enemySpawnTimer = 0;
    let enemySpawnInterval = 1500;
    let bossActive = false;
    let currentBoss = null;

    // --- Initialization ---
    initCustomizer();
    updateShopUI();

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    viewRankingBtn.addEventListener('click', () => { updateRankingUI(); showScreen(rankingScreen); });
    backToStartBtn.addEventListener('click', () => showScreen(startScreen));
    goHomeBtn.addEventListener('click', () => showScreen(startScreen));
    
    shopBtn.addEventListener('click', () => { updateShopUI(); showScreen(shopScreen); });
    shopBackBtn.addEventListener('click', () => showScreen(startScreen));

    resetRankingBtn.addEventListener('click', () => {
        if (confirm("정말 랭킹을 초기화하시겠습니까?")) {
            rankings = [];
            localStorage.removeItem('spaceRaidRankings');
            updateRankingUI();
        }
    });

    buyDmgBtn.addEventListener('click', () => buyPersistentUpgrade('damage', 500));
    buySpdBtn.addEventListener('click', () => buyPersistentUpgrade('speed', 500));
    buyFirerateBtn.addEventListener('click', () => buyPersistentUpgrade('fireRate', 500));

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (TRACKED_KEYS.has(key)) {
            e.preventDefault(); // 스페이스/화살표 키로 인한 스크롤 방지
            keys[key] = true;
            if (key === ' ' && player.ultGauge >= 100 && isPlaying && !isPaused) {
                checkUltimate();
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (TRACKED_KEYS.has(key)) {
            keys[key] = false;
        }
    });
    // 포커스 이탈 시 모든 키 상태 초기화 (키 씹힘 방지)
    window.addEventListener('blur', () => {
        resetAllKeys();
    });

    // 마우스 커서 추적 (자동 사격 목표점)
    battleArena.addEventListener('pointermove', (e) => {
        if (!joystickActive) {
            const rect = battleArena.getBoundingClientRect();
            mousePos.x = e.clientX - rect.left;
            mousePos.y = e.clientY - rect.top;
        }
    });

    // --- Virtual Joystick ---
    virtualJoystick.addEventListener('pointerdown', (e) => {
        joystickActive = true;
        joystickTouchId = e.pointerId;
        virtualJoystick.setPointerCapture(e.pointerId);
        const rect = virtualJoystick.getBoundingClientRect();
        joystickBaseX = rect.left + rect.width / 2;
        joystickBaseY = rect.top + rect.height / 2;
        handleJoystickMove(e);
    });

    virtualJoystick.addEventListener('pointermove', (e) => {
        if (!joystickActive || e.pointerId !== joystickTouchId) return;
        handleJoystickMove(e);
    });

    const stopJoystick = (e) => {
        if (e.pointerId !== joystickTouchId) return;
        joystickActive = false;
        joystickVector.x = 0;
        joystickVector.y = 0;
        joystickKnob.style.transform = `translate(-50%, -50%)`;
        virtualJoystick.releasePointerCapture(e.pointerId);
    };
    virtualJoystick.addEventListener('pointerup', stopJoystick);
    virtualJoystick.addEventListener('pointercancel', stopJoystick);

    function handleJoystickMove(e) {
        let dx = e.clientX - joystickBaseX;
        let dy = e.clientY - joystickBaseY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }
        
        joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        joystickVector.x = dx / maxRadius;
        joystickVector.y = dy / maxRadius;
    }

    // --- Customizer & Shop ---
    function initCustomizer() {
        applyRocketColor(rocketColor);
        applyPlayerChar(playerChar);

        colorBtns.forEach(btn => {
            if(btn.dataset.color === rocketColor) btn.classList.add('active');
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                rocketColor = btn.dataset.color;
                applyRocketColor(rocketColor);
                localStorage.setItem('spaceRaidRocketColor', rocketColor);
            });
        });

        charBtns.forEach(btn => {
            if(btn.dataset.char === playerChar) btn.classList.add('active');
            btn.addEventListener('click', () => {
                charBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                playerChar = btn.dataset.char;
                applyPlayerChar(playerChar);
                localStorage.setItem('spaceRaidPlayerChar', playerChar);
            });
        });
    }

    function applyRocketColor(color) {
        rocketPreview.style.filter = color;
        playerRocketEmoji.style.filter = `${color} drop-shadow(0 0 10px cyan)`;
    }

    function applyPlayerChar(char) {
        rocketPreview.textContent = char;
        playerRocketEmoji.textContent = char;
    }

    function updateShopUI() {
        totalCreditsEl.textContent = totalCredits;
        shopCreditsEl.textContent = totalCredits;
        
        const dmgCost = 500 + (persistentUpgrades.damage * 300);
        upgDmgLevel.textContent = persistentUpgrades.damage;
        upgDmgCost.textContent = dmgCost;
        buyDmgBtn.disabled = totalCredits < dmgCost;

        const spdCost = 500 + (persistentUpgrades.speed * 300);
        upgSpdLevel.textContent = persistentUpgrades.speed;
        upgSpdCost.textContent = spdCost;
        buySpdBtn.disabled = totalCredits < spdCost;
        
        const firerateCost = 500 + (persistentUpgrades.fireRate * 300);
        upgFirerateLevel.textContent = persistentUpgrades.fireRate;
        upgFirerateCost.textContent = firerateCost;
        buyFirerateBtn.disabled = totalCredits < firerateCost;
        
        localStorage.setItem('spaceRaidCredits', totalCredits);
        localStorage.setItem('spaceRaidUpgrades', JSON.stringify(persistentUpgrades));
    }

    function buyPersistentUpgrade(type, baseCost) {
        let cost = baseCost + (persistentUpgrades[type] * 300);
        if (totalCredits >= cost) {
            totalCredits -= cost;
            persistentUpgrades[type]++;
            updateShopUI();
        }
    }

    // --- Game Engine ---
    function startGame() {
        // Reset State
        player.x = gameWidth / 2; player.y = gameHeight / 2;
        player.hp = player.maxHp = 100;
        player.level = 1; player.exp = 0; player.maxExp = 10;
        
        // Apply persistent upgrades to base stats
        player.damage = 20 + (persistentUpgrades.damage * 5);
        player.speed = 300 + (persistentUpgrades.speed * 50);
        player.fireRate = Math.max(100, 500 - (persistentUpgrades.fireRate * 30)); // 최소 100ms
        
        player.ultGauge = 0; player.magnetRange = 150;
        player.fireTimer = 0; player.multishotLevel = 0; player.piercingLevel = 0; player.hasDrone = false;
        
        score = 0;
        enemySpawnInterval = 1500;
        bossActive = false;
        currentBoss = null;
        
        // Clear DOM entities
        battleArena.querySelectorAll('.enemy, .boss-enemy, .gem, .bullet, .enemy-bullet, .particle, .floating-dmg, .ult-laser, .drone, .drone-bullet, .massive-explosion').forEach(e => e.remove());
        enemies = []; bullets = []; enemyBullets = []; gems = []; drones = [];
        
        // Init Stars for Parallax
        stars = [];
        for (let i = 0; i < 150; i++) {
            const layer = Math.random();
            let size, speed, color;
            if (layer < 0.6) { size = 1; speed = 20; color = '#555'; } // Far
            else if (layer < 0.9) { size = 2; speed = 50; color = '#aaa'; } // Mid
            else { size = 3; speed = 100; color = '#fff'; } // Near
            stars.push({
                x: Math.random() * gameWidth,
                y: Math.random() * gameHeight,
                size, speed, color
            });
        }
        
        updateHUD();
        bossHpContainer.style.display = 'none';
        levelUpScreen.style.display = 'none';
        
        isPlaying = true;
        isPaused = false;
        showScreen(gameScreen);
        
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function drawStarfield(dt) {
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        const dtSec = dt / 1000;
        stars.forEach(s => {
            s.y += s.speed * dtSec;
            if (s.y > gameHeight) {
                s.y = 0;
                s.x = Math.random() * gameWidth;
            }
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
    }

    function gameLoop(timestamp) {
        if (!isPlaying) return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (!isPaused) {
            updatePlayer(deltaTime);
            updateCombat(deltaTime);
            if (player.hasDrone) updateDrones(deltaTime);
            updateEnemies(deltaTime, timestamp);
            updateBullets(deltaTime);
            updateGems(deltaTime);
            checkCollisions();
            checkBossSpawn();
        }

        drawStarfield(deltaTime);
        render();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Update Logic ---
    function updatePlayer(dt) {
        const dtSec = dt / 1000;
        let dx = 0; let dy = 0;
        
        // 키보드 입력 (매 프레임 keys 상태 객체를 읽어 이동 계산)
        if (keys.w || keys.arrowup)    dy -= 1;
        if (keys.s || keys.arrowdown)  dy += 1;
        if (keys.a || keys.arrowleft)  dx -= 1;
        if (keys.d || keys.arrowright) dx += 1;
        
        // 대각선 이동 속도 보정: 벡터 정규화 (√2 ≈ 1.414 방지)
        const kbMag = Math.sqrt(dx * dx + dy * dy);
        if (kbMag > 0) {
            dx /= kbMag;
            dy /= kbMag;
        }

        // 조이스틱 입력 합산 (이미 단위벡터 범위로 정규화된 값)
        if (joystickActive) {
            dx += joystickVector.x;
            dy += joystickVector.y;
        }
        
        // 키보드+조이스틱 동시 입력 시 최대 크기 1로 클램프
        const totalMag = Math.sqrt(dx * dx + dy * dy);
        if (totalMag > 1) {
            dx /= totalMag;
            dy /= totalMag;
        }

        player.x += dx * player.speed * dtSec;
        player.y += dy * player.speed * dtSec;
        
        if (player.x < 0)  player.x = 0;
        if (player.x > gameWidth) player.x = gameWidth;
        if (player.y < 0)  player.y = 0;
        if (player.y > gameHeight) player.y = gameHeight;
    }

    function updateCombat(dt) {
        player.fireTimer += dt;
        
        // 조이스틱 사용 중이거나 모바일일 경우 가장 가까운 적 방향으로 자동 조준
        if (joystickActive && enemies.length > 0) {
            let closest = enemies[0];
            let minDist = getDistance(player.x, player.y, closest.x, closest.y);
            for (let i = 1; i < enemies.length; i++) {
                let dist = getDistance(player.x, player.y, enemies[i].x, enemies[i].y);
                if (dist < minDist) { minDist = dist; closest = enemies[i]; }
            }
            if (bossActive && currentBoss) {
                let dist = getDistance(player.x, player.y, currentBoss.x, currentBoss.y);
                if (dist < minDist) { minDist = dist; closest = currentBoss; }
            }
            mousePos.x = closest.x;
            mousePos.y = closest.y;
        }

        if (player.fireTimer >= player.fireRate) {
            player.fireTimer = 0;
            fireLaserAtCoord(mousePos.x, mousePos.y);
        }
    }

    let droneAngle = 0;
    function updateDrones(dt) {
        const dtSec = dt / 1000;
        droneAngle += dtSec * 3; 
        
        drones.forEach((d, i) => {
            const angleOffset = (Math.PI * 2 / drones.length) * i;
            const targetX = player.x + Math.cos(droneAngle + angleOffset) * 60;
            const targetY = player.y + Math.sin(droneAngle + angleOffset) * 60;
            
            d.x += (targetX - d.x) * 5 * dtSec;
            d.y += (targetY - d.y) * 5 * dtSec;
            d.el.style.left = `${d.x}px`;
            d.el.style.top = `${d.y}px`;
            
            d.fireTimer += dt;
            if (d.fireTimer >= 800) {
                d.fireTimer = 0;
                let targets = [...enemies];
                if (bossActive && currentBoss) targets.push(currentBoss);
                if (targets.length > 0) {
                    let closest = targets[0];
                    let minDist = getDistance(d.x, d.y, closest.x, closest.y);
                    for (let j = 1; j < targets.length; j++) {
                        let dist = getDistance(d.x, d.y, targets[j].x, targets[j].y);
                        if (dist < minDist) { minDist = dist; closest = targets[j]; }
                    }
                    if (minDist < 300) {
                        const dx = closest.x - d.x;
                        const dy = closest.y - d.y;
                        const len = Math.sqrt(dx*dx + dy*dy);
                        const vx = (dx / len) * 600;
                        const vy = (dy / len) * 600;
                        createDroneBullet(d.x, d.y, vx, vy);
                    }
                }
            }
        });
    }

    function createDroneBullet(x, y, vx, vy) {
        const el = document.createElement('div');
        el.className = 'drone-bullet';
        battleArena.appendChild(el);
        bullets.push({ id: Math.random(), x, y, vx, vy, el, isEnemy: false, damageMult: 0.5, hitSet: null, pierceCount: 0 });
        playSound('shoot');
    }

    function fireLaserAtCoord(tx, ty) {
        const dx = tx - player.x;
        const dy = ty - player.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        if (length === 0) return;

        const baseAngle = Math.atan2(dy, dx);
        const speed = 800; // px/s
        
        let angles = [baseAngle];
        if (player.multishotLevel === 1) angles = [baseAngle - 0.1, baseAngle + 0.1];
        else if (player.multishotLevel >= 2) angles = [baseAngle - 0.2, baseAngle, baseAngle + 0.2];
        
        angles.forEach(angle => {
            const vx = Math.cos(angle) * speed; 
            const vy = Math.sin(angle) * speed;
            createBullet(player.x, player.y, vx, vy, false);
        });
        playSound('shoot');
    }

    function createBullet(x, y, vx, vy, isEnemy) {
        const el = document.createElement('div');
        el.className = isEnemy ? 'enemy-bullet' : 'bullet';
        battleArena.appendChild(el);
        
        if (!isEnemy) {
            const angle = Math.atan2(vy, vx) * 180 / Math.PI;
            el.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        }

        const isPiercing = !isEnemy && player.piercingLevel > 0;
        const hitSet = isPiercing ? new Set() : null;
        const pierceCount = isPiercing ? player.piercingLevel : 0;

        const list = isEnemy ? enemyBullets : bullets;
        list.push({ id: Math.random(), x, y, vx, vy, el, isEnemy, damageMult: 1, hitSet, pierceCount });
    }

    function updateBullets(dt) {
        const dtSec = dt / 1000;
        [bullets, enemyBullets].forEach(list => {
            for (let i = list.length - 1; i >= 0; i--) {
                const b = list[i];
                b.x += b.vx * dtSec;
                b.y += b.vy * dtSec;
                
                if (b.x < -50 || b.x > gameWidth + 50 || b.y < -50 || b.y > gameHeight + 50) {
                    b.el.remove();
                    list.splice(i, 1);
                }
            }
        });
    }

    function updateEnemies(dt, timestamp) {
        const dtSec = dt / 1000;
        enemySpawnTimer += dt;
        
        if (enemySpawnTimer > enemySpawnInterval && !bossActive) {
            spawnEnemy();
            enemySpawnTimer = 0;
            enemySpawnInterval = Math.max(300, enemySpawnInterval - 10);
        }

        enemies.forEach(e => {
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) {
                e.x += (dx/len) * e.speed * dtSec;
                e.y += (dy/len) * e.speed * dtSec;
            }
        });

        if (bossActive && currentBoss) {
            const dx = player.x - currentBoss.x;
            const dy = player.y - currentBoss.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 100) {
                currentBoss.x += (dx/len) * currentBoss.speed * dtSec;
                currentBoss.y += (dy/len) * currentBoss.speed * dtSec;
            }

            if (!currentBoss.lastShot || timestamp - currentBoss.lastShot > 1500) {
                currentBoss.lastShot = timestamp;
                fireBossBulletHell();
            }
        }
    }

    function spawnEnemy() {
        // Standard emojis that don't render as X box
        const chars = ['👽', '💀', '👿', '👹', '👾'];
        const el = document.createElement('div');
        el.className = 'enemy';
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        
        // 클릭 이벤트 제거 (자동 사격)
        battleArena.appendChild(el);
        
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -50 : gameWidth + 50;
            y = Math.random() * gameHeight;
        } else {
            x = Math.random() * gameWidth;
            y = Math.random() > 0.5 ? -50 : gameHeight + 50;
        }

        enemies.push({ x, y, hp: 40 + (player.level * 10), maxHp: 40 + (player.level * 10), speed: 50 + Math.random() * 50, el });
    }

    function fireBossBulletHell() {
        playSound('shoot');
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const vx = Math.cos(angle) * 300;
            const vy = Math.sin(angle) * 300;
            createBullet(currentBoss.x, currentBoss.y, vx, vy, true);
        }
    }

    function updateGems(dt) {
        const dtSec = dt / 1000;
        for (let i = gems.length - 1; i >= 0; i--) {
            const g = gems[i];
            const dist = getDistance(player.x, player.y, g.x, g.y);
            
            if (dist < player.magnetRange) {
                const dx = player.x - g.x;
                const dy = player.y - g.y;
                g.x += (dx/dist) * 300 * dtSec;
                g.y += (dy/dist) * 300 * dtSec;
                
                if (dist < 15) {
                    g.el.remove();
                    gems.splice(i, 1);
                    gainExp(1);
                    playSound('hit');
                }
            }
        }
    }

    function checkCollisions() {
        // Player Bullets vs Enemies
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            let hit = false;
            
            if (bossActive && currentBoss && getDistance(b.x, b.y, currentBoss.x, currentBoss.y) < 40) {
                if (!b.hitSet || !b.hitSet.has(currentBoss)) {
                    damageBoss(player.damage * b.damageMult, b.x, b.y);
                    hit = true;
                    if (b.hitSet) b.hitSet.add(currentBoss);
                }
            }

            if (!hit) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (getDistance(b.x, b.y, e.x, e.y) < 25) {
                        if (!b.hitSet || !b.hitSet.has(e)) {
                            damageEnemy(j, player.damage * b.damageMult, b.x, b.y);
                            hit = true;
                            if (b.hitSet) b.hitSet.add(e);
                            break;
                        }
                    }
                }
            }

            if (hit) {
                createSpark(b.x, b.y);
                if (b.pierceCount > 0) {
                    b.pierceCount--;
                } else {
                    b.el.remove();
                    bullets.splice(i, 1);
                }
            }
        }

        // Enemy Bullets vs Player
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (getDistance(b.x, b.y, player.x, player.y) < 15) {
                damagePlayer(15);
                b.el.remove();
                enemyBullets.splice(i, 1);
            }
        }

        // Enemies vs Player
        enemies.forEach(e => {
            if (getDistance(e.x, e.y, player.x, player.y) < 20) damagePlayer(5);
        });
        if (bossActive && currentBoss && getDistance(currentBoss.x, currentBoss.y, player.x, player.y) < 40) {
            damagePlayer(10);
        }
    }

    // --- Shake Helper ---
    function triggerShake(type) {
        appContainer.classList.remove(type);
        void appContainer.offsetWidth; // trigger reflow
        appContainer.classList.add(type);
        setTimeout(() => appContainer.classList.remove(type), type === 'shake-heavy' ? 500 : 200);
    }

    // --- Damage & Combat ---
    function damageEnemy(index, amount, hitX, hitY) {
        const e = enemies[index];
        e.hp -= amount;
        createFloatingText(Math.ceil(amount), hitX, hitY, false);
        playSound('hit');

        if (e.hp <= 0) {
            score += 10;
            totalCredits += 2; // Also gain credits
            addUltGauge(5);
            spawnGem(e.x, e.y);
            createParticleExplosion(e.x, e.y);
            e.el.remove();
            enemies.splice(index, 1);
            updateHUD();
        } else {
            e.el.style.filter = 'drop-shadow(0 0 20px #fff) brightness(2)';
            setTimeout(() => { if(e.el) e.el.style.filter = 'drop-shadow(0 0 10px #e74c3c)'; }, 100);
        }
    }

    function damageBoss(amount, hitX, hitY) {
        currentBoss.hp -= amount;
        createFloatingText(Math.ceil(amount), hitX, hitY, true);
        playSound('hit');
        triggerShake('shake-light');
        
        const percent = Math.max(0, (currentBoss.hp / currentBoss.maxHp) * 100);
        bossHpBar.style.width = `${percent}%`;

        if (currentBoss.hp <= 0) {
            score += 500;
            totalCredits += 100;
            addUltGauge(50);
            for(let i=0; i<10; i++) spawnGem(currentBoss.x + (Math.random()*10-5), currentBoss.y + (Math.random()*10-5));
            createParticleExplosion(currentBoss.x, currentBoss.y);
            currentBoss.el.remove();
            bossActive = false;
            currentBoss = null;
            bossHpContainer.style.display = 'none';
            triggerShake('shake-heavy');
            playSound('explosion');
            updateHUD();
        } else {
            currentBoss.el.style.filter = 'drop-shadow(0 0 40px #fff) brightness(2)';
            setTimeout(() => { if(currentBoss && currentBoss.el) currentBoss.el.style.filter = 'drop-shadow(0 0 30px #e74c3c)'; }, 100);
        }
    }

    function damagePlayer(amount) {
        if (player.isHit) return;
        player.hp -= amount;
        player.isHit = true;
        playerRocketEmoji.classList.add('ship-hit');
        triggerShake('shake-light');
        updateHUD();
        
        setTimeout(() => {
            player.isHit = false;
            playerRocketEmoji.classList.remove('ship-hit');
        }, 500);

        if (player.hp <= 0) endGame();
    }

    function checkBossSpawn() {
        if (!bossActive && score > 0 && score % 1000 < 50 && score >= 1000) {
            spawnBoss();
        }
    }

    function spawnBoss() {
        bossActive = true;
        const bInfo = { char: '👾', name: '외계 대마왕' };
        
        const el = document.createElement('div');
        el.className = 'boss-enemy';
        el.textContent = bInfo.char;
        
        // 보스도 자동 사격 대상이므로 클릭 이벤트 제거
        battleArena.appendChild(el);
        
        const x = gameWidth / 2; const y = -100;
        currentBoss = { x, y, hp: 3000 + (player.level * 500), maxHp: 3000 + (player.level * 500), speed: 30, el, lastShot: 0 };
        
        bossHpContainer.style.display = 'block';
        bossHpBar.style.width = '100%';
        bossNameText.textContent = bInfo.name;
        
        appContainer.classList.add('shake-heavy');
        playSound('explosion');
    }

    function spawnGem(x, y) {
        const el = document.createElement('div');
        el.className = 'gem';
        el.textContent = '💎';
        battleArena.appendChild(el);
        gems.push({ id: Math.random(), x, y, el });
    }

    function gainExp(amount) {
        player.exp += amount;
        if (player.exp >= player.maxExp) {
            player.exp -= player.maxExp;
            player.level++;
            player.maxExp = Math.floor(player.maxExp * 1.5);
            triggerLevelUp();
        }
        updateHUD();
    }

    function addUltGauge(amount) {
        if (player.ultGauge >= 100) return;
        player.ultGauge = Math.min(100, player.ultGauge + amount);
        updateHUD();
        
        if (player.ultGauge >= 100 && isPlaying && !isPaused) {
            checkUltimate();
        }
    }

    function checkUltimate() {
        player.ultGauge = 0;
        updateHUD();
        playSound('ult');
        
        // Massive Camera Shake
        appContainer.classList.add('shake-heavy');
        setTimeout(() => appContainer.classList.remove('shake-heavy'), 1000);
        
        // Screen Flash
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        gameScreen.appendChild(flash);
        setTimeout(() => flash.remove(), 500);

        const allTargets = bossActive ? [...enemies, currentBoss] : [...enemies];
        allTargets.forEach(t => {
            // Massive Explosion Visual
            const exp = document.createElement('div');
            exp.className = 'massive-explosion';
            exp.style.left = `${t.x}px`;
            exp.style.top = `${t.y}px`;
            battleArena.appendChild(exp);
            setTimeout(() => exp.remove(), 500);
            
            // Giant Laser
            const beam = document.createElement('div');
            beam.className = 'ult-laser';
            beam.style.left = `${t.x}px`;
            beam.style.top = `${t.y}px`;
            beam.style.width = '20px'; // Thicker
            battleArena.appendChild(beam);
            setTimeout(() => beam.remove(), 500);
        });

        // Instant Kill all normal enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            damageEnemy(i, 99999, enemies[i].x, enemies[i].y);
        }
        
        // Heavy damage to boss
        if (bossActive && currentBoss) {
            damageBoss(player.damage * 20, currentBoss.x, currentBoss.y);
        }
        
        showFeedback('OVERLOAD EXPLOSION!', 'critical');
    }

    // --- In-game Level Up (Temporary buffs for current run) ---
    function triggerLevelUp() {
        isPaused = true;
        playSound('levelUp');
        
        const upgradesList = [
            { id: 'dmg', name: '공격력 추가 증가', desc: '현재 전투 레이저 대미지 대폭 상승', icon: '💥' },
            { id: 'spd', name: '엔진 부스트', desc: '현재 전투 우주선 이동 속도 소폭 상승', icon: '🚀' },
            { id: 'mag', name: '자석 모듈 강화', desc: '아이템 끌어당기는 범위 확대', icon: '🧲' },
            { id: 'hp', name: '선체 긴급 수리', desc: 'HP 30 회복', icon: '💖' },
            { id: 'multishot', name: '멀티 레이저', desc: '발사하는 레이저 줄기 수가 증가합니다.', icon: '🌊' },
            { id: 'piercing', name: '관통 레이저', desc: '레이저가 적을 관통하여 타격합니다.', icon: '🏹' },
            { id: 'drone', name: '미니 드론 소환', desc: '자동으로 주변 적을 요격하는 드론을 소환합니다.', icon: '🛰️' }
        ];

        const shuffled = upgradesList.sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        upgradeCardsContainer.innerHTML = '';
        choices.forEach(c => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upg-icon">${c.icon}</div>
                <div class="upg-title">${c.name}</div>
                <div class="upg-desc">${c.desc}</div>
            `;
            card.addEventListener('click', () => applyLevelUpUpgrade(c.id));
            upgradeCardsContainer.appendChild(card);
        });

        levelUpScreen.style.display = 'flex';
        levelUpScreen.style.opacity = '1';
        levelUpScreen.style.pointerEvents = 'auto';
    }

    function applyLevelUpUpgrade(id) {
        switch(id) {
            case 'dmg': player.damage += 15; break;
            case 'spd': player.speed += 5; break;
            case 'mag': player.magnetRange *= 1.3; break;
            case 'hp': player.hp = Math.min(player.maxHp, player.hp + 30); break;
            case 'multishot': player.multishotLevel++; break;
            case 'piercing': player.piercingLevel++; break;
            case 'drone': 
                player.hasDrone = true;
                let droneEl = document.createElement('div');
                droneEl.className = 'drone';
                droneEl.textContent = '🛰️';
                battleArena.appendChild(droneEl);
                drones.push({ x: player.x, y: player.y, el: droneEl, fireTimer: 0 });
                break;
        }
        
        levelUpScreen.style.display = 'none';
        isPaused = false;
        lastTime = performance.now(); 
        updateHUD();
    }

    // --- Visuals & UI ---
    function render() {
        playerContainer.style.left = `${player.x}px`;
        playerContainer.style.top = `${player.y}px`;

        enemies.forEach(e => {
            if(e.el) { e.el.style.left = `${e.x}px`; e.el.style.top = `${e.y}px`; }
        });
        
        if (bossActive && currentBoss && currentBoss.el) {
            currentBoss.el.style.left = `${currentBoss.x}px`;
            currentBoss.el.style.top = `${currentBoss.y}px`;
        }

        bullets.forEach(b => { if(b.el) { b.el.style.left = `${b.x}px`; b.el.style.top = `${b.y}px`; } });
        enemyBullets.forEach(b => { if(b.el) { b.el.style.left = `${b.x}px`; b.el.style.top = `${b.y}px`; } });
        gems.forEach(g => { if(g.el) { g.el.style.left = `${g.x}px`; g.el.style.top = `${g.y}px`; } });
    }

    function updateHUD() {
        scoreEl.textContent = score;
        playerLevelEl.textContent = player.level;
        
        const expPercent = (player.exp / player.maxExp) * 100;
        expBar.style.width = `${expPercent}%`;
        
        playerHpText.textContent = Math.ceil(player.hp);
        playerHpText.style.color = player.hp < 30 ? '#e74c3c' : '#fff';
        
        ultBar.style.width = `${player.ultGauge}%`;
        if (player.ultGauge >= 100) {
            ultBar.style.background = '#ff00ff';
            ultReadyText.style.display = 'block';
        } else {
            ultBar.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
            ultReadyText.style.display = 'none';
        }
    }

    function createParticleExplosion(x, y) {
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 80 + 20; // 픽셀 스케일로 키움
            const tx = x + Math.cos(angle) * dist;
            const ty = y + Math.sin(angle) * dist;
            p.style.transition = 'all 0.5s cubic-bezier(0.1, 0.8, 0.3, 1)';
            battleArena.appendChild(p);
            
            setTimeout(() => {
                p.style.left = `${tx}px`;
                p.style.top = `${ty}px`;
                p.style.opacity = '0';
            }, 10);
            
            setTimeout(() => p.remove(), 500);
        }
    }

    function createSpark(x, y) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        battleArena.appendChild(p);
        setTimeout(() => p.remove(), 200);
    }

    function createFloatingText(text, x, y, isCrit) {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-dmg ${isCrit ? 'critical' : ''}`;
        floatEl.textContent = text;
        floatEl.style.left = `calc(${x}px + ${(Math.random()-0.5)*40}px)`;
        floatEl.style.top = `calc(${y}px + ${(Math.random()-0.5)*40}px)`;
        battleArena.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 800);
    }

    function showFeedback(text, type) {
        const f = document.createElement('div');
        f.className = `floating-dmg ${type}`;
        f.style.fontSize = '3rem';
        f.style.left = '50%';
        f.style.top = '20%';
        f.style.transform = 'translate(-50%, 0)';
        f.textContent = text;
        battleArena.appendChild(f);
        setTimeout(() => f.remove(), 1000);
    }

    function getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    }

    // --- End Game ---
    function endGame() {
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);
        
        document.getElementById('final-score').textContent = score;
        
        // Save credits
        localStorage.setItem('spaceRaidCredits', totalCredits);
        updateShopUI();
        
        showScreen(resultScreen);
        saveAndShowRanking(score);
    }

    function saveAndShowRanking(newScore) {
        if (newScore > 0) {
            setTimeout(() => {
                let name = prompt(`생존 기록! (Score: ${newScore})\n요원의 이름을 남겨주세요:`, "익명");
                if (!name || name.trim() === "") name = "익명";
                
                rankings.push({ name: name.trim(), score: newScore, date: new Date().toLocaleDateString() });
                rankings.sort((a, b) => b.score - a.score);
                rankings = rankings.slice(0, 5);
                localStorage.setItem('spaceRaidRankings', JSON.stringify(rankings));
                updateRankingUI();
            }, 500);
        } else {
            updateRankingUI();
        }
    }

    function updateRankingUI() {
        const rankingListEl = document.getElementById('ranking-list');
        if (!rankingListEl) return;
        rankingListEl.innerHTML = '';
        if (rankings.length === 0) {
            rankingListEl.innerHTML = '<li style="justify-content:center; color:#999;">기록이 없습니다.</li>';
            return;
        }

        rankings.forEach((rank, index) => {
            const li = document.createElement('li');
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `${index + 1}위`;
            
            li.innerHTML = `<span>${medal} ${rank.name}</span> <span>${rank.score}점</span>`;
            rankingListEl.appendChild(li);
        });
    }

    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');
    }
});
