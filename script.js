document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const viewRankingBtn = document.getElementById('view-ranking-btn');
    const rankingScreen = document.getElementById('ranking-screen');
    const backToStartBtn = document.getElementById('back-to-start-btn');
    const goHomeBtn = document.getElementById('go-home-btn');
    const resetRankingBtn = document.getElementById('reset-ranking-btn');
    
    const timeLeftEl = document.getElementById('time-left');
    const scoreEl = document.getElementById('score');
    const questionEl = document.getElementById('question');
    const optionBtns = document.querySelectorAll('.option-btn');
    const feedbackEl = document.getElementById('feedback');
    
    const finalScoreEl = document.getElementById('final-score');
    const ratingEl = document.getElementById('rating');

    // Game Variables
    let score = 0;
    let timeLeft = 20;
    let timerInterval;
    let currentAnswer = 0;
    let currentQuestionScore = 10;
    let isPlaying = false;
    let rankings = JSON.parse(localStorage.getItem('gugudanRankings')) || [];

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    
    viewRankingBtn.addEventListener('click', () => {
        updateRankingUI();
        showScreen(rankingScreen);
    });
    
    backToStartBtn.addEventListener('click', () => {
        showScreen(startScreen);
    });

    goHomeBtn.addEventListener('click', () => {
        showScreen(startScreen);
    });

    resetRankingBtn.addEventListener('click', () => {
        if (confirm("정말 랭킹을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            rankings = [];
            localStorage.removeItem('gugudanRankings');
            updateRankingUI();
        }
    });

    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn));
    });

    // Game Functions
    function startGame() {
        score = 0;
        timeLeft = 20;
        isPlaying = true;
        
        updateScore();
        updateTimer();
        
        showScreen(gameScreen);
        generateQuestion();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function generateQuestion() {
        if (!isPlaying) return;

        // Generate numbers between 2 and 20
        const num1 = Math.floor(Math.random() * 19) + 2;
        const num2 = Math.floor(Math.random() * 19) + 2;
        currentAnswer = num1 * num2;
        
        // Determine question score based on difficulty
        if (num1 >= 10 && num2 >= 10) {
            currentQuestionScore = 30; // Hard (both >= 10)
        } else if (num1 >= 10 || num2 >= 10) {
            currentQuestionScore = 20; // Medium (one >= 10)
        } else {
            currentQuestionScore = 10; // Easy (both < 10)
        }
        
        questionEl.textContent = `${num1} × ${num2} = ?`;
        
        // Generate options
        let options = [currentAnswer];
        
        while (options.length < 4) {
            // Generate plausible wrong answers
            let offsetType = Math.floor(Math.random() * 3);
            let wrongAnswer;
            
            if (offsetType === 0) {
                wrongAnswer = currentAnswer + (Math.floor(Math.random() * 3) + 1) * num1; // Add multiple of num1
            } else if (offsetType === 1) {
                wrongAnswer = currentAnswer - (Math.floor(Math.random() * 3) + 1) * num2; // Subtract multiple of num2
            } else {
                wrongAnswer = currentAnswer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1); // Random small offset
            }
            
            // Ensure positive and unique
            if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
        }
        
        // Shuffle options
        options.sort(() => Math.random() - 0.5);
        
        // Assign to buttons
        optionBtns.forEach((btn, index) => {
            btn.textContent = options[index];
            btn.className = 'option-btn'; // Reset classes
            btn.disabled = false;
        });
        
        // Reset feedback
        feedbackEl.className = 'feedback';
    }

    function handleAnswer(btn) {
        if (!isPlaying) return;
        
        const selectedAnswer = parseInt(btn.textContent);
        
        // Disable all buttons to prevent double clicking
        optionBtns.forEach(b => b.disabled = true);
        
        if (selectedAnswer === currentAnswer) {
            // Correct answer
            score += currentQuestionScore;
            updateScore();
            btn.classList.add('correct');
            questionEl.parentElement.classList.add('pop');
            setTimeout(() => questionEl.parentElement.classList.remove('pop'), 300);
            
            showFeedback(`정답입니다! 👏 (+${currentQuestionScore}점)`, 'correct');
            
            setTimeout(() => {
                generateQuestion();
            }, 600);
        } else {
            // Wrong answer
            btn.classList.add('wrong');
            questionEl.parentElement.classList.add('shake');
            setTimeout(() => questionEl.parentElement.classList.remove('shake'), 500);
            
            // Highlight correct answer
            optionBtns.forEach(b => {
                if (parseInt(b.textContent) === currentAnswer) {
                    b.classList.add('correct');
                }
            });
            
            showFeedback('앗, 틀렸어요! 😢', 'wrong');
            
            setTimeout(() => {
                generateQuestion();
            }, 1000);
        }
    }

    function updateScore() {
        scoreEl.textContent = score;
    }

    function updateTimer() {
        timeLeftEl.textContent = timeLeft;
        if (timeLeft <= 10) {
            timeLeftEl.parentElement.style.backgroundColor = '#ff7675';
            timeLeftEl.parentElement.style.color = 'white';
        } else {
            timeLeftEl.parentElement.style.backgroundColor = '#ffeaa7';
            timeLeftEl.parentElement.style.color = 'var(--primary-color)';
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
        
        // Determine rating
        if (score >= 300) {
            ratingEl.textContent = '구구단 천재! 🥇';
        } else if (score >= 200) {
            ratingEl.textContent = '참 잘했어요! 🥈';
        } else if (score >= 100) {
            ratingEl.textContent = '조금 더 노력해봐요! 🥉';
        } else {
            ratingEl.textContent = '다시 한번 도전해볼까요? 💪';
        }
        
        showScreen(resultScreen);
        saveAndShowRanking(score);
    }

    function saveAndShowRanking(newScore) {
        if (newScore > 0) {
            setTimeout(() => {
                let name = prompt("축하합니다! 랭킹에 등록할 이름을 입력하세요:", "플레이어");
                if (!name || name.trim() === "") name = "익명";
                
                rankings.push({ name: name.trim(), score: newScore });
                rankings.sort((a, b) => b.score - a.score);
                rankings = rankings.slice(0, 5); // Top 5
                localStorage.setItem('gugudanRankings', JSON.stringify(rankings));
                updateRankingUI();
            }, 100);
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
                element.innerHTML = '<li style="justify-content:center; color:#999;">등록된 랭킹이 없습니다.</li>';
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
