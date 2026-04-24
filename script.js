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

    // Customizer Elements
    const rocketPreview = document.getElementById('rocket-preview');
    const colorBtns = document.querySelectorAll('.color-btn');
    const charBtns = document.querySelectorAll('.char-btn');
    
    // --- Audio System (Placeholder) ---
    function playSound(type) {
        // console.log('Playing sound:', type);
    }

    // --- Game State ---
    let animationFrameId;
    let isPlaying = false;
    let isPaused = false;
    let lastTime = 0;
    
    let score = 0;
    let rankings = JSON.parse(localStorage.getItem('spaceRaidRankings')) || [];
    let playerChar = localStorage.getItem('spaceRaidPlayerChar') || '🛸';
    let rocketColor = localStorage.getItem('spaceRaidRocketColor') || 'hue-rotate(0deg)';
    
    let totalCredits = parseInt(localStorage.getItem('spaceRaidCredits')) || 0;
    let persistentUpgrades = JSON.parse(localStorage.getItem('spaceRaidUpgrades')) || { damage: 0, speed: 0 };

    const player = {
        x: 50, y: 50,
        speed: 30, // % per second
        hp: 100, maxHp: 100,
        level: 1, exp: 0, maxExp: 10,
        damage: 20, 
        ultGauge: 0,
        magnetRange: 15,
        isHit: false
    };

    const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false };
    
    let enemies = [];
    let bullets = [];
    let enemyBullets = [];
    let gems = [];
    
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

    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
        // Shift key ultimate removed (Auto now)
    });
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });

    // Arena click for missing
    battleArena.addEventListener('pointerdown', (e) => {
        if (!isPlaying || isPaused) return;
        if (e.target === battleArena) {
            // Clicked empty space
            fireLaserAtCoord(player.x + 10, player.y); // just shoot forward
        }
    });

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
        player.x = 50; player.y = 50;
        player.hp = player.maxHp = 100;
        player.level = 1; player.exp = 0; player.maxExp = 10;
        
        // Apply persistent upgrades to base stats
        player.damage = 20 + (persistentUpgrades.damage * 5);
        player.speed = 30 + (persistentUpgrades.speed * 5);
        
        player.ultGauge = 0; player.magnetRange = 15;
        
        score = 0;
        enemySpawnInterval = 1500;
        bossActive = false;
        currentBoss = null;
        
        // Clear DOM entities
        battleArena.querySelectorAll('.enemy, .boss-enemy, .gem, .bullet, .enemy-bullet, .particle, .floating-dmg, .ult-laser').forEach(e => e.remove());
        enemies = []; bullets = []; enemyBullets = []; gems = [];
        
        updateHUD();
        bossHpContainer.style.display = 'none';
        levelUpScreen.style.display = 'none';
        
        isPlaying = true;
        isPaused = false;
        showScreen(gameScreen);
        
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        if (!isPlaying) return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (!isPaused) {
            updatePlayer(deltaTime);
            updateEnemies(deltaTime, timestamp);
            updateBullets(deltaTime);
            updateGems(deltaTime);
            checkCollisions();
            checkBossSpawn();
        }

        render();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Update Logic ---
    function updatePlayer(dt) {
        const dtSec = dt / 1000;
        let dx = 0; let dy = 0;
        
        if (keys.w || keys.ArrowUp) dy -= player.speed * dtSec;
        if (keys.s || keys.ArrowDown) dy += player.speed * dtSec;
        if (keys.a || keys.ArrowLeft) dx -= player.speed * dtSec;
        if (keys.d || keys.ArrowRight) dx += player.speed * dtSec;
        
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; dy *= 0.707;
        }

        player.x += dx; player.y += dy;
        
        if (player.x < 5) player.x = 5; if (player.x > 95) player.x = 95;
        if (player.y < 5) player.y = 5; if (player.y > 95) player.y = 95;
    }

    // Manual firing based on click
    function fireLaserAtTarget(target) {
        if (!isPlaying || isPaused) return;
        
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        
        if (length === 0) return;
        
        const vx = (dx / length) * 150; 
        const vy = (dy / length) * 150;
        
        createBullet(player.x, player.y, vx, vy, false);
        playSound('shoot');
    }

    function fireLaserAtCoord(tx, ty) {
        const dx = tx - player.x;
        const dy = ty - player.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const vx = (dx / length) * 150; 
        const vy = (dy / length) * 150;
        createBullet(player.x, player.y, vx, vy, false);
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

        const list = isEnemy ? enemyBullets : bullets;
        list.push({ id: Math.random(), x, y, vx, vy, el, isEnemy });
    }

    function updateBullets(dt) {
        const dtSec = dt / 1000;
        [bullets, enemyBullets].forEach(list => {
            for (let i = list.length - 1; i >= 0; i--) {
                const b = list[i];
                b.x += b.vx * dtSec;
                b.y += b.vy * dtSec;
                
                if (b.x < -10 || b.x > 110 || b.y < -10 || b.y > 110) {
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
            if (len > 20) {
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
        
        // Manual click targeting
        el.addEventListener('pointerdown', (evt) => {
            evt.stopPropagation();
            if (!isPlaying || isPaused) return;
            const target = enemies.find(e => e.el === el);
            if (target) fireLaserAtTarget(target);
        });

        battleArena.appendChild(el);
        
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -5 : 105;
            y = Math.random() * 100;
        } else {
            x = Math.random() * 100;
            y = Math.random() > 0.5 ? -5 : 105;
        }

        enemies.push({ x, y, hp: 40 + (player.level * 10), maxHp: 40 + (player.level * 10), speed: 10 + Math.random() * 10, el });
    }

    function fireBossBulletHell() {
        playSound('shoot');
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const vx = Math.cos(angle) * 40;
            const vy = Math.sin(angle) * 40;
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
                g.x += (dx/dist) * 60 * dtSec;
                g.y += (dy/dist) * 60 * dtSec;
                
                if (dist < 3) {
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
            
            if (bossActive && currentBoss && getDistance(b.x, b.y, currentBoss.x, currentBoss.y) < 8) {
                damageBoss(player.damage, b.x, b.y);
                hit = true;
            }

            if (!hit) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (getDistance(b.x, b.y, e.x, e.y) < 5) {
                        damageEnemy(j, player.damage, b.x, b.y);
                        hit = true;
                        break;
                    }
                }
            }

            if (hit) {
                createSpark(b.x, b.y);
                b.el.remove();
                bullets.splice(i, 1);
            }
        }

        // Enemy Bullets vs Player
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            if (getDistance(b.x, b.y, player.x, player.y) < 3) {
                damagePlayer(15);
                b.el.remove();
                enemyBullets.splice(i, 1);
            }
        }

        // Enemies vs Player
        enemies.forEach(e => {
            if (getDistance(e.x, e.y, player.x, player.y) < 4) damagePlayer(5);
        });
        if (bossActive && currentBoss && getDistance(currentBoss.x, currentBoss.y, player.x, player.y) < 8) {
            damagePlayer(10);
        }
    }

    // --- Damage & Combat ---
    function damageEnemy(index, amount, hitX, hitY) {
        const e = enemies[index];
        e.hp -= amount;
        createFloatingText(amount, hitX, hitY, false);
        playSound('hit');

        if (e.hp <= 0) {
            score += 10;
            totalCredits += 2; // Also gain credits
            addUltGauge(5);
            spawnGem(e.x, e.y);
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
        createFloatingText(amount, hitX, hitY, true);
        playSound('hit');
        
        const percent = Math.max(0, (currentBoss.hp / currentBoss.maxHp) * 100);
        bossHpBar.style.width = `${percent}%`;

        if (currentBoss.hp <= 0) {
            score += 500;
            totalCredits += 100;
            addUltGauge(50);
            for(let i=0; i<10; i++) spawnGem(currentBoss.x + (Math.random()*10-5), currentBoss.y + (Math.random()*10-5));
            currentBoss.el.remove();
            bossActive = false;
            currentBoss = null;
            bossHpContainer.style.display = 'none';
            appContainer.classList.add('shake-heavy');
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
        appContainer.classList.add('shake-light');
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
        
        // Manual click targeting for Boss
        el.addEventListener('pointerdown', (evt) => {
            evt.stopPropagation();
            if (!isPlaying || isPaused) return;
            fireLaserAtTarget(currentBoss);
        });

        battleArena.appendChild(el);
        
        const x = 50; const y = -10;
        currentBoss = { x, y, hp: 3000 + (player.level * 500), maxHp: 3000 + (player.level * 500), speed: 5, el, lastShot: 0 };
        
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
            exp.style.left = `${t.x}%`;
            exp.style.top = `${t.y}%`;
            battleArena.appendChild(exp);
            setTimeout(() => exp.remove(), 500);
            
            // Giant Laser
            const beam = document.createElement('div');
            beam.className = 'ult-laser';
            beam.style.left = `${t.x}%`;
            beam.style.top = `${t.y}%`;
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
            { id: 'hp', name: '선체 긴급 수리', desc: 'HP 30 회복', icon: '💖' }
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
        }
        
        levelUpScreen.style.display = 'none';
        isPaused = false;
        lastTime = performance.now(); 
        updateHUD();
    }

    // --- Visuals & UI ---
    function render() {
        playerContainer.style.left = `${player.x}%`;
        playerContainer.style.top = `${player.y}%`;

        enemies.forEach(e => {
            if(e.el) { e.el.style.left = `${e.x}%`; e.el.style.top = `${e.y}%`; }
        });
        
        if (bossActive && currentBoss && currentBoss.el) {
            currentBoss.el.style.left = `${currentBoss.x}%`;
            currentBoss.el.style.top = `${currentBoss.y}%`;
        }

        bullets.forEach(b => { if(b.el) { b.el.style.left = `${b.x}%`; b.el.style.top = `${b.y}%`; } });
        enemyBullets.forEach(b => { if(b.el) { b.el.style.left = `${b.x}%`; b.el.style.top = `${b.y}%`; } });
        gems.forEach(g => { if(g.el) { g.el.style.left = `${g.x}%`; g.el.style.top = `${g.y}%`; } });
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

    function createSpark(x, y) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        battleArena.appendChild(p);
        setTimeout(() => p.remove(), 200);
    }

    function createFloatingText(text, x, y, isCrit) {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-dmg ${isCrit ? 'critical' : ''}`;
        floatEl.textContent = text;
        floatEl.style.left = `calc(${x}% + ${(Math.random()-0.5)*20}px)`;
        floatEl.style.top = `calc(${y}% + ${(Math.random()-0.5)*20}px)`;
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
