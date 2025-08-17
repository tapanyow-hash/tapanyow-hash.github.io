if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(err => {
          console.log('Service Worker registration failed: ', err);
        });
    });
}

// Game state variables
let currentProblem = 1;
const totalProblems = 15;
let scoreLeft = 0;
let foulLeft = 0;
let scoreRight = 0;
let foulRight = 0;
let gameEnded = false;
let isExtraRound = false;
let problems = [];
let mainProblems = [];
let allUsedProblems = new Set();
let isFirstProblemRandomized = false;
let scoreHistory = [];

// DOM element references
const problemNumberElement = document.getElementById('problem-number');
const problemTitleElement = document.getElementById('problem-title');
const backButton = document.getElementById('back-button');
const nextButton = document.getElementById('next-button');
const randomButton = document.getElementById('random-button');
const problemArea = document.getElementById('problem-area');
const logo = document.getElementById('logo'); // อ้างอิง DOM element ของโลโก้

// Score and Foul display elements
const scoreLeftElement = document.getElementById('score-left');
const foulLeftElement = document.getElementById('foul-left');
const scoreRightElement = document.getElementById('score-right');
const foulRightElement = document.getElementById('foul-right');

// Player control buttons
const plusButtonLeft = document.getElementById('plus-button-left');
const foulButtonLeft = document.getElementById('foul-button-left');
const plusButtonRight = document.getElementById('plus-button-right');
const foulButtonRight = document.getElementById('foul-button-right');

// New countdown timer elements and variables
const countdownText = document.getElementById('countdown-timer');
const countdownCircle = document.querySelector('.countdown-circle');
const circumference = 2 * Math.PI * 42;
countdownCircle.style.strokeDasharray = circumference;

let timerInterval;
const totalTime = 30;
let remainingTime = totalTime;
let remainingTimeRing;
let randomizeInterval;

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function generateRandomProblems() {
    if (isExtraRound) {
        const problemsT_filtered = problemsT.filter(p => !allUsedProblems.has(JSON.stringify(p)));
        const problemsF_filtered = problemsF.filter(p => !allUsedProblems.has(JSON.stringify(p)));
        
        const problemsT_shuffled = shuffleArray(problemsT_filtered);
        const problemsF_shuffled = shuffleArray(problemsF_filtered);
        let extraProblems = [];
        
        if (problemsF_shuffled.length > 0 && Math.random() > 0.5) {
            extraProblems.push(problemsF_shuffled.pop());
        }
        
        while (extraProblems.length < 3 && problemsT_shuffled.length > 0) {
            extraProblems.push(problemsT_shuffled.pop());
        }

        problems = shuffleArray(extraProblems).map(p => shuffleArray(p));
        extraProblems.forEach(p => allUsedProblems.add(JSON.stringify(p)));
    } else {
        const problemsT_shuffled = shuffleArray([...problemsT]);
        const selectedProblemsT = problemsT_shuffled.slice(0, 12);
        
        const problemsF_shuffled = shuffleArray([...problemsF]);
        const selectedProblemsF = problemsF_shuffled.slice(0, 3);
        
        let combinedProblems = [...selectedProblemsT, ...selectedProblemsF];
        
        // Shuffle the numbers within each problem array
        problems = shuffleArray(combinedProblems).map(p => shuffleArray(p));
        
        mainProblems = problems;
        combinedProblems.forEach(p => allUsedProblems.add(JSON.stringify(p)));
    }
}

function replaceCurrentProblem() {
    const currentProblemIndex = currentProblem - 1;
    const oldProblem = problems[currentProblemIndex];
    
    let originalProblem = problemsT.find(p => p.join('') === oldProblem.sort().join('')) || problemsF.find(p => p.join('') === oldProblem.sort().join(''));
    if (originalProblem) {
        allUsedProblems.delete(JSON.stringify(originalProblem));
    }
    
    let newProblem;
    const isOldProblemFromF = problemsF.some(p => p.join('') === originalProblem.join(''));
    
    if (isOldProblemFromF) {
        const problemsF_filtered = problemsF.filter(p => !allUsedProblems.has(JSON.stringify(p)));
        if (problemsF_filtered.length > 0) {
            newProblem = problemsF_filtered[Math.floor(Math.random() * problemsF_filtered.length)];
        }
    } else {
        const problemsT_filtered = problemsT.filter(p => !allUsedProblems.has(JSON.stringify(p)));
        if (problemsT_filtered.length > 0) {
            newProblem = problemsT_filtered[Math.floor(Math.random() * problemsT_filtered.length)];
        }
    }
    
    if (newProblem) {
        problems[currentProblemIndex] = shuffleArray(newProblem);
        allUsedProblems.add(JSON.stringify(newProblem));
    } else {
        allUsedProblems.add(JSON.stringify(originalProblem));
    }
}

function updateCountdownTimer() {
    remainingTime--;
    remainingTimeRing--;
    countdownText.textContent = remainingTime;
    const dashOffset = circumference * (1 - remainingTimeRing / (totalTime - 1));
    countdownCircle.style.strokeDashoffset = dashOffset;
    
    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        countdownText.textContent = '0';
        countdownCircle.style.strokeDashoffset = circumference;
    }
}

function startTimer() {
    if (gameEnded) return;
    clearInterval(timerInterval);
    remainingTime = totalTime;
    remainingTimeRing = totalTime - 1;
    countdownText.textContent = remainingTime;
    const dashOffset = circumference * (1 - remainingTimeRing / (totalTime - 1));
    countdownCircle.style.strokeDashoffset = dashOffset;
    timerInterval = setInterval(updateCountdownTimer, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function checkGameOver() {
    if (foulLeft >= 3 || foulRight >= 3) {
        gameEnded = true;
        stopTimer();
        disableGameControls();
        displayGameOver();
    }
}

function disableGameControls() {
    backButton.disabled = true;
    nextButton.disabled = true;
    randomButton.disabled = true;
    plusButtonLeft.disabled = true;
    foulButtonLeft.disabled = true;
    plusButtonRight.disabled = true;
    foulButtonRight.disabled = true;
}

function displayGameOver() {
    problemArea.innerHTML = '';
    const winner = foulLeft >= 3 ? 'Right' : 'Left';
    const loser = foulLeft >= 3 ? 'Left' : 'Right';
    const winDiv = document.createElement('div');
    winDiv.textContent = 'WIN';
    winDiv.style.color = '#2ecc71';
    winDiv.style.fontSize = '8vw';
    winDiv.style.fontWeight = 'bold';
    const lossDiv = document.createElement('div');
    lossDiv.textContent = 'LOSS';
    lossDiv.style.color = '#e74c3c';
    lossDiv.style.fontSize = '8vw';
    lossDiv.style.fontWeight = 'bold';
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'space-around';
    container.style.width = '100%';
    container.style.alignItems = 'center';
    if (winner === 'Left') {
        container.appendChild(winDiv);
        container.appendChild(lossDiv);
    } else {
        container.appendChild(lossDiv);
        container.appendChild(winDiv);
    }
    problemArea.appendChild(container);
    nextButton.disabled = true;
    randomButton.textContent = 'New Game';
    randomButton.classList.remove('btn-primary');
    randomButton.classList.add('btn-success');
    randomButton.disabled = false;
    randomButton.removeEventListener('click', randomizeProblem);
    randomButton.addEventListener('click', newGame);
}

function displayFinalWinner() {
    gameEnded = true;
    stopTimer();
    disableGameControls();
    problemArea.innerHTML = '';
    let winner, loser;
    if (scoreLeft > scoreRight) {
        winner = 'Left';
        loser = 'Right';
    } else if (scoreRight > scoreLeft) {
        winner = 'Right';
        loser = 'Left';
    } else {
        winner = 'DRAW';
        loser = 'DRAW';
    }
    const winDiv = document.createElement('div');
    winDiv.textContent = winner === 'DRAW' ? 'DRAW' : 'WIN';
    winDiv.style.color = winner === 'DRAW' ? '#f39c12' : '#2ecc71';
    winDiv.style.fontSize = '8vw';
    winDiv.style.fontWeight = 'bold';
    const lossDiv = document.createElement('div');
    lossDiv.textContent = loser === 'DRAW' ? 'DRAW' : 'LOSS';
    lossDiv.style.color = loser === 'DRAW' ? '#f39c12' : '#e74c3c';
    lossDiv.style.fontSize = '8vw';
    lossDiv.style.fontWeight = 'bold';
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'space-around';
    container.style.width = '100%';
    container.style.alignItems = 'center';
    if (winner === 'Left' || winner === 'DRAW') {
        container.appendChild(winDiv);
        container.appendChild(lossDiv);
    } else {
        container.appendChild(lossDiv);
        container.appendChild(winDiv);
    }
    problemArea.appendChild(container);
    nextButton.disabled = true;
    randomButton.textContent = 'New Game';
    randomButton.classList.remove('btn-primary');
    randomButton.classList.add('btn-success');
    randomButton.disabled = false;
    randomButton.removeEventListener('click', randomizeProblem);
    randomButton.addEventListener('click', newGame);
}

function newGame() {
    location.reload();
}

function createProblemCards(problem) {
    problemArea.innerHTML = '';
    problem.forEach(number => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = number;
        problemArea.appendChild(card);
    });
}

function clearProblemCards() {
    problemArea.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = '-';
        problemArea.appendChild(card);
    }
}

function updateProblemDisplay() {
    const problemTitleTextNode = problemTitleElement.childNodes[0];
    if (isExtraRound) {
        problemTitleTextNode.textContent = 'Extra ';
    } else {
        problemTitleTextNode.textContent = 'Problem ';
    }
    problemNumberElement.textContent = currentProblem;
    backButton.disabled = currentProblem === 1 || gameEnded;
    nextButton.disabled = gameEnded;
}

function updateScores() {
    scoreLeftElement.textContent = scoreLeft;
    foulLeftElement.textContent = foulLeft;
    scoreRightElement.textContent = scoreRight;
    foulRightElement.textContent = foulRight;
    checkGameOver();
}

function resetTimerDisplay() {
    stopTimer();
    remainingTime = totalTime;
    countdownText.textContent = remainingTime;
    countdownCircle.style.strokeDashoffset = 0;
}

function nextProblem() {
    if (gameEnded) return;
        
    if (!isExtraRound && currentProblem >= totalProblems) {
        if (scoreLeft === scoreRight) {
            isExtraRound = true;
            currentProblem = 1;
            generateRandomProblems();
            updateProblemDisplay();
            clearProblemCards();
            resetTimerDisplay();
        } else {
            displayFinalWinner();
        }
    } else if (isExtraRound && currentProblem >= 3) {
        if (scoreLeft === scoreRight) {
            currentProblem = 1;
            generateRandomProblems();
            updateProblemDisplay();
            clearProblemCards();
            resetTimerDisplay();
        } else {
            displayFinalWinner();
        }
    } else {
        currentProblem++;
        updateProblemDisplay();
        clearProblemCards();
        resetTimerDisplay();
    }
}

function previousProblem() {
    if (gameEnded) return;

    if (currentProblem > 1) {
        currentProblem--;
        updateProblemDisplay();
        clearProblemCards();
        resetTimerDisplay();
    }
}

// **แก้ไข Event Listener ของปุ่ม Back**
backButton.addEventListener('click', () => {
    // โค้ดที่เพิ่มเข้ามา: ลดเลขโจทย์โดยตรง
    previousProblem();

    // ส่วนโค้ดเดิมที่ใช้สำหรับ History ของคะแนน
    if (scoreHistory.length > 0) {
        const lastState = scoreHistory.pop();
        scoreLeft = lastState.scoreLeft;
        foulLeft = lastState.foulLeft;
        scoreRight = lastState.scoreRight;
        foulRight = lastState.foulRight;
        updateScores();
    }
});

nextButton.addEventListener('click', nextProblem);

plusButtonLeft.addEventListener('click', () => {
    if (gameEnded) return;
    scoreHistory.push({ scoreLeft, foulLeft, scoreRight, foulRight });
    scoreLeft++;
    updateScores();
    nextProblem();
});

foulButtonLeft.addEventListener('click', () => {
    if (gameEnded) return;
    scoreHistory.push({ scoreLeft, foulLeft, scoreRight, foulRight });
    foulLeft++;
    updateScores();
    nextProblem();
});

plusButtonRight.addEventListener('click', () => {
    if (gameEnded) return;
    scoreHistory.push({ scoreLeft, foulLeft, scoreRight, foulRight });
    scoreRight++;
    updateScores();
    nextProblem();
});

foulButtonRight.addEventListener('click', () => {
    if (gameEnded) return;
    scoreHistory.push({ scoreLeft, foulLeft, scoreRight, foulRight });
    foulRight++;
    updateScores();
    nextProblem();
});

function randomizeProblem() {
    if (gameEnded) return;

    if (!isFirstProblemRandomized) {
        generateRandomProblems();
        isFirstProblemRandomized = true;
    } else {
        scoreHistory.push({ scoreLeft, foulLeft, scoreRight, foulRight });
        replaceCurrentProblem();
    }

    randomButton.disabled = true;
    randomButton.textContent = 'Randomizing';
    stopTimer();
    
    const randomDelay = (Math.floor(Math.random() * 5) + 1) * 1000;
    
    randomizeInterval = setInterval(() => {
        problemArea.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const randomNumber = Math.floor(Math.random() * 9) + 1;
            const card = document.createElement('div');
            card.classList.add('card');
            card.textContent = randomNumber;
            problemArea.appendChild(card);
        }
    }, 50);

    setTimeout(() => {
        clearInterval(randomizeInterval);
        const problem = problems[currentProblem - 1];
        if (problem) {
            createProblemCards(problem);
        } else {
            clearProblemCards();
        }
        startTimer();

        randomButton.disabled = false;
        randomButton.textContent = 'Random';
    }, randomDelay);
}

randomButton.addEventListener('click', randomizeProblem);

function displayInitialProblem() {
    clearProblemCards();
}

// **ฟังก์ชันสำหรับสลับโหมด Full Screen**
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

// **เพิ่ม Event Listener ให้กับโลโก้**
logo.addEventListener('click', toggleFullScreen);

document.addEventListener('DOMContentLoaded', () => {
    displayInitialProblem();
    updateProblemDisplay();
    updateScores();
});