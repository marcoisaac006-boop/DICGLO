class DicgloApp {
    constructor() {
        // Pantallas
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            credits: document.getElementById('credits-screen'),
            games: document.getElementById('games-screen'),
            gameActive: document.getElementById('game-active-screen'),
            gameEnd: document.getElementById('game-end-screen')
        };

        // Botones de navegación
        this.startBtn = document.getElementById('start-btn');
        this.creditsBtn = document.getElementById('credits-btn');
        this.backBtn = document.getElementById('back-btn');
        this.creditsBottomBtn = document.getElementById('credits-bottom-btn');
        this.homeBottomBtn = document.getElementById('home-bottom-btn');
        this.backGameBtn = document.getElementById('back-game-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');

        // Elementos del juego
        this.gameTitle = document.getElementById('game-title');
        this.gameInstructions = document.getElementById('game-instructions');
        this.sentenceElement = document.getElementById('sentence');
        this.optionsContainer = document.getElementById('options-container');
        this.feedbackElement = document.getElementById('feedback');
        this.nextBtn = document.getElementById('next-btn');
        this.scoreElement = document.getElementById('score');
        this.progressIndicator = document.getElementById('progress-indicator');
        this.timerElement = document.getElementById('timer');
        this.finalScoreElement = document.getElementById('final-score');
        this.progressBar = document.getElementById('progress-bar');
        this.endEmoji = document.getElementById('end-emoji');

        // Variables del juego
        this.currentGame = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.selectedOption = null;
        this.questions = {
            verbs: [],
            subject: [],
            object: []
        };
        this.timer = null;
        this.timeLeft = 15;
        this.INTERNAL_VIDEO_URL = 'https://res.cloudinary.com/dwzwa3gp0/video/upload/v1754274776/WhatsApp_Video_2025-08-03_at_9.27.00_PM_xabtde.mp4';
        this.welcomeVideo = document.getElementById('welcome-video');
        this.videoOverlay = document.getElementById('video-overlay');

        this.initQuestions();
        this.initEventListeners();
        this.showScreen('welcome');

        if (this.INTERNAL_VIDEO_URL && this.INTERNAL_VIDEO_URL.trim() !== '') {
            try {
                this.welcomeVideo.src = this.INTERNAL_VIDEO_URL;
                this.welcomeVideo.load();
                const playPromise = this.welcomeVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay bloqueado: el usuario deberá pulsar play manualmente.
                    });
                }
            } catch (e) {
                console.warn('Error cargando el video interno:', e);
                this.showStartButton();
            }
        } else {
            this.showStartButton();
        }

        setTimeout(() => {
            if (this.videoOverlay) {
                this.videoOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.videoOverlay) this.videoOverlay.style.display = 'none';
                }, 500);
            }
        }, 5000);
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => {
            this.welcomeVideo.pause();
            this.showScreen('games');
        });

        this.creditsBtn.addEventListener('click', () => {
            this.welcomeVideo.pause();
            this.showScreen('credits');
        });

        this.backBtn.addEventListener('click', () => {
            this.showScreen('welcome');
        });

        this.backGameBtn.addEventListener('click', () => {
            clearInterval(this.timer);
            this.showScreen('games');
        });

        this.playAgainBtn.addEventListener('click', () => {
            this.startGame(this.currentGame);
        });

        if (this.creditsBottomBtn) {
            this.creditsBottomBtn.addEventListener('click', () => this.showScreen('credits'));
        }

        if (this.homeBottomBtn) {
            this.homeBottomBtn.addEventListener('click', () => {
                clearInterval(this.timer);
                this.showScreen('welcome');
                try {
                    this.welcomeVideo.pause();
                    this.welcomeVideo.currentTime = 0;
                    if (this.videoOverlay) {
                        this.videoOverlay.style.display = 'flex';
                        this.videoOverlay.style.opacity = '1';
                        setTimeout(() => {
                            this.videoOverlay.style.opacity = '0';
                            setTimeout(() => {
                                if (this.videoOverlay) this.videoOverlay.style.display = 'none';
                            }, 400);
                        }, 1200);
                    }
                } catch(e) {
                    console.error("Error al intentar pausar o reiniciar el video:", e);
                }
            });
        }

        this.nextBtn.addEventListener('click', () => this.nextQuestion());

        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameType = card.getAttribute('data-game');
                this.startGame(gameType);
            });
        });

        this.welcomeVideo.addEventListener('ended', () => {
            this.showStartButton();
        });

        this.welcomeVideo.addEventListener('loadedmetadata', () => {
            if (this.videoOverlay) {
                this.videoOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.videoOverlay) this.videoOverlay.style.display = 'none';
                }, 400);
            }
        });

        this.welcomeVideo.addEventListener('play', () => {
            if (this.videoOverlay) {
                this.videoOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.videoOverlay) this.videoOverlay.style.display = 'none';
                }, 400);
            }
        });
    }

    initQuestions() {
        this.questions.verbs = [
            {
                sentence: "El niño juega con la pelota en el parque.",
                options: ["El", "niño", "juega", "pelota", "parque"],
                answer: "juega",
                instruction: "Selecciona el <span class='highlight'>verbo</span> en la oración"
            },
            {
                sentence: "María come una manzana roja.",
                options: ["María", "come", "manzana", "roja"],
                answer: "come",
                instruction: "Selecciona el <span class='highlight'>verbo</span> en la oración"
            },
            {
                sentence: "Los estudiantes leen libros interesantes.",
                options: ["Los", "estudiantes", "leen", "libros", "interesantes"],
                answer: "leen",
                instruction: "Selecciona el <span class='highlight'>verbo</span> en la oración"
            }
        ];

        this.questions.subject = [
            {
                sentence: "El perro persigue al gato en el jardín.",
                options: ["El", "perro", "persigue", "gato", "jardín"],
                answer: "perro",
                instruction: "Selecciona el <span class='highlight'>sujeto</span> en la oración"
            },
            {
                sentence: "Mi hermana cocina una deliciosa cena.",
                options: ["Mi", "hermana", "cocina", "deliciosa", "cena"],
                answer: "hermana",
                instruction: "Selecciona el <span class='highlight'>sujeto</span> en la oración"
            },
            {
                sentence: "El profesor explica la lección con paciencia.",
                options: ["El", "profesor", "explica", "lección", "paciencia"],
                answer: "profesor",
                instruction: "Selecciona el <span class='highlight'>sujeto</span> en la oración"
            }
        ];

        this.questions.object = [
            {
                sentence: "El chef prepara una sopa deliciosa.",
                options: ["El", "chef", "prepara", "sopa", "deliciosa"],
                answer: "sopa",
                instruction: "Selecciona el <span class='highlight'>objeto directo</span> en la oración"
            },
            {
                sentence: "Los niños abrieron los regalos con emoción.",
                options: ["Los", "niños", "abrieron", "regalos", "emoción"],
                answer: "regalos",
                instruction: "Selecciona el <span class='highlight'>objeto directo</span> en la oración"
            },
            {
                sentence: "Ella escribió una carta muy larga.",
                options: ["Ella", "escribió", "carta", "muy", "larga"],
                answer: "carta",
                instruction: "Selecciona el <span class='highlight'>objeto directo</span> en la oración"
            }
        ];
    }

    showScreen(screenName) {
        clearInterval(this.timer);
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    showStartButton() {
        this.startBtn.classList.remove('hidden');
        this.creditsBtn.classList.remove('hidden');
        this.startBtn.focus();
    }

    startGame(gameType) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.currentGame = gameType;
        this.currentQuestion = 0;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.finalScoreElement.textContent = this.score;
        let gameTitle = '';
        switch(gameType) {
            case 'verbs':
                gameTitle = 'Juego de Verbos';
                break;
            case 'subject':
                gameTitle = 'Juego del Sujeto';
                break;
            case 'object':
                gameTitle = 'Juego del Objeto Directo';
                break;
        }
        this.gameTitle.textContent = gameTitle;
        this.showScreen('gameActive');
        this.showQuestion();
        this.startTimer();
    }

    showQuestion() {
        this.selectedOption = null;
        this.nextBtn.disabled = true;
        this.feedbackElement.textContent = '';
        this.feedbackElement.className = 'feedback';
        const question = this.questions[this.currentGame][this.currentQuestion];
        this.sentenceElement.textContent = question.sentence;
        this.gameInstructions.innerHTML = question.instruction;
        this.optionsContainer.innerHTML = '';
        this.progressIndicator.textContent = `Pregunta ${this.currentQuestion + 1} de ${this.questions[this.currentGame].length}`;
        question.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.selectOption(option, button));
            this.optionsContainer.appendChild(button);
        });
        this.startTimer();
    }

    selectOption(option, button) {
        clearInterval(this.timer);
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedOption = option;
        button.classList.add('selected');
        this.nextBtn.disabled = false;
    }

    nextQuestion() {
        if (this.selectedOption === null) return;
        const question = this.questions[this.currentGame][this.currentQuestion];
        const isCorrect = this.selectedOption === question.answer;
        if (isCorrect) {
            this.feedbackElement.textContent = '¡Correcto! 🎉';
            this.feedbackElement.className = 'feedback correct';
            this.score += 10;
            this.scoreElement.textContent = this.score;
        } else {
            this.feedbackElement.textContent = `Incorrecto. La respuesta correcta es "${question.answer}".`;
            this.feedbackElement.className = 'feedback incorrect';
        }
        this.nextBtn.disabled = true;
        setTimeout(() => {
            this.currentQuestion++;
            if (this.currentQuestion < this.questions[this.currentGame].length) {
                this.showQuestion();
            } else {
                this.showEndScreen();
            }
        }, 1500);
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timeLeft = 15;
        this.updateTimerDisplay();
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.feedbackElement.textContent = '¡Tiempo agotado! 😢';
                this.feedbackElement.className = 'feedback incorrect';
                setTimeout(() => {
                    this.showEndScreen();
                }, 1500);
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerElement.textContent = `Tiempo: ${this.timeLeft}s`;
    }

    showEndScreen() {
        clearInterval(this.timer);
        this.finalScoreElement.textContent = this.score;
        const maxScore = this.questions[this.currentGame].length * 10;
        const percentage = (this.score / maxScore) * 100;
        this.progressBar.style.width = `${percentage}%`;
        if (percentage >= 70) {
            this.endEmoji.textContent = '😄';
        } else {
            this.endEmoji.textContent = '😢';
        }
        this.showScreen('gameEnd');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new DicgloApp();
});




