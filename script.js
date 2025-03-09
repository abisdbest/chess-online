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

    // Forward move (one square) - No capture possible here, so no color check needed

    // Forward move (two squares, on first move only) - No capture possible here, so no color check needed


    // Capture diagonally
    const captureCols = [col - 1, col + 1];
    for (const captureCol of captureCols) {
        if (captureCol >= 0 && captureCol < 8 && board[forwardRow] && board[forwardRow][captureCol]) {
            const destinationPiece = board[forwardRow][captureCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';
            const isSameColor = (destinationPieceColor === pieceColor);

            console.log(`getPawnMoves - Checking capture square: ${forwardRow},${captureCol}, Destination piece: ${destinationPiece}, Destination color: ${destinationPieceColor}, My color: ${pieceColor}, Same color: ${isSameColor}`); // Detailed log

            if (!isSameColor) { // Correct condition - capture if NOT same color (i.e., opponent or empty - but should be opponent due to check above)
                moves.push({ row: forwardRow, col: captureCol });
            } else {
                console.log(`getPawnMoves - Blocked by own piece at capture square: ${forwardRow},${captureCol}`); // Log own piece block
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
                console.log(`getKnightMoves - Invalid square: ${newRow},${newCol} (out of bounds)`); // Log out-of-bounds
                return false; // Skip out-of-bounds squares
            }

            const destinationPiece = board[newRow][newCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';
            const isSameColor = (destinationPieceColor === pieceColor);

            console.log(`getKnightMoves - Checking square: ${newRow},${newCol}, Destination piece: ${destinationPiece}, Destination color: ${destinationPieceColor}, My color: ${pieceColor}, Same color: ${isSameColor}`); // Detailed log

            if (destinationPiece === '' || !isSameColor) { // Correct condition - allow empty or opponent piece
                return true; // Valid move if empty or opponent
            } else {
                console.log(`getKnightMoves - Blocked by own piece at ${newRow},${newCol}`); // Log own piece block
                return false; // Invalid if own piece
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
                console.log(`getKingMoves - Invalid square: ${newRow},${newCol} (out of bounds)`); // Log out-of-bounds
                return false; // Skip out-of-bounds squares
            }

            const destinationPiece = board[newRow][newCol];
            const destinationPieceColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black';
            const isSameColor = (destinationPieceColor === pieceColor);

            // console.log(`getKingMoves - Checking square: ${newRow},${newCol}, Destination piece: ${destinationPiece}, Destination color: ${destinationPieceColor}, My color: ${pieceColor}, Same color: ${isSameColor}`); // Detailed log - No need to log every king move anymore, as it's working

            if (destinationPiece === '' || !isSameColor) { // Correct condition - allow empty or opponent piece
                return true; // Valid move if empty or opponent
            } else {
                console.log(`getKingMoves - Blocked by own piece at ${newRow},${newCol}`); // Log own piece block
                return false; // Invalid if own piece
            }
        });
}

function getLinearMoves(row, col, directions, pieceColor) {
    const moves = [];
    const piece = board[row][col];
    const myColor = piece === piece.toUpperCase() ? 'white' : 'black'; // Get color of the piece moving

    for (const direction of directions) {
        let newRow = row + direction.row;
        let newCol = col + direction.col;
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const destinationPiece = board[newRow][newCol];
            const destinationColor = destinationPiece === destinationPiece.toUpperCase() ? 'white' : 'black'; // Get color of piece at destination

            // console.log(`Linear move - Checking ${newRow},${newCol}. Destination piece: ${destinationPiece}, Destination color: ${destinationColor}, My color: ${myColor}`); // Debugging - No need to log linear moves anymore

            if (destinationPiece === '') {
                moves.push({ row: newRow, col: newCol });
            } else if (destinationColor !== myColor) { // Correct color comparison for capture
                // console.log(`Linear move - Can capture opponent piece at ${newRow},${newCol}`); // Debugging - No need to log linear captures anymore
                moves.push({ row: newRow, col: newCol });
                break; // Stop after capturing opponent
            } else {
                // console.log(`Linear move - Blocked by own piece at ${newRow},${newCol}`); // Debugging - No need to log linear blocks anymore
                break; // Stop if own piece
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

    console.log(`handleSquareClick - Piece clicked: ${piece}, boardOrientation: ${boardOrientation}`); // Log piece and orientation

    if (!selectedSquare) {
        const pieceColor = (piece.toLowerCase() === piece ? 'black' : 'white'); // Determine piece color
        const isCorrectColor = (pieceColor === boardOrientation); // Compare with boardOrientation

        console.log(`handleSquareClick - Piece color: ${pieceColor}, Board orientation color: ${boardOrientation}, Color check result: ${isCorrectColor}`); // Log details

        if (piece && isCorrectColor) { // Use isCorrectColor for the condition
            selectedSquare = { row, col };
            possibleMoves = getValidMoves(row, col);
            renderBoard();
        } else if (piece) {
            console.log(`handleSquareClick - Wrong color piece selected. Piece color: ${pieceColor}, Your color: ${boardOrientation}`); // Log wrong color selection
        }
    } else {
        const move = possibleMoves.find(m => m.row === row && m.col === col);
        if (move) {
            makeMove(selectedSquare, move);
        } else {
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
    selectedSquare = null;
    possibleMoves = [];
    isCurrentlyUsersTurn = false; // Server will update this
    updateTurnIndicator();
}

function resetBoard() {
    board = JSON.parse(JSON.stringify(STARTING_POSITION));
    selectedSquare = null;
    possibleMoves = [];
    renderBoard();
    isCurrentlyUsersTurn = boardOrientation === 'white'; // Server will update this, but this is a good default
    updateTurnIndicator();
}

// --- Socket.IO Event Handlers ---
socket.on('connect', () => {
    console.log('Connected to server');
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

    // Update board state
    board[toCoords[0]][toCoords[1]] = board[fromCoords[0]][fromCoords[1]];
    board[fromCoords[0]][fromCoords[1]] = '';

    // Use server's currentPlayer to determine turn
    isCurrentlyUsersTurn = data.currentPlayer === boardOrientation;

    renderBoard();
    updateTurnIndicator();
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

// --- DOM Event Listeners ---
joinRoomButton.addEventListener('click', () => {
    const roomCode = roomInput.value.trim();
    if (roomCode) {
        joinRoom(roomCode);
    }
});

function joinRoom(roomCode) {
    if (currentRoom) {
        socket.emit('leaveRoom', currentRoom);
    }
    currentRoom = roomCode;
    socket.emit('joinRoom', roomCode);
    resetBoard();
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

sendMessageButton.addEventListener('click', sendMessage);
chatMessageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = chatMessageInput.value.trim();
    if (message) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>You:</strong> ${message}`;
        chatBox.appendChild(messageElement);
        chatMessageInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Initial Render
window.onload = function() {
    renderBoard();
};