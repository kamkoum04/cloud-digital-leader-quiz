// Global state
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = new Set();
let userAnswers = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadQuestions();
    } catch (error) {
        showError('Failed to load questions. Please make sure the JSON files are in the same directory.');
        console.error('Error:', error);
    }
});

// Load the selected exam
async function loadSelectedExam() {
    const fileSelect = document.getElementById('examFileSelect');
    const selectedFile = fileSelect.value;
    const selectedText = fileSelect.options[fileSelect.selectedIndex].text;
    
    // Reset state
    questions = [];
    currentQuestionIndex = 0;
    score = 0;
    answered = new Set();
    userAnswers = {};
    
    // Update UI title
    document.getElementById('quizTitle').textContent = selectedText;
    
    // Show loading
    document.getElementById('loadingMessage').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Load new questions
    try {
        await loadQuestions(selectedFile);
    } catch (error) {
        showError('Failed to load questions: ' + error.message);
    }
}

// Load questions from JSON file
async function loadQuestions(fileName) {
    try {
        const fileToFetch = fileName || document.getElementById('examFileSelect').value || './gcp_cloud_digital_leader_questions_20260301_181630.json';
        
        const response = await fetch(`./${fileToFetch}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        
        questions = await response.json();
        
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid questions format');
        }

        // Hide loading message and show quiz
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        // Show sections that might have been hidden by showResults
        document.querySelector('.question-section').style.display = 'block';
        document.querySelector('.answers-section').style.display = 'block';
        document.querySelector('.navigation-buttons').style.display = 'flex';
        
        // Update total questions display
        document.getElementById('totalQuestions').textContent = questions.length;
        document.getElementById('score').textContent = `0 / ${questions.length}`;
        
        // Clear and populate question select dropdown
        const select = document.getElementById('questionSelect');
        select.innerHTML = '<option value="">Select a question...</option>';
        for (let i = 1; i <= questions.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Question ${i}`;
            select.appendChild(option);
        }
        
        displayQuestion();
    } catch (error) {
        throw error;
    }
}

// Display the current question
function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showResults();
        return;
    }

    const question = questions[currentQuestionIndex];
    
    // Update question number and progress
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
    document.getElementById('progress').textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    
    // Update select dropdown
    document.getElementById('questionSelect').value = currentQuestionIndex + 1;
    
    // Update progress bar
    const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = progressPercent + '%';
    
    // Display question text
    document.getElementById('questionText').textContent = question.question_text;
    
    // Display answer options
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    question.choices.forEach((choice, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer-option';
        
        // Check if already answered
        if (answered.has(currentQuestionIndex)) {
            answerDiv.classList.add('disabled');
            
            // Show correct/incorrect status
            if (choice.letter === question.correct_answer) {
                answerDiv.classList.add('correct');
            }
            
            if (userAnswers[currentQuestionIndex] === choice.letter && 
                choice.letter !== question.correct_answer) {
                answerDiv.classList.add('incorrect');
            }
            
            if (userAnswers[currentQuestionIndex] === choice.letter && 
                choice.letter === question.correct_answer) {
                answerDiv.classList.add('selected', 'correct');
            }
        } else if (userAnswers[currentQuestionIndex] === choice.letter) {
            answerDiv.classList.add('selected');
        }
        
        answerDiv.innerHTML = `
            <div class="answer-letter">${choice.letter}</div>
            <div>
                <div class="answer-text">${choice.text.replace(/Most Voted/gi, '')}</div>
                ${answered.has(currentQuestionIndex) ? getAnswerFeedback(choice.letter, question.correct_answer) : ''}
            </div>
        `;
        
        if (!answered.has(currentQuestionIndex)) {
            answerDiv.style.cursor = 'pointer';
            answerDiv.addEventListener('click', () => selectAnswer(choice.letter));
        }
        
        answersContainer.appendChild(answerDiv);
    });
    
    // Hide or show feedback message
    const feedbackMessage = document.getElementById('feedbackMessage');
    if (answered.has(currentQuestionIndex)) {
        feedbackMessage.style.display = 'block';
        const isCorrect = userAnswers[currentQuestionIndex] === question.correct_answer;
        feedbackMessage.className = `feedback-message ${isCorrect ? 'correct' : 'incorrect'}`;
        const feedbackText = isCorrect ? 
            '✓ Correct!' : 
            `✗ Incorrect. The correct answer is ${question.correct_answer}`;
        document.getElementById('feedbackText').textContent = feedbackText;
    } else {
        feedbackMessage.style.display = 'none';
    }
    
    // Update button states
    updateNavigationButtons();
    
    // Update progress and score display
    updateProgressDisplay();
}

// Get feedback text for answer
function getAnswerFeedback(selectedLetter, correctLetter) {
    if (selectedLetter === correctLetter) {
        return '<div class="answer-feedback">✓ Correct Answer</div>';
    } else if (selectedLetter !== correctLetter) {
        return '<div class="answer-feedback">✗ Incorrect</div>';
    }
    return '';
}

// Handle answer selection
function selectAnswer(letter) {
    const question = questions[currentQuestionIndex];
    
    // Record the answer
    userAnswers[currentQuestionIndex] = letter;
    answered.add(currentQuestionIndex);
    
    // Update score if correct
    if (letter === question.correct_answer) {
        score++;
    }
    
    // Update display
    updateProgressDisplay();
    displayQuestion();
}

// Update progress and score display
function updateProgressDisplay() {
    const totalAnswered = answered.size;
    document.getElementById('score').textContent = `${score} / ${questions.length}`;
    
    const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
}

// Update navigation button states
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === questions.length - 1;
    
    if (currentQuestionIndex === questions.length - 1) {
        nextButton.textContent = 'View Results →';
    } else {
        nextButton.textContent = 'Next →';
    }
}

// Navigate to next question
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showResults();
    }
}

// Navigate to previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Jump to a specific question
function jumpToQuestion() {
    const select = document.getElementById('questionSelect');
    const questionNum = parseInt(select.value);
    
    if (isNaN(questionNum)) {
        return;
    }
    
    currentQuestionIndex = questionNum - 1;
    displayQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show results screen
function showResults() {
    document.querySelector('.question-section').style.display = 'none';
    document.querySelector('.answers-section').style.display = 'none';
    document.getElementById('feedbackMessage').style.display = 'none';
    document.querySelector('.navigation-buttons').style.display = 'none';
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // Calculate statistics
    const totalAnswered = answered.size;
    const accuracy = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    document.getElementById('finalAttempted').textContent = totalAnswered;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Restart the quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    answered = new Set();
    userAnswers = {};
    
    // Show quiz elements again
    document.querySelector('.question-section').style.display = 'block';
    document.querySelector('.answers-section').style.display = 'block';
    document.querySelector('.navigation-buttons').style.display = 'flex';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Reset progress display
    updateProgressDisplay();
    displayQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error message
function showError(message) {
    document.getElementById('loadingMessage').style.display = 'none';
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Keyboard navigation support
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        if (!document.getElementById('nextButton').disabled) {
            nextQuestion();
        }
    } else if (event.key === 'ArrowLeft') {
        if (!document.getElementById('prevButton').disabled) {
            previousQuestion();
        }
    }
    
    // Allow number keys to select answers (1-4 for A-D)
    const keys = ['1', '2', '3', '4'];
    const letters = ['A', 'B', 'C', 'D'];
    if (keys.includes(event.key) && !answered.has(currentQuestionIndex)) {
        const letterIndex = parseInt(event.key) - 1;
        if (letterIndex < questions[currentQuestionIndex].choices.length) {
            selectAnswer(letters[letterIndex]);
        }
    }
});
