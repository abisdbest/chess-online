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
    boardElement.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${getSquareColor(row, col)}`;
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];
            if (piece !== '') {
                const pieceImage = document.createElement('img');
                pieceImage.src = getPieceImage(piece);
                pieceImage.className = 'piece';
                square.appendChild(pieceImage);
            }

            square.addEventListener('click', handleSquareClick);

            if (possibleMoves.some(move => move.row === row && move.col === col)) {
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

    if (!selectedSquare) {
        if (board[row][col] !== '') {
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