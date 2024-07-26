// Chess game logic
let selectedSquare = null;
let possibleMoves = [];

function getValidMoves(row, col) {
    const piece = board[row][col];
    const moves = [];

    // Pawn moves
    if (piece.toLowerCase() === 'p') {
        const direction = piece === 'p' ? 1 : -1;

        // Forward move
        if (board[row + direction][col] === '') {
            moves.push({ row: row + direction, col });

            // Two-space forward move on first move
            if ((piece === 'p' && row === 1) || (piece === 'P' && row === 6)) {
                if (board[row + 2 * direction][col] === '') {
                    moves.push({ row: row + 2 * direction, col });
                }
            }
        }

        // Capture left
        if (col > 0 && board[row + direction][col - 1] !== '' && board[row + direction][col - 1].toLowerCase() !== piece) {
            moves.push({ row: row + direction, col: col - 1 });
        }

        // Capture right
        if (col < 7 && board[row + direction][col + 1] !== '' && board[row + direction][col + 1].toLowerCase() !== piece) {
            moves.push({ row: row + direction, col: col + 1 });
        }
    }

    // Rook moves
    if (piece.toLowerCase() === 'r') {
        for (let i = row + 1; i < 8; i++) {
            if (board[i][col] === '') {
                moves.push({ row: i, col });
            } else if (board[i][col].toLowerCase() !== piece) {
                moves.push({ row: i, col });
                break;
            } else {
                break;
            }
        }

        for (let i = row - 1; i >= 0; i--) {
            if (board[i][col] === '') {
                moves.push({ row: i, col });
            } else if (board[i][col].toLowerCase() !== piece) {
                moves.push({ row: i, col });
                break;
            } else {
                break;
            }
        }

        for (let j = col + 1; j < 8; j++) {
            if (board[row][j] === '') {
                moves.push({ row, col: j });
            } else if (board[row][j].toLowerCase() !== piece) {
                moves.push({ row, col: j });
                break;
            } else {
                break;
            }
        }

        for (let j = col - 1; j >= 0; j--) {
            if (board[row][j] === '') {
                moves.push({ row, col: j });
            } else if (board[row][j].toLowerCase() !== piece) {
                moves.push({ row, col: j });
                break;
            } else {
                break;
            }
        }
    }

    // Knight moves
    if (piece.toLowerCase() === 'n') {
        const knightMoves = [
            { row: -2, col: -1 },
            { row: -2, col: 1 },
            { row: -1, col: -2 },
            { row: -1, col: 2 },
            { row: 1, col: -2 },
            { row: 1, col: 2 },
            { row: 2, col: -1 },
            { row: 2, col: 1 }
        ];

        for (const move of knightMoves) {
            const newRow = row + move.row;
            const newCol = col + move.col;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (board[newRow][newCol] === '' || board[newRow][newCol].toLowerCase() !== piece) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    // Bishop moves
    if (piece.toLowerCase() === 'b') {
        const bishopDirections = [
            { row: -1, col: -1 },
            { row: -1, col: 1 },
            { row: 1, col: -1 },
            { row: 1, col: 1 }
        ];

        for (const direction of bishopDirections) {
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
        }
    }

    // Queen moves
    if (piece.toLowerCase() === 'q') {
        // Rook-like moves
        for (let i = row + 1; i < 8; i++) {
            if (board[i][col] === '') {
                moves.push({ row: i, col });
            } else if (board[i][col].toLowerCase() !== piece) {
                moves.push({ row: i, col });
                break;
            } else {
                break;
            }
        }

        for (let i = row - 1; i >= 0; i--) {
            if (board[i][col] === '') {
                moves.push({ row: i, col });
            } else if (board[i][col].toLowerCase() !== piece) {
                moves.push({ row: i, col });
                break;
            } else {
                break;
            }
        }

        for (let j = col + 1; j < 8; j++) {
            if (board[row][j] === '') {
                moves.push({ row, col: j });
            } else if (board[row][j].toLowerCase() !== piece) {
                moves.push({ row, col: j });
                break;
            } else {
                break;
            }
        }

        for (let j = col - 1; j >= 0; j--) {
            if (board[row][j] === '') {
                moves.push({ row, col: j });
            } else if (board[row][j].toLowerCase() !== piece) {
                moves.push({ row, col: j });
                break;
            } else {
                break;
            }
        }

        // Bishop-like moves
        const bishopDirections = [
            { row: -1, col: -1 },
            { row: -1, col: 1 },
            { row: 1, col: -1 },
            { row: 1, col: 1 }
        ];

        for (const direction of bishopDirections) {
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
        }
    }

    // King moves
    if (piece.toLowerCase() === 'k') {
        const kingMoves = [
            { row: -1, col: -1 },
            { row: -1, col: 0 },
            { row: -1, col: 1 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
            { row: 1, col: -1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 }
        ];

        for (const move of kingMoves) {
            const newRow = row + move.row;
            const newCol = col + move.col;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (board[newRow][newCol] === '' || board[newRow][newCol].toLowerCase() !== piece) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    return moves;
}