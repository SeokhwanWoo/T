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
    const colorBtns = document.querySelectorAll('.color-btn');
    const racingTrack = document.getElementById('racing-track');

    // Game Variables
    let score = 0;
    let combo = 0;
    let maxTime = 15;
    let timeLeft = maxTime;
    let timerInterval;
    let currentAnswer = 0;
    let currentQuestionScore = 10;
    let isPlaying = false;
    let rocketColor = localStorage.getItem('gugudanRocketColor') || 'hue-rotate(0deg)';
    let rankings = JSON.parse(localStorage.getItem('gugudanRankings')) || [];
    let ghostRocketsData = [];

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
        playerRocketEmoji.style.filter = color;
    }

    // Game Functions
    function startGame() {
        score = 0;
        combo = 0;
        timeLeft = maxTime;
        isPlaying = true;
        
        updateScore();
        updateCombo();
        updateFuel();
        spawnGhostRockets();
        
        showScreen(gameScreen);
        generateQuestion();
        
        timerInterval = setInterval(() => {
            timeLeft -= 0.1; // 100ms interval
            updateFuel();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 100);
    }

    function spawnGhostRockets() {
        // Clear previous ghosts
        document.querySelectorAll('.ghost-rocket').forEach(el => el.remove());
        ghostRocketsData = [];
        
        // Use top rankings as ghosts, or dummy if none
        let targets = rankings.slice(0, 3);
        if (targets.length === 0) {
            targets = [
                { name: '초보 우주인', score: 100 },
                { name: '베테랑', score: 300 },
                { name: '우주 괴물', score: 600 }
            ];
        }

        targets.forEach((target, i) => {
            const el = document.createElement('div');
            el.className = 'ghost-rocket';
            // Spread them horizontally
            const leftPos = 20 + (i * 30); // 20%, 50%, 80%
            el.style.left = `${leftPos}%`;
            el.innerHTML = `<span>🚀</span><div class="ghost-name">${target.name}</div>`;
            racingTrack.appendChild(el);
            
            ghostRocketsData.push({
                element: el,
                targetScore: target.score,
                initialBottom: 20 + (i * 20) // Initial position higher than player
            });
        });
        updateRacingTrack();
    }

    function updateRacingTrack() {
        ghostRocketsData.forEach(ghost => {
            // Calculate relative position based on score difference
            // If player score matches ghost score, ghost should be at player level (20%)
            // If player is lower, ghost is higher.
            const diff = ghost.targetScore - score;
            let visualPos = 20;
            
            if (diff > 0) {
                // Ghost is ahead
                visualPos = 20 + Math.min(60, (diff / 5)); 
            } else {
                // Player passed the ghost (ghost falls behind)
                visualPos = 20 + (diff / 2);
            }
            
            ghost.element.style.bottom = `${Math.max(-20, visualPos)}%`;
        });
    }

    function generateQuestion() {
        if (!isPlaying) return;

        // Generate numbers between 2 and 20
        const num1 = Math.floor(Math.random() * 19) + 2;
        const num2 = Math.floor(Math.random() * 19) + 2;
        currentAnswer = num1 * num2;
        
        // Difficulty scoring
        if (num1 >= 10 && num2 >= 10) currentQuestionScore = 30;
        else if (num1 >= 10 || num2 >= 10) currentQuestionScore = 20;
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
            
            updateScore();
            updateCombo();
            updateRacingTrack();
            
            btn.classList.add('correct');
            
            // Visual Effects
            document.getElementById('player-rocket').classList.add('hyperdrive');
            setTimeout(() => document.getElementById('player-rocket').classList.remove('hyperdrive'), 300);
            
            showFeedback(`정답! 👏 +${gainedScore}점`, 'correct');
            setTimeout(generateQuestion, 400);
        } else {
            // Wrong
            combo = 0;
            updateCombo();
            
            btn.classList.add('wrong');
            appContainer.classList.add('shake');
            setTimeout(() => appContainer.classList.remove('shake'), 400);
            
            optionBtns.forEach(b => {
                if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct');
            });
            
            showFeedback('오답! 💥 운석 충돌!', 'wrong');
            setTimeout(generateQuestion, 800);
        }
    }

    function updateScore() {
        scoreEl.textContent = score;
    }

    function updateCombo() {
        comboDisplay.textContent = `콤보: x${combo}`;
        if (combo > 1) {
            comboDisplay.classList.add('pop');
            setTimeout(() => comboDisplay.classList.remove('pop'), 200);
            comboDisplay.style.color = '#f1c40f'; // Yellow
        } else {
            comboDisplay.style.color = '#fff';
        }
        
        if(combo >= 5) comboDisplay.style.color = '#e74c3c'; // Red for high combo
    }

    function updateFuel() {
        if (timeLeft < 0) timeLeft = 0;
        timeLeftText.textContent = timeLeft.toFixed(1);
        const percentage = (timeLeft / maxTime) * 100;
        fuelBar.style.width = `${percentage}%`;
        
        if (percentage <= 20) {
            fuelBar.style.background = '#e74c3c';
        } else {
            fuelBar.style.background = 'linear-gradient(90deg, #f1c40f, #e74c3c)';
        }
    }

    function showFeedback(text, type) {
        feedbackEl.textContent = text;
        feedbackEl.className = `feedback show ${type}`;
    }

    function endGame() {
        isPlaying = false;
        clearInterval(timerInterval);
        
        finalScoreEl.textContent = score;
        
        if (score >= 1000) ratingEl.textContent = '빛의 속도! 전설의 로켓 🚀✨';
        else if (score >= 500) ratingEl.textContent = '대단해요! 은하계 탐험가 🌌';
        else if (score >= 200) ratingEl.textContent = '참 잘했어요! 달 착륙 성공 🌕';
        else ratingEl.textContent = '더 높이 날 수 있어요! 연료 보충 필요 ⛽';
        
        showScreen(resultScreen);
        saveAndShowRanking(score);
    }

    function saveAndShowRanking(newScore) {
        if (newScore > 0) {
            setTimeout(() => {
                let name = prompt("우주 여행 종료! 랭킹에 등록할 조종사 이름을 입력하세요:", "파일럿");
                if (!name || name.trim() === "") name = "익명";
                
                rankings.push({ name: name.trim(), score: newScore });
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
                element.innerHTML = '<li style="justify-content:center; color:#999;">비행 기록이 없습니다.</li>';
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
