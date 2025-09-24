class AppleGame {
    constructor() {
        this.board = [];
        this.score = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        this.isDragging = false;
        this.selectedApples = [];
        this.dragStart = { x: 0, y: 0 };
        this.selectionBox = null;
        
        this.initGame();
        this.startTimer();
    }

    initGame() {
        this.createGameBoard();
        this.generateApples();
        this.setupEventListeners();
        this.updateUI();
    }

    createGameBoard() {
        const gameBoard = document.getElementById('gameBoard');
        const appleGrid = document.createElement('div');
        appleGrid.className = 'apple-grid';
        appleGrid.id = 'appleGrid';
        gameBoard.appendChild(appleGrid);
    }

    generateApples() {
        const appleGrid = document.getElementById('appleGrid');
        appleGrid.innerHTML = '';
        this.board = [];
        
        // 15x8 = 120개 사과 생성
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 15; col++) {
                const number = Math.floor(Math.random() * 9) + 1; // 1-9 랜덤 숫자
                this.board[row][col] = { number, removed: false };
                
                const apple = document.createElement('div');
                apple.className = 'apple';
                apple.textContent = number;
                apple.dataset.row = row;
                apple.dataset.col = col;
                apple.dataset.number = number;
                
                appleGrid.appendChild(apple);
            }
        }
    }

    setupEventListeners() {
        const appleGrid = document.getElementById('appleGrid');
        
        // 마우스 다운 (드래그 시작)
        appleGrid.addEventListener('mousedown', (e) => {
            if (this.isGameOver || e.target.classList.contains('apple-removed')) return;
            
            this.isDragging = true;
            this.selectedApples = [];
            this.clearSelection();
            
            const rect = appleGrid.getBoundingClientRect();
            this.dragStart.x = e.clientX - rect.left;
            this.dragStart.y = e.clientY - rect.top;
            
            this.createSelectionBox();
            appleGrid.style.userSelect = 'none';
        });

        // 마우스 이동 (드래그 중)
        appleGrid.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.isGameOver) return;
            
            const rect = appleGrid.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            this.updateSelectionBox(this.dragStart.x, this.dragStart.y, currentX, currentY);
            this.updateSelection();
        });

        // 마우스 업 (드래그 종료)
        appleGrid.addEventListener('mouseup', (e) => {
            if (!this.isDragging || this.isGameOver) return;
            
            this.isDragging = false;
            appleGrid.style.userSelect = '';
            
            this.removeSelectionBox();
            this.processSelection();
        });

        // 마우스가 게임 보드를 벗어날 때
        appleGrid.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                appleGrid.style.userSelect = '';
                this.removeSelectionBox();
                this.clearSelection();
            }
        });
    }

    createSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        
        // 드래그 시작 위치에서 박스 초기화
        this.selectionBox.style.left = this.dragStart.x + 'px';
        this.selectionBox.style.top = this.dragStart.y + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        
        document.getElementById('appleGrid').appendChild(this.selectionBox);
    }

    updateSelectionBox(startX, startY, endX, endY) {
        if (!this.selectionBox) return;
        
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }

    updateSelection() {
        if (!this.selectionBox) return;
        
        const appleGrid = document.getElementById('appleGrid');
        const apples = appleGrid.querySelectorAll('.apple:not(.removed)');
        
        this.clearSelection();
        this.selectedApples = [];
        
        const selectionRect = this.selectionBox.getBoundingClientRect();
        const gridRect = appleGrid.getBoundingClientRect();
        
        apples.forEach(apple => {
            const appleRect = apple.getBoundingClientRect();
            
            // 사과가 선택 박스와 겹치는지 확인
            if (this.isOverlapping(selectionRect, appleRect)) {
                apple.classList.add('selected');
                this.selectedApples.push({
                    element: apple,
                    number: parseInt(apple.dataset.number),
                    row: parseInt(apple.dataset.row),
                    col: parseInt(apple.dataset.col)
                });
            }
        });
    }

    isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    clearSelection() {
        const selectedApples = document.querySelectorAll('.apple.selected');
        selectedApples.forEach(apple => apple.classList.remove('selected'));
    }

    processSelection() {
        if (this.selectedApples.length === 0) return;
        
        const sum = this.selectedApples.reduce((total, apple) => total + apple.number, 0);
        
        if (sum === 10) {
            // 조건 달성 - 사과 제거 및 점수 추가
            this.removeSelectedApples();
            this.score += this.selectedApples.length;
            this.updateUI();
        } else {
            // 조건 미달성 - 선택 해제
            this.clearSelection();
        }
        
        this.selectedApples = [];
    }

    removeSelectedApples() {
        this.selectedApples.forEach(apple => {
            // 게임 보드에서 제거 표시
            this.board[apple.row][apple.col].removed = true;
            
            // UI에서 제거 애니메이션 (투명하게 만들지만 공간은 유지)
            apple.element.style.transition = 'all 0.3s ease-out';
            apple.element.style.opacity = '0';
            apple.element.style.pointerEvents = 'none';
            apple.element.classList.add('removed');
            
            // 사과를 완전히 투명하게 만들되 DOM에서는 유지 (빈 공간 유지)
            setTimeout(() => {
                apple.element.style.visibility = 'hidden';
                apple.element.textContent = ''; // 숫자도 제거
            }, 300);
        });
    }

    startTimer() {
        const timer = setInterval(() => {
            if (this.isGameOver) {
                clearInterval(timer);
                return;
            }
            
            this.timeLeft--;
            this.updateUI();
            
            if (this.timeLeft <= 0) {
                this.endGame();
                clearInterval(timer);
            }
        }, 1000);
    }

    endGame() {
        this.isGameOver = true;
        document.getElementById('gameState').textContent = 'finished';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').style.display = 'block';
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('timer').textContent = this.timeLeft;
    }

    restart() {
        this.score = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        this.selectedApples = [];
        this.clearSelection();
        this.removeSelectionBox();
        
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('gameState').textContent = 'playing';
        
        this.generateApples();
        this.updateUI();
        this.startTimer();
    }
}

// BGM 관리 클래스
class BGMManager {
    constructor() {
        this.audio = document.getElementById('bgmAudio');
        this.isEnabled = true;
        this.volume = 0.75; // 기본 볼륨 75%
        this.setupEventListeners();
    }

    setupEventListeners() {
        // BGM 체크박스 이벤트
        const bgmCheckbox = document.getElementById('bgmToggle');
        if (bgmCheckbox) {
            this.isEnabled = bgmCheckbox.checked; // 초기 상태 설정
            bgmCheckbox.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                if (this.isEnabled) {
                    this.play();
                } else {
                    this.pause();
                }
            });
        }

        // 볼륨 슬라이더 이벤트
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
        }
    }

    play() {
        if (this.isEnabled && this.audio) {
            this.audio.play().catch(e => {
                console.log('BGM 재생 실패:', e);
                // 브라우저 정책으로 자동 재생이 차단된 경우
                if (e.name === 'NotAllowedError') {
                    console.log('자동 재생이 차단되었습니다. 사용자 상호작용 후 재생됩니다.');
                }
            });
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
    }

    // 게임용 BGM 생성 (music.mp3 우선, 없으면 생성된 BGM)
    generateGameBGM() {
        // music.mp3 파일 로드 시도
        this.audio.src = 'music.mp3';
        this.audio.load(); // 파일 다시 로드
        
        // 파일 로드 성공 시 재생
        this.audio.addEventListener('canplaythrough', () => {
            if (this.isEnabled) {
                this.play();
            }
        }, { once: true });
        
        // 파일 로드 실패 시 생성된 BGM 재생
        this.audio.addEventListener('error', () => {
            console.log('music.mp3 로드 실패, 생성된 BGM으로 대체');
            this.createSimpleBGM();
        }, { once: true });
    }

    createSimpleBGM() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 30; // 30초 길이의 완전한 곡
            const bufferSize = audioContext.sampleRate * duration;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // 더 복잡하고 완전한 멜로디 생성
            for (let i = 0; i < bufferSize; i++) {
                const time = i / audioContext.sampleRate;
                
                // 기본 멜로디 (C major 스케일)
                const melody = this.generateMelody(time);
                
                // 베이스 라인
                const bass = Math.sin(2 * Math.PI * 110 * time) * 0.05; // A2
                
                // 하모니
                const harmony = Math.sin(2 * Math.PI * 330 * time) * 0.03; // E4
                
                // 리듬 패턴
                const rhythm = Math.sin(2 * Math.PI * 4 * time) * 0.02;
                
                // 볼륨 엔벨로프 (페이드 인/아웃)
                let envelope = 1;
                if (time < 1) envelope = time; // 페이드 인
                if (time > duration - 1) envelope = duration - time; // 페이드 아웃
                
                data[i] = (melody + bass + harmony + rhythm) * envelope * 0.3;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.connect(audioContext.destination);
            source.start();

            // 오디오 컨텍스트를 저장하여 나중에 정지할 수 있도록 함
            this.audioContext = audioContext;
            this.audioSource = source;
        } catch (e) {
            console.log('BGM 생성 실패:', e);
        }
    }

    generateMelody(time) {
        // C major 스케일: C, D, E, F, G, A, B, C
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        
        // 8비트 패턴으로 멜로디 생성
        const beat = Math.floor(time * 2) % 8; // 2비트/초
        const noteIndex = beat % notes.length;
        const frequency = notes[noteIndex];
        
        // 아르페지오 효과
        const arpeggio = Math.sin(2 * Math.PI * frequency * time * 2) * 0.1;
        
        // 메인 멜로디
        const mainMelody = Math.sin(2 * Math.PI * frequency * time) * 0.08;
        
        // 옥타브 변조
        const octave = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.04;
        
        return mainMelody + arpeggio + octave;
    }

    stopGeneratedBGM() {
        if (this.audioSource) {
            this.audioSource.stop();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// 전역 BGM 매니저
let bgmManager;

// 전역 함수들
function startGame() {
    // 인트로 화면 숨기기
    document.getElementById('introScreen').style.display = 'none';
    // 게임 화면 보이기
    document.getElementById('gameScreen').style.display = 'block';
    
    // BGM 시작 (사용자 상호작용 후이므로 재생 가능)
    if (bgmManager) {
        bgmManager.generateGameBGM();
        // 약간의 지연 후 재생 (DOM 업데이트 후)
        setTimeout(() => {
            bgmManager.play();
        }, 100);
    }
    
    // 게임 시작
    if (!window.game) {
        window.game = new AppleGame();
    } else {
        window.game.restart();
    }
}

function goToIntro() {
    // 게임 화면 숨기기
    document.getElementById('gameScreen').style.display = 'none';
    // 인트로 화면 보이기
    document.getElementById('introScreen').style.display = 'block';
    
    // BGM 정지
    if (bgmManager) {
        bgmManager.pause();
        bgmManager.stopGeneratedBGM();
    }
    
    // 게임 중지
    if (window.game) {
        window.game.isGameOver = true;
    }
}

function resetGame() {
    if (window.game) {
        window.game.restart();
        startGame(); // 게임 화면으로 전환
    }
}

function restartGame() {
    if (window.game) {
        window.game.restart();
    }
}

// 페이지 로드 시 인트로 화면 표시
document.addEventListener('DOMContentLoaded', () => {
    // 초기에는 인트로 화면만 표시
    document.getElementById('introScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    
    // BGM 매니저 초기화
    bgmManager = new BGMManager();
});
