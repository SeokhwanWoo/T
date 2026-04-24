document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const rankingScreen = document.getElementById('ranking-screen');
    const shopScreen = document.getElementById('shop-screen');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    const goHomeBtn = document.getElementById('go-home-btn');
    const resetRankingBtn = document.getElementById('reset-ranking-btn');
    const shopBtn = document.getElementById('shop-btn');
    const shopBackBtn = document.getElementById('shop-back-btn');
    
    const fuelBar = document.getElementById('fuel-bar');
    const timeLeftText = document.getElementById('time-left-text');
    const scoreEl = document.getElementById('score');
    const comboDisplay = document.getElementById('combo-display');
    const feedbackEl = document.getElementById('feedback');
    const battleArena = document.getElementById('battle-arena');
    
    const finalScoreEl = document.getElementById('final-score');
    const ratingEl = document.getElementById('rating');
    const appContainer = document.getElementById('app');

    const rocketPreview = document.getElementById('rocket-preview');
    const playerRocketEmoji = document.getElementById('player-rocket-emoji');
    const bossMonsterEmoji = document.querySelector('.boss-emoji');
    const bossMonster = document.getElementById('boss-monster');
    const bossShield = document.getElementById('boss-shield');
    const enrageWarning = document.getElementById('enrage-warning');
    const laserBeam = document.getElementById('laser-beam');
    const bossHpContainer = document.getElementById('boss-hp-container');
    const bossNameText = document.querySelector('.boss-name');
    
    const colorBtns = document.querySelectorAll('.color-btn');
    const charBtns = document.querySelectorAll('.char-btn');

    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossHpText = document.getElementById('boss-hp-text');

    const skillTime = document.getElementById('skill-time');
    const skillShield = document.getElementById('skill-shield');
    const skillEmp = document.getElementById('skill-emp');
    const empCountEl = document.getElementById('emp-count');

    // Shop Elements
    const totalCreditsEl = document.getElementById('total-credits');
    const shopCreditsEl = document.getElementById('shop-credits');
    const upgFuelLevel = document.getElementById('upg-fuel-level');
    const upgFuelCost = document.getElementById('upg-fuel-cost');
    const buyFuelBtn = document.getElementById('buy-fuel-btn');
    
    const upgDmgLevel = document.getElementById('upg-dmg-level');
    const upgDmgCost = document.getElementById('upg-dmg-cost');
    const buyDmgBtn = document.getElementById('buy-dmg-btn');
    
    const upgFeverLevel = document.getElementById('upg-fever-level');
    const upgFeverCost = document.getElementById('upg-fever-cost');
    const buyFeverBtn = document.getElementById('buy-fever-btn');

    const upgGogglesLevel = document.getElementById('upg-goggles-level');
    const upgGogglesCost = document.getElementById('upg-goggles-cost');
    const buyGogglesBtn = document.getElementById('buy-goggles-btn');

    const upgEmpCount = document.getElementById('upg-emp-count');
    const upgEmpCost = document.getElementById('upg-emp-cost');
    const buyEmpBtn = document.getElementById('buy-emp-btn');

    // Game Variables
    let score = 0;
    let combo = 0;
    let comboResetTimer;
    let maxTime = 120; // 2 minutes game
    let timeLeft = maxTime;
    let maxBossHp = 8000; // Increased HP
    let bossHp = maxBossHp;
    
    let timerInterval;
    let bossMoveInterval;
    let minionSpawnInterval;
    let isPlaying = false;
    let bossSpawned = false;
    
    let timeDilationActive = false;
    let shieldActive = false;
    let isFever = false;
    let feverTimer;
    
    let isEnraged = false;
    let isBossShielded = false;
    let shieldHits = 0;
    let empTimerActive = false;

    // Boss Pool
    const bossPool = [
        { char: '👾', name: '사이보그 네뷸라 몬스터' },
        { char: '🐙', name: '은하계 심연의 크라켄' },
        { char: '🐉', name: '항성 포식자 드래곤' },
        { char: '🌑', name: '흑화된 소행성' }
    ];

    // Local Storage Data
    let rocketColor = localStorage.getItem('gugudanRocketColor') || 'hue-rotate(0deg)';
    let playerChar = localStorage.getItem('gugudanPlayerChar') || '🛸';
    let rankings = JSON.parse(localStorage.getItem('gugudanRankings')) || [];
    let totalCredits = parseInt(localStorage.getItem('gugudanCredits')) || 0;
    let upgrades = JSON.parse(localStorage.getItem('gugudanUpgrades')) || { fuel: 0, damage: 0, fever: 0, goggles: false, emp: 0 };

    if (upgrades.goggles === undefined) upgrades.goggles = false;
    if (upgrades.emp === undefined) upgrades.emp = 0;

    // Initialize
    initCustomizer();
    updateShopUI();
    document.querySelector('.score').style.display = 'block';

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    viewRankingBtn.addEventListener('click', () => { updateRankingUI(); showScreen(rankingScreen); });
    backToStartBtn.addEventListener('click', () => showScreen(startScreen));
    goHomeBtn.addEventListener('click', () => { updateShopUI(); showScreen(startScreen); });
    
    shopBtn.addEventListener('click', () => { updateShopUI(); showScreen(shopScreen); });
    shopBackBtn.addEventListener('click', () => { updateShopUI(); showScreen(startScreen); });

    resetRankingBtn.addEventListener('click', () => {
        if (confirm("정말 랭킹을 초기화하시겠습니까? (되돌릴 수 없습니다!)")) {
            rankings = [];
            localStorage.removeItem('gugudanRankings');
            updateRankingUI();
        }
    });

    skillTime.addEventListener('click', activateTimeDilation);
    skillShield.addEventListener('click', activatePlayerShield);
    skillEmp.addEventListener('click', activateEmpBomb);

    // Shop Event Listeners
    buyFuelBtn.addEventListener('click', () => buyUpgrade('fuel', 1000));
    buyDmgBtn.addEventListener('click', () => buyUpgrade('damage', 1500));
    buyFeverBtn.addEventListener('click', () => buyUpgrade('fever', 2000));
    buyGogglesBtn.addEventListener('click', () => buyUpgrade('goggles', 3000));
    buyEmpBtn.addEventListener('click', () => buyUpgrade('emp', 500));

    // Gameplay Action Listeners
    bossMonster.addEventListener('pointerdown', handleBossClick);
    battleArena.addEventListener('pointerdown', handleArenaClick);

    function initCustomizer() {
        applyRocketColor(rocketColor);
        applyPlayerChar(playerChar);

        colorBtns.forEach(btn => {
            if(btn.dataset.color === rocketColor) btn.classList.add('active');
            btn.addEventListener('click', (e) => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                rocketColor = btn.dataset.color;
                applyRocketColor(rocketColor);
                localStorage.setItem('gugudanRocketColor', rocketColor);
            });
        });

        charBtns.forEach(btn => {
            if(btn.dataset.char === playerChar) btn.classList.add('active');
            btn.addEventListener('click', (e) => {
                charBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                playerChar = btn.dataset.char;
                applyPlayerChar(playerChar);
                localStorage.setItem('gugudanPlayerChar', playerChar);
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
        
        const fuelCost = 1000 + (upgrades.fuel * 500);
        upgFuelLevel.textContent = upgrades.fuel;
        upgFuelCost.textContent = fuelCost;
        buyFuelBtn.disabled = totalCredits < fuelCost;

        const dmgCost = 1500 + (upgrades.damage * 700);
        upgDmgLevel.textContent = upgrades.damage;
        upgDmgCost.textContent = dmgCost;
        buyDmgBtn.disabled = totalCredits < dmgCost;

        const feverCost = 2000 + (upgrades.fever * 1000);
        upgFeverLevel.textContent = upgrades.fever;
        upgFeverCost.textContent = feverCost;
        buyFeverBtn.disabled = totalCredits < feverCost;

        if (upgrades.goggles) {
            upgGogglesLevel.textContent = "보유중 (최대)";
            buyGogglesBtn.disabled = true;
            buyGogglesBtn.innerHTML = "완료";
        } else {
            upgGogglesLevel.textContent = "미보유";
            buyGogglesBtn.disabled = totalCredits < 3000;
        }

        upgEmpCount.textContent = upgrades.emp;
        buyEmpBtn.disabled = totalCredits < 500;
        
        localStorage.setItem('gugudanCredits', totalCredits);
        localStorage.setItem('gugudanUpgrades', JSON.stringify(upgrades));
    }

    function buyUpgrade(type, baseCost) {
        let cost = baseCost;
        if (type === 'fuel') cost = 1000 + (upgrades.fuel * 500);
        else if (type === 'damage') cost = 1500 + (upgrades.damage * 700);
        else if (type === 'fever') cost = 2000 + (upgrades.fever * 1000);

        if (totalCredits >= cost) {
            totalCredits -= cost;
            if (type === 'goggles') upgrades.goggles = true;
            else upgrades[type]++;
            updateShopUI();
        }
    }

    function startGame() {
        score = 0;
        combo = 0;
        isFever = false;
        isEnraged = false;
        isBossShielded = false;
        empTimerActive = false;
        shieldHits = 0;
        bossSpawned = false;
        
        document.body.classList.remove('fever-mode');
        bossShield.style.display = 'none';
        enrageWarning.className = 'enrage-warning';
        clearTimeout(feverTimer);
        clearTimeout(comboResetTimer);
        
        // Hide Boss initially
        bossMonster.style.display = 'none';
        bossHpContainer.style.display = 'none';
        
        // Clear old minions
        document.querySelectorAll('.minion').forEach(m => m.remove());
        
        maxTime = 120 + (upgrades.fuel * 2); // 120s base
        timeLeft = maxTime;
        maxBossHp = 8000;
        bossHp = maxBossHp;
        isPlaying = true;
        timeDilationActive = false;
        shieldActive = false;
        
        updateScore();
        updateCombo();
        updateFuel();
        updateBossHp();
        updateSkills();
        
        showScreen(gameScreen);
        
        // Start Loops
        timerInterval = setInterval(() => {
            if (empTimerActive) return;

            let burnRate = 0.1;
            if (timeDilationActive) burnRate *= 0.5;
            if (isEnraged) burnRate *= 1.5;

            timeLeft -= burnRate; 
            updateFuel();
            
            // Check Boss Spawn (Half time)
            if (timeLeft <= maxTime / 2 && !bossSpawned) {
                spawnBoss();
            }

            if (timeLeft <= 0) {
                endGame(false); 
            }
        }, 100);

        startMinionSpawning();
    }

    function spawnBoss() {
        bossSpawned = true;
        
        // Select Random Boss
        const selectedBoss = bossPool[Math.floor(Math.random() * bossPool.length)];
        bossMonsterEmoji.textContent = selectedBoss.char;
        bossNameText.textContent = selectedBoss.name;

        // Show UI
        bossMonster.style.display = 'block';
        bossHpContainer.style.display = 'block';
        bossMonster.style.top = '50%';
        bossMonster.style.left = '80%';
        
        // Warning
        enrageWarning.textContent = '⚠️ BOSS INCOMING! ⚠️';
        enrageWarning.classList.add('show');
        setTimeout(() => enrageWarning.classList.remove('show'), 2000);

        startBossMovement();
        
        // Restart minion spawning to apply lower frequency
        startMinionSpawning();
    }

    function resetComboTimer() {
        clearTimeout(comboResetTimer);
        comboResetTimer = setTimeout(() => {
            if (!isPlaying) return;
            combo = 0;
            updateCombo();
            updateSkills();
            showFeedback('콤보가 끊겼습니다!', 'wrong');
        }, 3000);
    }

    function startBossMovement() {
        clearInterval(bossMoveInterval);
        bossMoveInterval = setInterval(() => {
            if (!isPlaying || empTimerActive || !bossSpawned) return;
            
            const minTop = 20;
            const maxTop = 80;
            const minLeft = 50;
            const maxLeft = 85;
            
            const newTop = minTop + Math.random() * (maxTop - minTop);
            const newLeft = minLeft + Math.random() * (maxLeft - minLeft);
            
            bossMonster.style.top = `${newTop}%`;
            bossMonster.style.left = `${newLeft}%`;
            bossMonster.style.right = 'auto'; // override right
            
            // Randomly gain shield
            if (isEnraged && !isBossShielded && Math.random() < 0.2) {
                isBossShielded = true;
                shieldHits = 3;
                bossShield.style.display = 'block';
                showFeedback('보스가 방어막을 전개했습니다!', 'wrong');
            }
        }, isEnraged ? 800 : 1500); // Moves faster when enraged
    }

    function startMinionSpawning() {
        clearInterval(minionSpawnInterval);
        
        const spawnDelay = bossSpawned ? (isEnraged ? 1000 : 2000) : 800; // Faster in Phase 1
        
        minionSpawnInterval = setInterval(() => {
            if (!isPlaying || empTimerActive) return;
            
            // Spawn minion
            const minion = document.createElement('div');
            minion.className = 'minion';
            const minionTypes = ['🛸', '🪨', '☄️', '👾'];
            minion.textContent = minionTypes[Math.floor(Math.random() * minionTypes.length)];
            
            // Random position in middle
            const newTop = 10 + Math.random() * 80;
            const newLeft = 30 + Math.random() * 60;
            minion.style.top = `${newTop}%`;
            minion.style.left = `${newLeft}%`;
            
            minion.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); // prevent arena click miss
                if(!isPlaying) return;
                
                combo++;
                resetComboTimer();
                checkFever();
                
                const points = 15 * (isFever ? 2 : 1);
                score += points;
                updateScore();
                updateCombo();
                updateSkills();
                
                createFloatingText(`+${points}`, '');
                fireLaser(minion);
                
                // Boom effect
                minion.style.transform = 'scale(1.5)';
                minion.style.opacity = '0';
                setTimeout(() => minion.remove(), 200);
            });
            
            battleArena.appendChild(minion);
            
            // Disappear after a while
            setTimeout(() => {
                if (minion.parentNode) {
                    minion.style.opacity = '0';
                    setTimeout(() => minion.remove(), 200);
                }
            }, 2500);

        }, spawnDelay);
    }

    function handleBossClick(e) {
        e.stopPropagation(); // Prevent triggering arena miss
        if (!isPlaying || !bossSpawned) return;
        
        combo++;
        resetComboTimer();
        checkFever();
        
        // Visual laser
        fireLaser(bossMonster);
        
        if (isBossShielded) {
            shieldHits--;
            bossMonster.classList.add('boss-hit');
            setTimeout(() => bossMonster.classList.remove('boss-hit'), 150);
            
            if (shieldHits <= 0) {
                isBossShielded = false;
                bossShield.style.display = 'none';
                showFeedback('방어막 파괴!', 'correct');
                createFloatingText('SHIELD BREAK!', 'critical');
            } else {
                createFloatingText(`Shield: ${shieldHits}`, '');
            }
        } else {
            // Damage calculation
            const baseDmg = 20; // Base damage per click
            const upgradeMultiplier = 1 + (upgrades.damage * 0.2);
            const comboMultiplier = 1 + (combo * 0.05);
            const feverMultiplier = isFever ? 2 : 1;
            
            const gainedScore = Math.floor(baseDmg * upgradeMultiplier * comboMultiplier * feverMultiplier);
            
            score += gainedScore;
            bossHp -= gainedScore;
            
            updateScore();
            updateCombo();
            updateBossHp();
            updateSkills();
            
            bossMonster.classList.add('boss-hit');
            createParticles(bossMonster);
            createFloatingText(`+${gainedScore}`, isFever ? 'critical' : '');
            
            setTimeout(() => {
                bossMonster.classList.remove('boss-hit');
            }, 150);
            
            checkEnrage();
            
            if (bossHp <= 0) {
                setTimeout(() => endGame(true), 200); 
            }
        }
    }

    function handleArenaClick(e) {
        if (!isPlaying || e.target !== battleArena) return;
        // Just fire laser to empty space, no penalty
        fireLaser(null);
    }

    function fireLaser(target) {
        if(isFever) laserBeam.classList.add('fever-laser');
        
        let dist = 300; // default for miss
        
        if (target) {
            const playerRect = playerRocketEmoji.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            dist = targetRect.left - playerRect.right + 20;
        }

        laserBeam.style.width = `${dist}px`;
        laserBeam.style.opacity = '1';
        
        setTimeout(() => {
            laserBeam.style.width = '0';
            laserBeam.style.opacity = '0';
            laserBeam.classList.remove('fever-laser');
        }, 150);
    }

    function checkFever() {
        if (combo >= 30 && !isFever) { // 30 clicks for fever
            isFever = true;
            document.body.classList.add('fever-mode');
            appContainer.classList.add('shake-heavy');
            setTimeout(() => appContainer.classList.remove('shake-heavy'), 500);
            
            const feverText = document.createElement('div');
            feverText.className = 'fever-text';
            feverText.textContent = 'FEVER!';
            gameScreen.appendChild(feverText);
            setTimeout(() => feverText.remove(), 1000);
            
            const feverDuration = (10 + (upgrades.fever * 2)) * 1000;
            
            clearTimeout(feverTimer);
            feverTimer = setTimeout(() => {
                isFever = false;
                document.body.classList.remove('fever-mode');
            }, feverDuration);
        }
    }

    function checkEnrage() {
        if (bossHp <= maxBossHp / 2 && !isEnraged) {
            isEnraged = true;
            enrageWarning.textContent = '⚠️ BOSS ENRAGED! ⚠️';
            enrageWarning.classList.add('show');
            setTimeout(() => enrageWarning.classList.remove('show'), 2000);
            
            // Restart movements to apply new speed
            startBossMovement();
            startMinionSpawning();
        }
    }

    function createFloatingText(text, type) {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-dmg ${type}`;
        floatEl.textContent = text;
        
        let centerX, centerY;
        if (bossSpawned && bossMonster.style.display !== 'none') {
            const rect = bossMonster.getBoundingClientRect();
            const appRect = gameScreen.getBoundingClientRect();
            centerX = rect.left - appRect.left + (rect.width/2);
            centerY = rect.top - appRect.top + (rect.height/2);
        } else {
            centerX = 200 + Math.random() * 100;
            centerY = 200 + Math.random() * 100;
        }
        
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        
        floatEl.style.left = `${centerX + offsetX}px`;
        floatEl.style.top = `${centerY + offsetY}px`;
        
        gameScreen.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1000);
    }

    function createParticles(targetEl) {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const appRect = gameScreen.getBoundingClientRect();
        const centerX = rect.left - appRect.left + rect.width / 2;
        const centerY = rect.top - appRect.top + rect.height / 2;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            if (isFever) particle.style.background = '#ff00ff';
            
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            gameScreen.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            particle.getBoundingClientRect(); // reflow
            
            particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
            particle.style.opacity = '0';
            
            setTimeout(() => particle.remove(), 500);
        }
    }

    function activateTimeDilation() {
        if (combo >= 15 && !timeDilationActive) {
            combo -= 15;
            updateCombo();
            updateSkills();
            timeDilationActive = true;
            skillTime.classList.add('skill-active');
            showFeedback('시간 지연 가동! ⏳', 'correct');
            setTimeout(() => {
                timeDilationActive = false;
                skillTime.classList.remove('skill-active');
            }, 3000);
        }
    }

    function activatePlayerShield() {
        if (combo >= 20 && !shieldActive) {
            combo -= 20;
            updateCombo();
            updateSkills();
            shieldActive = true;
            skillShield.classList.add('skill-active');
            showFeedback('포스 필드 전개! 🛡️', 'correct');
        }
    }

    function activateEmpBomb() {
        if (upgrades.emp > 0) {
            upgrades.emp--;
            localStorage.setItem('gugudanUpgrades', JSON.stringify(upgrades));
            updateSkills();
            
            // EMP Effects
            appContainer.classList.add('shake-heavy');
            document.body.style.filter = 'invert(1)';
            setTimeout(() => {
                document.body.style.filter = 'none';
                appContainer.classList.remove('shake-heavy');
            }, 200);

            showFeedback('EMP 폭발! 미니언 파괴 및 보스 5초 정지!', 'correct');
            
            // Destroy all minions
            document.querySelectorAll('.minion').forEach(m => {
                m.style.transform = 'scale(2)';
                m.style.opacity = '0';
                setTimeout(() => m.remove(), 200);
                score += 50;
            });
            updateScore();
            
            if (isBossShielded) {
                isBossShielded = false;
                bossShield.style.display = 'none';
            }
            
            empTimerActive = true;
            setTimeout(() => {
                empTimerActive = false;
            }, 5000);
        }
    }

    function updateSkills() {
        document.querySelector('#skill-time .skill-req').textContent = '15 Combo';
        document.querySelector('#skill-shield .skill-req').textContent = '20 Combo';

        skillTime.disabled = combo < 15 || timeDilationActive;
        skillShield.disabled = combo < 20 || shieldActive;
        
        empCountEl.textContent = upgrades.emp;
        skillEmp.disabled = upgrades.emp <= 0;
    }

    function updateScore() {
        scoreEl.textContent = score;
        scoreEl.parentElement.classList.add('pop');
        setTimeout(() => scoreEl.parentElement.classList.remove('pop'), 200);
    }

    function updateCombo() {
        comboDisplay.textContent = `Combo: x${combo}`;
        if (combo > 1) {
            comboDisplay.classList.add('pop');
            setTimeout(() => comboDisplay.classList.remove('pop'), 200);
            comboDisplay.style.color = '#f1c40f';
        } else {
            comboDisplay.style.color = '#fff';
        }
        if(combo >= 30) comboDisplay.style.color = '#ff00ff';
        else if(combo >= 15) comboDisplay.style.color = '#e74c3c';
    }

    function updateFuel() {
        if (timeLeft < 0) timeLeft = 0;
        timeLeftText.textContent = timeLeft.toFixed(1);
        const percentage = (timeLeft / maxTime) * 100;
        fuelBar.style.width = `${percentage}%`;
        
        if (percentage <= 20) fuelBar.style.background = '#e74c3c';
        else fuelBar.style.background = 'linear-gradient(90deg, #f1c40f, #e74c3c)';
    }

    function updateBossHp() {
        if (bossHp < 0) bossHp = 0;
        const percentage = (bossHp / maxBossHp) * 100;
        bossHpBar.style.width = `${percentage}%`;
        bossHpText.textContent = Math.ceil(percentage);
    }

    function showFeedback(text, type) {
        feedbackEl.textContent = text;
        feedbackEl.className = `feedback show ${type}`;
    }

    function endGame(isWin) {
        isPlaying = false;
        clearInterval(timerInterval);
        clearInterval(bossMoveInterval);
        clearInterval(minionSpawnInterval);
        clearTimeout(feverTimer);
        clearTimeout(comboResetTimer);
        document.body.classList.remove('fever-mode');
        
        totalCredits += score;
        localStorage.setItem('gugudanCredits', totalCredits);
        
        finalScoreEl.textContent = score;
        const resultTitle = document.getElementById('result-title');
        
        if (isWin) {
            resultTitle.textContent = "보스 격파 성공! 🏆";
            resultTitle.className = "neon-text";
            ratingEl.textContent = '은하계를 구한 액션 마스터! ✨';
        } else {
            resultTitle.textContent = "연료 소진... 패배 💀";
            resultTitle.className = "neon-text text-danger";
            ratingEl.textContent = '아쉽습니다. 콤보를 더 오랫동안 유지해 보세요! 🔧';
        }
        
        showScreen(resultScreen);
        saveAndShowRanking(score);
    }

    function saveAndShowRanking(newScore) {
        if (newScore > 0) {
            setTimeout(() => {
                let name = prompt(`전투 기록 완료! (획득 크레딧: +${newScore})\n조종사 이름을 입력하세요:`, "파일럿");
                if (!name || name.trim() === "") name = "익명";
                
                rankings.push({ name: name.trim(), score: newScore, date: new Date().toLocaleDateString() });
                rankings.sort((a, b) => b.score - a.score);
                rankings = rankings.slice(0, 5);
                localStorage.setItem('gugudanRankings', JSON.stringify(rankings));
                updateRankingUI();
            }, 500);
        } else {
            updateRankingUI();
        }
    }

    function updateRankingUI() {
        const rankingListEl = document.getElementById('ranking-list');
        const mainRankingListEl = document.getElementById('main-ranking-list');
        
        const renderList = (element) => {
            if (!element) return;
            element.innerHTML = '';
            if (rankings.length === 0) {
                element.innerHTML = '<li style="justify-content:center; color:#999;">전투 기록이 없습니다.</li>';
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
                element.appendChild(li);
            });
        };

        renderList(rankingListEl);
        renderList(mainRankingListEl);
    }

    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');
    }
});
