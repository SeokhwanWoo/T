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

    // --- Assets Manager (Removed for zero-dependency) ---
    // 외부 이미지나 CDN에 의존하지 않고 기본 이모지/도형만 사용하여 에러를 원천 차단합니다.

    // 초기화 코드는 하단 initCustomizer()에서 안전하게 호출됩니다.

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
    let rocketColor = localStorage.getItem('spaceRaidRocketColor') || 'blue'; // blue, red, green
    
    let totalCredits = parseInt(localStorage.getItem('spaceRaidCredits')) || 0;
    let persistentUpgrades = JSON.parse(localStorage.getItem('spaceRaidUpgrades')) || { damage: 0, speed: 0, fireRate: 0 };
    if (persistentUpgrades.fireRate === undefined) persistentUpgrades.fireRate = 0;

    const player = {
        x: gameWidth / 2, y: gameHeight / 2,
        speed: 300, // px per second
        hp: 100, maxHp: 100,
        level: 1, exp: 0, maxExp: 15,
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
    let particles = [];
    let cinematicEffects = [];
    let asteroids = [];
    let capsules = [];
    let combo = 0;
    let comboTimer = 0;
    let isFever = false;
    let feverTimer = 0;

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
    }

    function applyRocketColor(color) {
        rocketPreview.textContent = '🚀';
        rocketPreview.style.backgroundImage = 'none';
        rocketPreview.style.fontSize = '35px';
        rocketPreview.style.display = 'flex';
        rocketPreview.style.alignItems = 'center';
        rocketPreview.style.justifyContent = 'center';
        rocketPreview.style.width = '50px';
        rocketPreview.style.height = '50px';
        
        if (color === 'red') rocketPreview.style.filter = 'hue-rotate(120deg)';
        else if (color === 'green') rocketPreview.style.filter = 'hue-rotate(240deg)';
        else rocketPreview.style.filter = 'none';
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
        asteroids = []; capsules = []; cinematicEffects = []; particles = [];
        combo = 0; comboTimer = 0; isFever = false; feverTimer = 0;
        enemySpawnTimer = 0;
        
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
            updateDrones(deltaTime);
            updateGems(deltaTime);
            updateHazards(deltaTime); // 소행성 및 캡슐 업데이트
            updateCombo(deltaTime);
            checkCollisions();
            updateEffects(deltaTime);
        }

        drawStarfield(deltaTime);
        render();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function updateEffects(dt) {
        const dtSec = dt / 1000;
        [particles, floatingTexts, cinematicEffects].forEach(list => {
            for (let i = list.length - 1; i >= 0; i--) {
                const e = list[i];
                e.life -= dtSec;
                if (e.update) e.update(dtSec);
                if (e.life <= 0) {
                    e.el.remove();
                    list.splice(i, 1);
                }
            }
        });

        // Update Hit Timers for Flash Effects
        if (player.isHit) {
            player.hitTimer -= dtSec;
            if (player.hitTimer <= 0) player.isHit = false;
        }
        
        enemies.forEach(e => {
            if (e.isHit) {
                e.hitTimer -= dtSec;
                if (e.hitTimer <= 0) e.isHit = false;
            }
        });

        if (bossActive && currentBoss && currentBoss.isHit) {
            currentBoss.hitTimer -= dtSec;
            if (currentBoss.hitTimer <= 0) currentBoss.isHit = false;
        }
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
        bullets.push({ id: Math.random(), x, y, vx, vy, isEnemy: false, damageMult: 0.5, hitSet: null, pierceCount: 0 });
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
        const isPiercing = !isEnemy && player.piercingLevel > 0;
        const hitSet = isPiercing ? new Set() : null;
        const pierceCount = isPiercing ? player.piercingLevel : 0;

        const list = isEnemy ? enemyBullets : bullets;
        list.push({ id: Math.random(), x, y, vx, vy, isEnemy, damageMult: 1, hitSet, pierceCount });
    }

    function updateBullets(dt) {
        const dtSec = dt / 1000;
        // Player Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * dtSec;
            b.y += b.vy * dtSec;
            
            if (b.x < -50 || b.x > gameWidth + 50 || b.y < -50 || b.y > gameHeight + 50) {
                bullets.splice(i, 1);
            }
        }
        // Enemy Bullets
        enemyBullets.forEach((b, i) => {
            b.x += b.vx * dtSec;
            b.y += b.vy * dtSec;
            if (b.y > gameHeight + 50 || b.y < -50 || b.x < -50 || b.x > gameWidth + 50) {
                enemyBullets.splice(i, 1);
            }
        });
    }

    function updateHazards(dt) {
        const dtSec = dt / 1000;
        
        // Asteroids
        if (Math.random() < 0.005) {
            asteroids.push({
                x: Math.random() * gameWidth,
                y: -50,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 100 + 50,
                hp: 30,
                rot: 0,
                rotSpeed: (Math.random() - 0.5) * 5
            });
        }
        
        for(let i = asteroids.length - 1; i >= 0; i--) {
            let a = asteroids[i];
            a.x += a.vx * dtSec;
            a.y += a.vy * dtSec;
            a.rot += a.rotSpeed * dtSec;
            if(a.y > gameHeight + 100) asteroids.splice(i, 1);
        }

        // Capsules
        if (Math.random() < 0.001) {
            capsules.push({
                x: Math.random() * gameWidth,
                y: -30,
                vy: 50,
                type: Math.random() < 0.5 ? 'shield' : 'berserk'
            });
        }

        for(let i = capsules.length - 1; i >= 0; i--) {
            let c = capsules[i];
            c.y += c.vy * dtSec;
            if(c.y > gameHeight + 50) capsules.splice(i, 1);
        }
    }

    function updateCombo(dt) {
        const dtSec = dt / 1000;
        if (combo > 0 && !isFever) {
            comboTimer -= dtSec;
            if (comboTimer <= 0) combo = 0;
        }
        
        if (isFever) {
            feverTimer -= dtSec;
            if (feverTimer <= 0) {
                isFever = false;
                combo = 0;
                player.fireRate = player.fireRate * 2; // 원상복구
            }
        }
    }

    function addCombo() {
        combo++;
        comboTimer = 2.0; // 2초 내에 적을 처치해야 콤보 유지
        if (combo >= 30 && !isFever) {
            isFever = true;
            feverTimer = 5.0; // 5초 피버타임
            player.fireRate = player.fireRate / 2; // 발사속도 2배
            playSound('fever');
            createFloatingText("FEVER TIME!", player.x, player.y - 40, true);
        }
    }

    function updateEnemies(dt, timestamp) {
        const dtSec = dt / 1000;
        enemySpawnTimer += dt;
        
        if (enemySpawnTimer > enemySpawnInterval && !bossActive && player.level !== 5 && player.level !== 10) {
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
            // Boss Movement AI
            if (currentBoss.isFinal) {
                // LV 10 Final Boss: 화면 상단을 천천히 좌우 왕복
                currentBoss.y = Math.min(100, currentBoss.y + currentBoss.speed * dtSec); // 상단 100px 부근 고정
                currentBoss.x += currentBoss.speed * currentBoss.dir * dtSec;
                if (currentBoss.x < 150) currentBoss.dir = 1;
                if (currentBoss.x > gameWidth - 150) currentBoss.dir = -1;
            } else {
                // LV 5 Mid Boss: 좌우로 빠르게 이동
                currentBoss.y = Math.min(150, currentBoss.y + currentBoss.speed * dtSec);
                currentBoss.x += currentBoss.speed * currentBoss.dir * dtSec;
                if (currentBoss.x < 100) currentBoss.dir = 1;
                if (currentBoss.x > gameWidth - 100) currentBoss.dir = -1;
            }

            if (!currentBoss.lastShot || timestamp - currentBoss.lastShot > (currentBoss.isFinal ? 1000 : 1500)) {
                currentBoss.lastShot = timestamp;
                fireBossBulletHell();
            }
        }
    }

    function spawnEnemy() {
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -50 : gameWidth + 50;
            y = Math.random() * gameHeight;
        } else {
            x = Math.random() * gameWidth;
            y = Math.random() > 0.5 ? -50 : gameHeight + 50;
        }

        // Random enemy asset index
        const typeIdx = Math.floor(Math.random() * 5);
        enemies.push({ x, y, hp: 40 + (player.level * 10), maxHp: 40 + (player.level * 10), speed: 50 + Math.random() * 50, typeIdx, isHit: false, hitTimer: 0 });
    }

    function fireBossBulletHell() {
        playSound('shoot');
        
        if (currentBoss.isFinal) {
            // 원형(360도) 흩뿌리기 탄막
            const numBullets = 24;
            const angleOffset = Math.random() * Math.PI; // 회전 효과
            for (let i = 0; i < numBullets; i++) {
                const angle = (Math.PI * 2 / numBullets) * i + angleOffset;
                const vx = Math.cos(angle) * 200;
                const vy = Math.sin(angle) * 200;
                createBullet(currentBoss.x, currentBoss.y, vx, vy, true);
            }
        } else {
            // 플레이어 방향 3갈래
            const dx = player.x - currentBoss.x;
            const dy = player.y - currentBoss.y;
            const baseAngle = Math.atan2(dy, dx);
            
            [-0.2, 0, 0.2].forEach(offset => {
                const angle = baseAngle + offset;
                const vx = Math.cos(angle) * 400;
                const vy = Math.sin(angle) * 400;
                createBullet(currentBoss.x, currentBoss.y, vx, vy, true);
            });
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
                    bullets.splice(i, 1);
                }
            }
        }

        // Enemy Bullets vs Player
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (getDistance(b.x, b.y, player.x, player.y) < 15) {
                damagePlayer(15);
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

        // Player Bullets vs Asteroids
        for(let i=bullets.length-1; i>=0; i--) {
            const b = bullets[i];
            let hit = false;
            for(let j=asteroids.length-1; j>=0; j--) {
                const a = asteroids[j];
                if(getDistance(b.x, b.y, a.x, a.y) < 20) {
                    a.hp -= player.damage * b.damageMult;
                    createFloatingText(Math.ceil(player.damage * b.damageMult), b.x, b.y, false);
                    hit = true;
                    if(a.hp <= 0) {
                        createParticleExplosion(a.x, a.y);
                        asteroids.splice(j, 1);
                        score += 5;
                    }
                    break;
                }
            }
            if(hit) {
                createSpark(b.x, b.y);
                if(b.pierceCount > 0) b.pierceCount--;
                else bullets.splice(i, 1);
            }
        }

        // Capsules vs Player
        for(let i=capsules.length-1; i>=0; i--) {
            const c = capsules[i];
            if(getDistance(player.x, player.y, c.x, c.y) < 25) {
                if(c.type === 'shield') {
                    player.hp = Math.min(player.maxHp, player.hp + 50);
                    createFloatingText("+50 HP", player.x, player.y - 20, true);
                } else if(c.type === 'berserk') {
                    isFever = true;
                    feverTimer = 5.0;
                    player.fireRate = player.fireRate / 2;
                    createFloatingText("BERSERK!", player.x, player.y - 20, true);
                }
                playSound('powerup');
                capsules.splice(i, 1);
            }
        }

        // Asteroids vs Player
        for(let i=asteroids.length-1; i>=0; i--) {
            const a = asteroids[i];
            if(getDistance(player.x, player.y, a.x, a.y) < 25) {
                damagePlayer(15);
                createParticleExplosion(a.x, a.y);
                asteroids.splice(i, 1);
            }
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
            totalCredits += 2; 
            addUltGauge(5);
            addCombo();
            spawnGem(e.x, e.y);
            createParticleExplosion(e.x, e.y);
            enemies.splice(index, 1);
            updateHUD();
        } else {
            e.isHit = true;
            e.hitTimer = 0.1; // 100ms
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
            
            const killedBossLevel = player.level;
            bossActive = false;
            currentBoss = null;
            bossHpContainer.style.display = 'none';
            triggerShake('shake-heavy');
            playSound('explosion');
            updateHUD();
            
            if (killedBossLevel === 10) {
                const cText = document.getElementById('cinematic-text');
                cText.style.display = 'block';
                document.getElementById('cinematic-title').textContent = 'MISSION COMPLETE';
                document.getElementById('cinematic-subtitle').textContent = '우주의 평화를 지켰습니다!';
                document.getElementById('cinematic-title').style.color = '#2ecc71';
                setTimeout(() => endGame(true), 3000);
            } else {
                player.exp = player.maxExp;
                gainExp(0); // Trigger level 6
            }
        } else {
            currentBoss.isHit = true;
            currentBoss.hitTimer = 0.1;
        }
    }

    function damagePlayer(amount) {
        if (player.isHit) return;
        player.hp -= amount;
        player.isHit = true;
        player.hitTimer = 0.5;
        triggerShake('shake-light');
        updateHUD();
        
        if (player.hp <= 0) endGame();
    }

    function spawnBoss(level) {
        bossActive = true;
        const isFinal = level === 10;
        const bInfo = isFinal ? { name: '우주 포식자 (최종 보스)' } : { name: '외계 대마왕 (중간 보스)' };
        
        const x = gameWidth / 2; const y = -100;
        const maxHp = 5000 + (level * 1000);
        // dir 변수 추가 (이동 방향)
        currentBoss = { x, y, hp: maxHp, maxHp: maxHp, speed: isFinal ? 150 : 300, dir: 1, isFinal, isHit: false, hitTimer: 0, lastShot: 0 };
        
        bossHpContainer.style.display = 'block';
        bossHpBar.style.width = '100%';
        bossNameText.textContent = bInfo.name;
        
        appContainer.classList.add('shake-heavy');
        playSound('explosion');
    }

    function spawnGem(x, y) {
        gems.push({ id: Math.random(), x, y });
    }

    function gainExp(amount) {
        if (bossActive) return;

        player.exp += amount;
        if (player.exp >= player.maxExp) {
            player.exp -= player.maxExp;
            player.level++;
            
            if (player.level > 10) player.level = 10;
            
            player.maxExp = 10 + (player.level * 5); 
            
            if (player.level === 5 || player.level === 10) {
                triggerBossWarning(player.level);
            } else {
                triggerLevelUp();
            }
        }
        updateHUD();
    }

    function addUltGauge(amount) {
        if (player.ultGauge >= 100) return;
        player.ultGauge = Math.min(100, player.ultGauge + amount);
        updateHUD();
        // 궁극기 자동 발사 버그 원인 제거 (수동 발사만 지원)
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
        cinematicEffects.push({ el: flash, life: 0.5 });

        const allTargets = bossActive ? [...enemies, currentBoss] : [...enemies];
        allTargets.forEach(t => {
            // Massive Explosion Visual
            const exp = document.createElement('div');
            exp.className = 'massive-explosion';
            exp.style.left = `${t.x}px`;
            exp.style.top = `${t.y}px`;
            battleArena.appendChild(exp);
            cinematicEffects.push({ el: exp, life: 0.5 });
            
            // Giant Laser
            const beam = document.createElement('div');
            beam.className = 'ult-laser';
            beam.style.left = `${t.x}px`;
            beam.style.top = `${t.y}px`;
            beam.style.width = '20px'; // Thicker
            battleArena.appendChild(beam);
            cinematicEffects.push({ el: beam, life: 0.5 });
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
        
        const cText = document.getElementById('cinematic-text');
        cText.style.display = 'block';
        document.getElementById('cinematic-title').textContent = 'LEVEL UP!';
        document.getElementById('cinematic-subtitle').textContent = '난이도가 상승합니다!';
        
        setTimeout(() => {
            cText.style.display = 'none';
            showUpgradeCards();
        }, 1500);
    }

    function triggerBossWarning(level) {
        isPaused = true;
        playSound('levelUp'); // Warning sound would be better, using levelUp for now
        
        const cText = document.getElementById('cinematic-text');
        cText.style.display = 'block';
        document.getElementById('cinematic-title').textContent = 'WARNING!';
        document.getElementById('cinematic-subtitle').textContent = level === 10 ? '최종 보스 접근 중...' : '거대 보스 접근 중...';
        document.getElementById('cinematic-title').style.color = '#e74c3c';
        
        setTimeout(() => {
            cText.style.display = 'none';
            document.getElementById('cinematic-title').style.color = '';
            isPaused = false;
            lastTime = performance.now();
            spawnBoss(level);
        }, 2000);
    }

    function showUpgradeCards() {
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
                drones.push({ x: player.x, y: player.y, fireTimer: 0 });
                break;
        }
        
        levelUpScreen.style.display = 'none';
        isPaused = false;
        lastTime = performance.now(); 
        updateHUD();
    }

    // --- Visuals & UI ---
    function drawEmoji(emoji, x, y, size, isHit) {
        ctx.font = `${size * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x + size/2, y + size/2);
        
        if (isHit) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x, y, size, size);
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    function render() {
        // Player
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Rotate player towards mouse
        const dx = mousePos.x - player.x;
        const dy = mousePos.y - player.y;
        const angle = Math.atan2(dy, dx) + Math.PI/2; 
        ctx.rotate(angle);

        if (rocketColor === 'red') ctx.filter = 'hue-rotate(120deg)';
        else if (rocketColor === 'green') ctx.filter = 'hue-rotate(240deg)';
        
        drawEmoji('🚀', -25, -25, 50, player.isHit);
        ctx.restore();
        
        // Drones
        drones.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛰️', 0, 0);
            ctx.restore();
        });

        // Enemies
        const enemyEmojis = ['🛸', '👾', '👽', '💀', '☄️'];
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            
            // rotate towards player
            const edx = player.x - e.x;
            const edy = player.y - e.y;
            const eAngle = Math.atan2(edy, edx) + Math.PI/2;
            ctx.rotate(eAngle);

            drawEmoji(enemyEmojis[e.typeIdx], -25, -25, 50, e.isHit);
            ctx.restore();
        });

        // Boss
        if (bossActive && currentBoss) {
            ctx.save();
            ctx.translate(currentBoss.x, currentBoss.y);
            
            // rotate boss towards player
            const bdx = player.x - currentBoss.x;
            const bdy = player.y - currentBoss.y;
            const bAngle = Math.atan2(bdy, bdx) + Math.PI/2;
            ctx.rotate(bAngle);
            
            const isFinal = currentBoss.isFinal;
            const size = isFinal ? 250 : 120;
            const bEmoji = isFinal ? '👹' : '👾';
            
            drawEmoji(bEmoji, -size/2, -size/2, size, currentBoss.isHit);
            ctx.restore();
        }

        // Bullets
        ctx.fillStyle = '#3498db'; 
        bullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            const bAngle = Math.atan2(b.vy, b.vx);
            ctx.rotate(bAngle);
            ctx.fillRect(-10, -2, 20, 4); 
            ctx.restore();
        });

        ctx.fillStyle = '#e74c3c'; 
        enemyBullets.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        });

        // Gems
        ctx.font = '20px sans-serif';
        gems.forEach(g => {
            ctx.fillText('💎', g.x - 10, g.y + 10);
        });

        // Asteroids (Text Fallback)
        ctx.font = '30px sans-serif';
        asteroids.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.rot);
            ctx.fillText('☄️', -15, 10);
            ctx.restore();
        });

        // Capsules (Text Fallback)
        capsules.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.font = '24px sans-serif';
            ctx.fillStyle = c.type === 'shield' ? '#3498db' : '#e74c3c';
            ctx.fillText('💊', -12, 8);
            
            // Draw aura
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI*2);
            ctx.strokeStyle = c.type === 'shield' ? 'rgba(52, 152, 219, 0.5)' : 'rgba(231, 76, 60, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        });
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
            const dist = Math.random() * 80 + 20; 
            const tx = x + Math.cos(angle) * dist;
            const ty = y + Math.sin(angle) * dist;
            p.style.transition = 'all 0.5s cubic-bezier(0.1, 0.8, 0.3, 1)';
            battleArena.appendChild(p);
            
            // Trigger animation next frame
            requestAnimationFrame(() => {
                p.style.left = `${tx}px`;
                p.style.top = `${ty}px`;
                p.style.opacity = '0';
            });
            
            particles.push({ el: p, life: 0.5 });
        }
    }

    function createSpark(x, y) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        battleArena.appendChild(p);
        particles.push({ el: p, life: 0.2 });
    }

    function createFloatingText(text, x, y, isCrit) {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-dmg ${isCrit ? 'critical' : ''}`;
        floatEl.textContent = text;
        floatEl.style.left = `calc(${x}px + ${(Math.random()-0.5)*40}px)`;
        floatEl.style.top = `calc(${y}px + ${(Math.random()-0.5)*40}px)`;
        battleArena.appendChild(floatEl);
        floatingTexts.push({ el: floatEl, life: 0.8 });
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
        floatingTexts.push({ el: f, life: 1.0 });
    }

    function getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy);
    }

    // --- End Game ---
    function endGame(isVictory = false) {
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);
        
        if (isVictory) score += 10000;
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
