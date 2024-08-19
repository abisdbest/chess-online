// Chess game logic
let selectedSquare = null;
let possibleMoves = [];
let movesToProcess = [];
let boardElement
let boardOrientation = confirm("black => ok,\nwhite => cancel") ? 'black' : 'white'; // the boardorientation variable tells you what color the user has chosen to be

const board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

function renderBoard() {
    const boardElement = document.querySelector('.board');
    console.log('Rendering Board:', board); // Debugging output
    boardElement.innerHTML = '';
    
    const rows = 8;
    const cols = 8;
    
    // Adjust row and col for black orientation
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const adjustedRow = boardOrientation === 'white' ? row : (rows - 1 - row);
            const adjustedCol = boardOrientation === 'white' ? col : (cols - 1 - col);
    
            const square = document.createElement('div');
            square.className = `square ${getSquareColor(adjustedRow, adjustedCol)}`;
            square.dataset.row = adjustedRow;
            square.dataset.col = adjustedCol;
    
            const piece = board[adjustedRow][adjustedCol];
            if (piece !== '') {
                const pieceImage = document.createElement('img');
                pieceImage.src = getPieceImage(piece);
                pieceImage.className = 'piece';
                square.appendChild(pieceImage);
            }
    
            square.addEventListener('click', handleSquareClick);
    
            if (possibleMoves.some(move => move.row === adjustedRow && move.col === adjustedCol)) {
                square.classList.add('moveable');
            }
    
            boardElement.appendChild(square);
        }
    }
}

function getPieceImage(piece) {
    const pieceImages = {
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
    return pieceImages[piece];
}

function getSquareColor(row, col) {
    return (row + col) % 2 === 0 ? 'white' : 'black';
}

function handleSquareClick(event) {
    const row = parseInt(event.target.closest('.square').dataset.row);
    const col = parseInt(event.target.closest('.square').dataset.col);

    const piece = board[row][col];
    const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';

    if (!selectedSquare) {
        if (piece !== '' && pieceColor === boardOrientation) {
            selectedSquare = { row, col };
            possibleMoves = getValidMoves(row, col);
            renderBoard();
        }
    } else {
        const move = possibleMoves.find(move => move.row === row && move.col === col);

        if (move) {
            makeMove(selectedSquare, move);
            selectedSquare = null;
            possibleMoves = [];
        } else {
            selectedSquare = null;
            possibleMoves = [];
        }

        renderBoard();
    }
}


function getValidMoves(row, col) {
    const piece = board[row][col].toLowerCase();
    const pieceColor = board[row][col] === board[row][col].toUpperCase() ? 'white' : 'black';
    let moves = [];

    if (piece === 'p') {
        moves = getPawnMoves(row, col, pieceColor);
    } else if (piece === 'r') {
        moves = getRookMoves(row, col, pieceColor);
    } else if (piece === 'n') {
        moves = getKnightMoves(row, col, pieceColor);
    } else if (piece === 'b') {
        moves = getBishopMoves(row, col, pieceColor);
    } else if (piece === 'q') {
        moves = getQueenMoves(row, col, pieceColor);
    } else if (piece === 'k') {
        moves = getKingMoves(row, col, pieceColor);
    }

    return moves;
}

function getPawnMoves(row, col) {
    const moves = [];
    const piece = board[row][col];
    const direction = piece === 'p' ? 1 : -1; // 1 for white pawns, -1 for black pawns
    const startRow = piece === 'p' ? 1 : 6;
    const opponentColor = boardOrientation === 'white' ? 'rnbqkp' : 'RNBQKP';

    // Forward move
    if (board[row + direction][col] === '') {
        moves.push({ row: row + direction, col });

        // Two-space forward move on first move
        if (row === startRow && board[row + 2 * direction][col] === '') {
            moves.push({ row: row + 2 * direction, col });
        }
    }

    // Capture diagonally left
    if (col > 0 && board[row + direction][col - 1] !== '' && opponentColor.includes(board[row + direction][col - 1])) {
        moves.push({ row: row + direction, col: col - 1 });
    }

    // Capture diagonally right
    if (col < 7 && board[row + direction][col + 1] !== '' && opponentColor.includes(board[row + direction][col + 1])) {
        moves.push({ row: row + direction, col: col + 1 });
    }

    return moves;
}

function getRookMoves(row, col) {
    return getLinearMoves(row, col, [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }]);
}

function getBishopMoves(row, col) {
    return getLinearMoves(row, col, [{ row: 1, col: 1 }, { row: 1, col: -1 }, { row: -1, col: 1 }, { row: -1, col: -1 }]);
}

function getQueenMoves(row, col) {
    return [
        ...getRookMoves(row, col),
        ...getBishopMoves(row, col)
    ];
}

function getKingMoves(row, col) {
    const kingMoves = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];

    return kingMoves
        .map(move => ({ row: row + move.row, col: col + move.col }))
        .filter(({ row: newRow, col: newCol }) => newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && (board[newRow][newCol] === '' || board[newRow][newCol].toLowerCase() !== board[row][col].toLowerCase()));
}

function getKnightMoves(row, col) {
    const knightMoves = [
        { row: -2, col: -1 }, { row: -2, col: 1 }, { row: -1, col: -2 }, { row: -1, col: 2 },
        { row: 1, col: -2 }, { row: 1, col: 2 }, { row: 2, col: -1 }, { row: 2, col: 1 }
    ];

    return knightMoves
        .map(move => ({ row: row + move.row, col: col + move.col }))
        .filter(({ row: newRow, col: newCol }) => newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && (board[newRow][newCol] === '' || board[newRow][newCol].toLowerCase() !== board[row][col].toLowerCase()));
}

function getLinearMoves(row, col, directions) {
    const moves = [];
    const piece = board[row][col].toLowerCase();

    directions.forEach(direction => {
        let newRow = row + direction.row;
        let newCol = col + direction.col;

        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (board[newRow][newCol] === '') {
                moves.push({ row: newRow, col: newCol });
            } else if (board[newRow][newCol].toLowerCase() !== piece) {
                moves.push({ row: newRow, col: newCol });
                break;
            } else {
                break;
            }

            newRow += direction.row;
            newCol += direction.col;
        }
    });

    return moves;
}



function makeMove(from, to) {
    socket.emit('newMove', { room: currentRoom, move: { from, to } });
}

function makeMoveFromServer(from, to) {
    console.log('Move from server:', from, to);
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = '';
    renderBoard();
}

function recievedMoveFromServer(from, to) {
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = '';
    renderBoard();
}


function processServerMoves(moves) {
    moves.forEach(move => {
        const from = move.from;
        const to = move.to;
        makeMoveFromServer(from, to);
    });
    renderBoard();
}

// function processServerMoves(moves) {
//     moves.forEach(move => {
//         const from = move.from;
//         const to = move.to;
//         makeMoveFromServer(from, to);
//     });
//     updateBoard();  // Call the update function to transition the new board state
// }

    
// Helper function to convert chess notation to coordinates
function convertNotationToCoords(notation) {
    const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(notation.slice(1)) - 1;
    return [row, col];
}

renderBoard();