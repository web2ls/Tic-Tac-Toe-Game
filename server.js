var express = require('express');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

var port = 8000;

server.listen(port, function() {
	console.log('Server has been started on 8000 port...');
});

var playerOneSign = 'X';
var playerTwoSign = 'O';
var lobbyList = [];

// function getRoomsCounter(obj) {
// 	var roomsCounter = 0;
// 	var serverRooms = obj;
// 	for (var key in obj) {
// 		roomsCounter++;
// 	};
// 	return roomsCounter
// };


io.on('connection', function(socket) {
	console.log('New user connected...');

	socket.on('client:hostCreateNewGame', function(data) {
		var gameId = Math.floor(Math.random() * 10000);
		socket.join(gameId);
		socket.emit('server:gameCreated', {gameId, playerOneSign});
		lobbyList.push({
			gameId: gameId,
			gameIsPlay: false,
			players: {
				playerOne: {
					name: data.playerOneName,
					score: 0,
					sign: 'X'
				}}
			});
		socket.broadcast.emit('server:availableGamesList', { lobbyList });	
	});

	socket.on('client:getPlayerTwoSign', function() {
		socket.emit('server:onGetPlayerTwoSign', { playerTwoSign });
	});

	socket.on('client:getAvailableGames', function() {
		socket.emit('server:availableGamesList', { lobbyList });
	});

	socket.on('client:playerJoinToGame', function(data) {
		if (io.nsps['/'].adapter.rooms[data.gameId]) {
			if (io.nsps['/'].adapter.rooms[data.gameId].length < 2) {
				var players = {};
				for (var i = 0; i < lobbyList.length; i++) {
					if (lobbyList[i].gameId.toString() === data.gameId.toString()) {
						lobbyList[i].gameIsPlay = true;
						lobbyList[i].players.playerTwo = {};
						lobbyList[i].players.playerTwo.name = data.playerTwoName;
						lobbyList[i].players.playerTwo.score = 0;
						lobbyList[i].players.playerTwo.sign = 'O';
						players.playerOne = lobbyList[i].players.playerOne;
						players.playerTwo = lobbyList[i].players.playerTwo;
					}
				};
				console.log(lobbyList);
				socket.join(data.gameId);
				io.sockets.in(data.gameId).emit('server:gameStarted', { currentTurn: playerOneSign, players });
			} else {
				socket.emit('server:gameIsFull');
			}
		} else {
			socket.emit('server:gameNotExist');
		}
	});

	socket.on('client:playerTurn', function(data) {
		var currentTurn = (data.playerSign === playerOneSign)
			? playerTwoSign
			: playerOneSign;
		io.sockets.in(data.gameId).emit('server:onPlayerTurn', { boardState: data.boardState, currentTurn });
	});

	socket.on('client:playerWin', function(data) {
		var players = {};
		for (var i = 0; i < lobbyList.length; i++) {
			if (lobbyList[i].gameId.toString() === data.gameId.toString()) {
				if (playerOneSign === data.playerSign) {
					lobbyList[i].players.playerOne.score++;
				} else {
					lobbyList[i].players.playerTwo.score++;
				};
				players.playerOne = lobbyList[i].players.playerOne;
				players.playerTwo = lobbyList[i].players.playerTwo;
			}
		};
		io.sockets.in(data.gameId).emit('server:onPlayerWin', { playerSign: data.playerSign, players });
	});

	socket.on('client:tieInGame', function(data) {
		io.sockets.in(data.gameId).emit('server:onTieInGame');
	});

	socket.on('client:restartGame', function(data) {
		io.sockets.in(data.gameId).emit('server:onRestartGame');
	});

	socket.on('disconnect', function() {
		console.log('user disconnected...');
		for (var i = 0; i < lobbyList.length; i++) {
			var gameId = lobbyList[i].gameId;
			var gameIsPlay = lobbyList[i].gameIsPlay;
			if (io.nsps['/'].adapter.rooms[gameId]) {
				if (io.nsps['/'].adapter.rooms[gameId].length < 2 && gameIsPlay === true) {
					console.log('yep one user in room');
					io.sockets.in(gameId).emit('server:onePlayerDisconnected');
				};
			};
			if (!io.nsps['/'].adapter.rooms[gameId]) {
				lobbyList.splice(i, 1);
			};
		};
		socket.broadcast.emit('server:availableGamesList', { lobbyList });
	});
});
