// script.js
const socket = io('https://quizizz-chess-server.onrender.com/');

// --- Constants and Initial Setup ---
const PIECE_IMAGES = {
    'P': 'https://quizizzchessimages.pages.dev/images/p2.png',
    'R': 'https://quizizzchessimages.pages.dev/images/r2.png',
    'N': 'https://quizizzchessimages.pages.dev/images/n2.png',
    'B': 'https://quizizzchessimages.pages.dev/images/b2.png',
    'Q': 'https://quizizzchessimages.pages.dev/images/q2.png',
    'K': 'https://quizizzchessimages.pages.dev/images/k2.png',
    'p': 'https://quizizzchessimages.pages.dev/images/p.png',
    'r': 'https://quizizzchessimages.pages.dev/images/r.png',
    'n': 'https://quizizzchessimages.pages.dev/images/n.png',
    'b': 'https://quizizzchessimages.pages.dev/images/b.png',
    'q': 'https://quizizzchessimages.pages.dev/images/q.png',
    'k': 'https://quizizzchessimages.pages.dev/images/k.png',
};

const STARTING_POSITION = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

let board = JSON.parse(JSON.stringify(STARTING_POSITION)); // Deep copy
let selectedSquare = null;
let possibleMoves = [];
let boardOrientation = 'white';  // Default, updated from server
let isCurrentlyUsersTurn = false;
let currentRoom = null;
let myID = null;

// DOM Elements
const boardElement = document.getElementById('board');
const roomInput = document.getElementById('roomInput');
const joinRoomButton = document.getElementById('joinRoomButton');
const chatBox = document.getElementById('chatBox');
const chatMessageInput = document.getElementById('chatMessageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const roomCodeText = document.getElementById('roomCodeText');
const playerTurnIndicator = document.getElementById('playerTurnIndicator');

// --- Utility Functions ---
const getSquareColor = (row, col) => (row + col) % 2 === 0 ? 'white' : 'black';
const getPieceImage = (piece) => PIECE_IMAGES[piece];
const notationToCoords = (notation) => {
    const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(notation.slice(1));
    return [row, col];
};
const coordsToNotation = (row, col) => {
    const colChar = String.fromCharCode('a'.charCodeAt(0) + col);
    const rowChar = String.fromCharCode('1'.charCodeAt(0) + (7 - row));
    return `${colChar}${rowChar}`;
};

// --- Board Rendering ---
function renderBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const adjustedRow = boardOrientation === 'white' ? row : 7 - row;
            const adjustedCol = boardOrientation === 'white' ? col : 7 - col;
            const square = document.createElement('div');
            square.className = `square ${getSquareColor(adjustedRow, adjustedCol)}`;
            square.dataset.row = adjustedRow;
            square.dataset.col = adjustedCol;
            const piece = board[adjustedRow][adjustedCol];
            if (piece) {
                const pieceImage = document.createElement('img');
                pieceImage.src = getPieceImage(piece);
                pieceImage.className = 'piece';
                pieceImage.draggable = false;
                square.appendChild(pieceImage);
            }
            square.addEventListener('click', handleSquareClick);
            if (possibleMoves.some(move => move.row === adjustedRow && move.col === adjustedCol)) {
                square.classList.add('moveable');
            }
            boardElement.appendChild(square);
        }
    }
    updateTurnIndicator();
}

function updateTurnIndicator() {
    playerTurnIndicator.textContent = isCurrentlyUsersTurn ? "Your Turn" : "Waiting for Opponent";
    playerTurnIndicator.style.color = isCurrentlyUsersTurn ? "green" : "red";
}

// --- Move Generation ---
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const pieceType = piece.toLowerCase();
    const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
    if (pieceColor !== boardOrientation) return [];
    switch (pieceType) {
        case 'p': return getPawnMoves(row, col, pieceColor);
        case 'r': return getLinearMoves(row, col, [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }], pieceColor);
        case 'n': return getKnightMoves(row, col, pieceColor);
        case 'b': return getLinearMoves(row, col, [{ row: 1, col: 1 }, { row: 1, col: -1 }, { row: -1, col: 1 }, { row: -1, col: -1 }], pieceColor);
        case 'q': return getLinearMoves(row, col, [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }, { row: 1, col: 1 }, { row: 1, col: -1 }, { row: -1, col: 1 }, { row: -1, col: -1 }], pieceColor);
        case 'k': return getKingMoves(row, col, pieceColor);
        default: return [];
    }
}

function getPawnMoves(row, col, pieceColor) {
    const moves = [];
    const direction = pieceColor === 'white' ? -1 : 1;
    const startRow = pieceColor === 'white' ? 6 : 1;
    const forwardRow = row + direction;
    const opponentColor = pieceColor === 'white' ? 'black' : 'white';

    // Forward move (one square)
    if (forwardRow >= 0 && forwardRow < 8 && board[forwardRow][col] === '') {
        moves.push({ row: forwardRow, col });
    }

    // Forward move (two squares, on first move only)
    if (row === startRow && board[row + direction][col] === '' && board[row + 2 * direction][col] === '') {
        moves.push({ row: row + 2 * direction, col });
    }

    // Capture diagonally
    const captureCols = [col - 1, col + 1];
    for (const captureCol of captureCols) {
        if (captureCol >= 0 && captureCol < 8 && board[forwardRow] && board[forwardRow][captureCol]) {
            const destinationPiece = board[forwardRow][captureCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';

            if (destinationPieceColor === opponentColor) {
                moves.push({ row: forwardRow, col: captureCol });
            }
        }
    }
    return moves;
}

function getKnightMoves(row, col, pieceColor) {
    const knightMoves = [
        { row: -2, col: -1 }, { row: -2, col: 1 }, { row: -1, col: -2 }, { row: -1, col: 2 },
        { row: 1, col: -2 }, { row: 1, col: 2 }, { row: 2, col: -1 }, { row: 2, col: 1 }
    ];

    return knightMoves
        .map(move => ({ row: row + move.row, col: col + move.col }))
        .filter(({ row: newRow, col: newCol }) => {
            const isValidSquare = newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8;
            if (!isValidSquare) {
                return false;
            }

            const destinationPiece = board[newRow][newCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';
            const isSameColor = (destinationPieceColor === pieceColor);

            if (destinationPiece === '' || !isSameColor) {
                return true;
            } else {
                return false;
            }
        });
}

function getKingMoves(row, col, pieceColor) {
    const kingMoves = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    return kingMoves
        .map(move => ({ row: row + move.row, col: col + move.col }))
        .filter(({ row: newRow, col: newCol }) => {
            const isValidSquare = newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8;
            if (!isValidSquare) {
                return false;
            }

            const destinationPiece = board[newRow][newCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';
            const isSameColor = (destinationPieceColor === pieceColor);

            if (destinationPiece === '' || !isSameColor) {
                return true;
            } else {
                return false;
            }
        });
}

function getLinearMoves(row, col, directions, pieceColor) {
    const moves = [];
    const piece = board[row][col];
    const myColor = piece === piece.toUpperCase() ? 'white' : 'black';

    for (const direction of directions) {
        let newRow = row + direction.row;
        let newCol = col + direction.col;
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const destinationPiece = board[newRow][newCol];
            const destinationColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';

            if (destinationPiece === '') {
                moves.push({ row: newRow, col: newCol });
            } else if (destinationColor !== myColor) {
                moves.push({ row: newRow, col: newCol });
                break;
            } else {
                break;
            }
            newRow += direction.row;
            newCol += direction.col;
        }
    }
    return moves;
}

// --- Event Handlers ---
function handleSquareClick(event) {
    if (!isCurrentlyUsersTurn) return;
    const square = event.target.closest('.square');
    if (!square) return;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = board[row][col];

    if (!selectedSquare) {
        const pieceColor = (piece.toLowerCase() === piece ? 'black' : 'white');
        const isCorrectColor = (pieceColor === boardOrientation);

        if (piece && isCorrectColor) {
            selectedSquare = { row, col };
            possibleMoves = getValidMoves(row, col);
            renderBoard(); // highlights possible moves
        }
    } else {
        const move = possibleMoves.find(m => m.row === row && m.col === col);
        if (move) {
            makeMove(selectedSquare, move);  // This now just emits the move
        } else {
             // Handle deselect
            selectedSquare = null;
            possibleMoves = [];
            renderBoard();
        }
    }
}


function makeMove(from, to) {
    const fromNotation = coordsToNotation(from.row, from.col);
    const toNotation = coordsToNotation(to.row, to.col);
    socket.emit('newMove', { room: currentRoom, move: { from: fromNotation, to: toNotation } });
     // Don't update the board locally
    selectedSquare = null;
    possibleMoves = [];
     // Don't update isCurrentlyUsersTurn here.  Wait for server confirmation.
}

function animateMove(fromCoords, toCoords, piece) {
    // 1. Get the DOM elements for the source and destination squares.
    const fromSquare = document.querySelector(`.square[data-row="${fromCoords[0]}"][data-col="${fromCoords[1]}"]`);
    const toSquare = document.querySelector(`.square[data-row="${toCoords[0]}"][data-col="${toCoords[1]}"]`);

    // 2. Get the piece image element.
    const pieceElement = fromSquare.querySelector('.piece');
    if (!pieceElement) {
        console.error("Piece element not found for animation.");
        return;
    }

     // 3. calculate pixel offset
     const fromRect = fromSquare.getBoundingClientRect();
     const toRect = toSquare.getBoundingClientRect();
     const boardRect = boardElement.getBoundingClientRect();

     const deltaX = toRect.left - fromRect.left;
     const deltaY = toRect.top - fromRect.top;

     // 4. Apply a CSS transform to *move* the piece.
     pieceElement.style.transition = 'transform 0.3s ease-in-out'; // transition on transform
     pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

     // 5. After the transition completes, update the board and re-render *without* transitions.
     pieceElement.addEventListener('transitionend', () => {
         // Update board data *after* animation.
         board[toCoords[0]][toCoords[1]] = board[fromCoords[0]][fromCoords[1]];
         board[fromCoords[0]][fromCoords[1]] = '';

         // Remove the transform.
         pieceElement.style.transform = '';
         pieceElement.style.transition = '';

         // Set user's turn
         isCurrentlyUsersTurn = (piece.toLowerCase() === piece ? 'black' : 'white') !== boardOrientation;
         renderBoard();  // Re-render, without transitions.
         updateTurnIndicator();
     }, { once: true }); // Important:  Remove the listener after it runs once.
}


// --- Socket.IO Event Handlers ---
socket.on('connect', () => {
    console.log('Connected to server');
    myID = socket.id;
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomCode = urlParams.get('room');
    if (urlRoomCode) {
        roomInput.value = urlRoomCode;
        joinRoom(urlRoomCode);
    }
});

socket.on('gameState', (gameState) => {
    if (!Array.isArray(gameState.board) || gameState.board.length !== 8 ||
        !gameState.board.every(row => Array.isArray(row) && row.length === 8)) {
        console.error("Invalid board received from server:", gameState.board);
        return;
    }
    board = gameState.board;
    boardOrientation = gameState.playerColor;
    isCurrentlyUsersTurn = gameState.isCurrentPlayerTurn;
    currentRoom = gameState.room;
    renderBoard();
    updateTurnIndicator();
    if (currentRoom) {
        roomCodeText.textContent = `Room Code: ${currentRoom}`;
    }
});

socket.on('moveUpdate', (data) => {
    const { from, to } = data.move;
    const fromCoords = notationToCoords(from);
    const toCoords = notationToCoords(to);
    const movedPiece = board[fromCoords[0]][fromCoords[1]]; // Important for pawn promotion

    animateMove(fromCoords, toCoords, movedPiece);
    // No longer directly update the board here.
    // isCurrentlyUsersTurn is also handled inside animateMove
});

socket.on('opponentDisconnected', () => {
    alert('Your opponent has disconnected.');
    isCurrentlyUsersTurn = false;
    updateTurnIndicator();
});

socket.on('invalidRoom', () => {
    alert('Invalid room code.');
    roomInput.value = '';
    currentRoom = null;
});

socket.on('roomFull', () => {
    alert('This room is full.');
    roomInput.value = '';
    currentRoom = null;
});

// --- CHAT ---
socket.on('chatMessage', ({ sender, message }) => {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender === myID ? "You" : "Opponent"}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// --- DOM Event Listeners ---
joinRoomButton.addEventListener('click', () => {
    const roomCode = roomInput.value.trim();
    if (roomCode) {
        joinRoom(roomCode);
    }
});

function resetBoard() {
    board = JSON.parse(JSON.stringify(STARTING_POSITION));
    selectedSquare = null;
    possibleMoves = [];
    renderBoard();
    isCurrentlyUsersTurn = boardOrientation === 'white';
    updateTurnIndicator();
}

function joinRoom(roomCode) {
    if (currentRoom) {
        socket.emit('leaveRoom', currentRoom);
    }
    currentRoom = roomCode;
    socket.emit('joinRoom', roomCode);

    // Fetch chat history when joining a new room
    socket.emit('requestChatHistory', roomCode); // Request history from the server

    resetBoard();
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    chatBox.innerHTML = '<p><strong>System:</strong> Welcome to the chat!</p>';
}

// New event listener for receiving chat history
socket.on('chatHistory', (history) => {
  history.forEach(({ sender, message }) => {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${sender === myID ? "You" : "Opponent"}:</strong> ${message}`;
        chatBox.appendChild(messageElement);
  });
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom after loading
});

sendMessageButton.addEventListener('click', sendMessage);
chatMessageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = chatMessageInput.value.trim();
    if (message && currentRoom) {
        socket.emit('chatMessage', { room: currentRoom, message });
        chatMessageInput.value = '';
    }
}

// Initial Render
window.onload = function() {
    renderBoard();
};