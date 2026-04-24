document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const rankingScreen = document.getElementById('ranking-screen');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    const goHomeBtn = document.getElementById('go-home-btn');
    const resetRankingBtn = document.getElementById('reset-ranking-btn');
    
    const fuelBar = document.getElementById('fuel-bar');
    const timeLeftText = document.getElementById('time-left-text');
    const scoreEl = document.getElementById('score');
    const comboDisplay = document.getElementById('combo-display');
    const questionEl = document.getElementById('question');
    const optionBtns = document.querySelectorAll('.option-btn');
    const feedbackEl = document.getElementById('feedback');
    
    const finalScoreEl = document.getElementById('final-score');
    const ratingEl = document.getElementById('rating');
    const appContainer = document.getElementById('app');

    const rocketPreview = document.getElementById('rocket-preview');
    const playerRocketEmoji = document.getElementById('player-rocket-emoji');
    const bossMonster = document.getElementById('boss-monster');
    const laserBeam = document.getElementById('laser-beam');
    const colorBtns = document.querySelectorAll('.color-btn');

    const bossHpBar = document.getElementById('boss-hp-bar');
    const bossHpText = document.getElementById('boss-hp-text');

    const skillTime = document.getElementById('skill-time');
    const skillShield = document.getElementById('skill-shield');

    // Game Variables
    let score = 0;
    let combo = 0;
    let maxTime = 15;
    let timeLeft = maxTime;
    let maxBossHp = 300;
    let bossHp = maxBossHp;
    let timerInterval;
    let currentAnswer = 0;
    let currentQuestionScore = 10;
    let isPlaying = false;
    let timeDilationActive = false;
    let shieldActive = false;

    let rocketColor = localStorage.getItem('gugudanRocketColor') || 'hue-rotate(0deg)';
    let rankings = JSON.parse(localStorage.getItem('gugudanRankings')) || [];

    // Initialize Customizer
    initCustomizer();

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    viewRankingBtn.addEventListener('click', () => { updateRankingUI(); showScreen(rankingScreen); });
    backToStartBtn.addEventListener('click', () => showScreen(startScreen));
    goHomeBtn.addEventListener('click', () => showScreen(startScreen));

    resetRankingBtn.addEventListener('click', () => {
        if (confirm("정말 랭킹을 초기화하시겠습니까? (되돌릴 수 없습니다!)")) {
            rankings = [];
            localStorage.removeItem('gugudanRankings');
            updateRankingUI();
        }
    });

    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn));
    });

    skillTime.addEventListener('click', activateTimeDilation);
    skillShield.addEventListener('click', activateShield);

    // Customizer Logic
    function initCustomizer() {
        applyRocketColor(rocketColor);
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
    }

    function applyRocketColor(color) {
        rocketPreview.style.filter = color;
        playerRocketEmoji.style.filter = `${color} drop-shadow(0 0 10px cyan)`;
    }

    // Game Functions
    function startGame() {
        score = 0;
        combo = 0;
        timeLeft = maxTime;
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
        generateQuestion();
        
        timerInterval = setInterval(() => {
            // Time dilation reduces fuel burn rate by half
            let burnRate = timeDilationActive ? 0.05 : 0.1;
            timeLeft -= burnRate; 
            updateFuel();
            
            if (timeLeft <= 0) {
                endGame(false); // Lost by timeout
            }
        }, 100);
    }

    function generateQuestion() {
        if (!isPlaying) return;

        // Generate numbers between 2 and 9
        const num1 = Math.floor(Math.random() * 8) + 2;
        const num2 = Math.floor(Math.random() * 8) + 2;
        currentAnswer = num1 * num2;
        
        // Difficulty scoring
        if (num1 >= 7 && num2 >= 7) currentQuestionScore = 30;
        else if (num1 >= 7 || num2 >= 7) currentQuestionScore = 20;
        else currentQuestionScore = 10;
        
        questionEl.textContent = `${num1} × ${num2} = ?`;
        
        let options = [currentAnswer];
        while (options.length < 4) {
            let offsetType = Math.floor(Math.random() * 3);
            let wrongAnswer;
            if (offsetType === 0) wrongAnswer = currentAnswer + (Math.floor(Math.random() * 3) + 1) * num1;
            else if (offsetType === 1) wrongAnswer = currentAnswer - (Math.floor(Math.random() * 3) + 1) * num2;
            else wrongAnswer = currentAnswer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
            
            if (wrongAnswer > 0 && !options.includes(wrongAnswer)) options.push(wrongAnswer);
        }
        options.sort(() => Math.random() - 0.5);
        
        optionBtns.forEach((btn, index) => {
            btn.textContent = options[index];
            btn.className = 'option-btn hologram-btn';
            btn.disabled = false;
        });
        
        feedbackEl.className = 'feedback';
        feedbackEl.textContent = '';
    }

    function handleAnswer(btn) {
        if (!isPlaying) return;
        const selectedAnswer = parseInt(btn.textContent);
        optionBtns.forEach(b => b.disabled = true);
        
        if (selectedAnswer === currentAnswer) {
            // Correct
            combo++;
            const comboMultiplier = 1 + (combo * 0.1);
            const gainedScore = Math.floor(currentQuestionScore * comboMultiplier);
            score += gainedScore;
            bossHp -= gainedScore;
            
            updateScore();
            updateCombo();
            updateBossHp();
            updateSkills();
            
            btn.classList.add('correct');
            
            // Fire Laser!
            laserBeam.classList.add('laser-fire');
            setTimeout(() => {
                bossMonster.classList.add('boss-hit');
            }, 100);
            
            setTimeout(() => {
                laserBeam.classList.remove('laser-fire');
                bossMonster.classList.remove('boss-hit');
            }, 300);
            
            showFeedback(`명중! 💥 +${gainedScore} 대미지`, 'correct');
            
            if (bossHp <= 0) {
                setTimeout(() => endGame(true), 500); // Win
            } else {
                setTimeout(generateQuestion, 400);
            }
        } else {
            // Wrong
            combo = 0;
            updateCombo();
            updateSkills();
            
            btn.classList.add('wrong');
            
            if (shieldActive) {
                showFeedback('방어막 가동! 피해 무효화 🛡️', 'correct');
                shieldActive = false;
                skillShield.classList.remove('skill-active');
            } else {
                appContainer.classList.add('shake-heavy');
                playerRocketEmoji.classList.add('ship-hit');
                timeLeft -= 2; // Penalty
                updateFuel();
                showFeedback('피격! 연료 -2초 ⚠️', 'wrong');
                
                setTimeout(() => {
                    appContainer.classList.remove('shake-heavy');
                    playerRocketEmoji.classList.remove('ship-hit');
                }, 500);
                
                if (timeLeft <= 0) {
                    setTimeout(() => endGame(false), 500);
                    return;
                }
            }
            
            optionBtns.forEach(b => {
                if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct');
            });
            
            setTimeout(generateQuestion, 800);
        }
    }

    function activateTimeDilation() {
        if (combo >= 3 && !timeDilationActive) {
            combo -= 3;
            updateCombo();
            updateSkills();
            timeDilationActive = true;
            skillTime.classList.add('skill-active');
            showFeedback('시간 지연 가동! ⏳', 'correct');
            
            setTimeout(() => {
                timeDilationActive = false;
                skillTime.classList.remove('skill-active');
            }, 3000); // lasts 3 seconds
        }
    }

    function activateShield() {
        if (combo >= 5 && !shieldActive) {
            combo -= 5;
            updateCombo();
            updateSkills();
            shieldActive = true;
            skillShield.classList.add('skill-active');
            showFeedback('포스 필드 전개! 🛡️', 'correct');
        }
    }

    function updateSkills() {
        skillTime.disabled = combo < 3 || timeDilationActive;
        skillShield.disabled = combo < 5 || shieldActive;
    }

    function updateScore() {
        scoreEl.textContent = score;
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
        if(combo >= 5) comboDisplay.style.color = '#e74c3c';
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
        
        finalScoreEl.textContent = score;
        const resultTitle = document.getElementById('result-title');
        
        if (isWin) {
            resultTitle.textContent = "보스 격파 성공! 🏆";
            resultTitle.className = "neon-text";
            ratingEl.textContent = '은하계를 구한 영웅! ✨';
        } else {
            resultTitle.textContent = "연료 소진... 패배 💀";
            resultTitle.className = "neon-text text-danger";
            ratingEl.textContent = '아쉽습니다. 재정비 후 도전하세요! 🔧';
        }
        
        showScreen(resultScreen);
        saveAndShowRanking(score);
    }

    function saveAndShowRanking(newScore) {
        if (newScore > 0) {
            setTimeout(() => {
                let name = prompt("전투 기록 완료! 조종사 이름을 입력하세요:", "파일럿");
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
