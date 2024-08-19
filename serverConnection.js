const socket = io('https://quizizz-chess-server.onrender.com/');
let currentRoom = '';

function joinRoom(isReal = true) { 
    const room = document.getElementById('roomInput').value;
    if (room) {
        if (isReal) {
            currentRoom = room;
            socket.emit('joinRoom', room);
            resetBoard();  // Reset the board to the starting position
        } else {
            currentRoom = room;
            socket.emit('joinRoom', room);
            renderBoard()
        }
    }
}


function resetBoard() {
    const startingPosition = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            board[row][col] = startingPosition[row][col];
        }
    }
    renderBoard();
}


socket.on('gameState', (state) => {
    // document.getElementById('messages').innerHTML = JSON.stringify(state);
    processServerMoves(state.moves);
    if (boardOrientation == "white") {
        isCurrentlyUsersTurn = true;
    } else {
        isCurrentlyUsersTurn = false;
    }
});


socket.on('moveUpdate', (state) => {
    recievedMoveFromServer(state.move.from, state.move.to);
    console.log("update")
    isCurrentlyUsersTurn = !isCurrentlyUsersTurn;
});


function decodeMove(move) {
    return {
        from: move.from,
        to: move.to
    };
}

function sendMove(move) {
    const position = 'position after move'; // Replace with actual position data
    if (currentRoom && move) {
        socket.emit('newMove', { room: currentRoom, move, position });
    }
}