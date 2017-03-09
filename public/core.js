const port = 8000;
const socket = io.connect(`http://78.24.222.242:${port}`);

const winVar = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4 ,8], [2,  4, 6]];

function getBoardState() {
	const allSquares = document.querySelectorAll('.square');
	const boardState = [];
	for (let i = 0; i < allSquares.length; i++) {
		boardState.push(allSquares[i].innerHTML);
	};
	return boardState
};

function checkWinner(boardState, winVar, playerSign, gameId) {
	for (let i = 0; i < winVar.length; i++) {
		if (
			(boardState[winVar[i][0]] === 'X') && (boardState[winVar[i][0]] === boardState[winVar[i][1]]) && (boardState[winVar[i][1]] === boardState[winVar[i][2]])
		) {
				socket.emit('client:playerWin', {playerSign, gameId});
			} else if (
				(boardState[winVar[i][0]] === 'O') && (boardState[winVar[i][0]] === boardState[winVar[i][1]]) && (boardState[winVar[i][1]] === boardState[winVar[i][2]])
			) {
				socket.emit('client:playerWin', {playerSign, gameId});
			} else if (
				boardState.indexOf('') === -1
			) {
				socket.emit('client:tieInGame', { gameId });
				break;
			}
	}
};

class App extends React.Component {
	constructor() {
		super();

		this.state = {
			isMainScreenVisible: true,
			isWaitUserScreenVisible: false,
			isJoinToGameScreenVisible: false,
			isBoardVisible: false,
			userName: '',
			userScore: 0,
			foeName: '',
			foeScore: 0,
			playerSign: '',
			gameId: '',
			boardState: ['', '', '', '', '', '', '', '', ''],
			currentTurn: '',
			gameIsOver: false,
			availableGames: []
		}

		this.handleClickStartBtn = this.handleClickStartBtn.bind(this);
		this.handleClickJoinBtn = this.handleClickJoinBtn.bind(this);
		this.handleClickJoinLink = this.handleClickJoinLink.bind(this);
		this.handleClickRestartBtn = this.handleClickRestartBtn.bind(this);
		this.onGameCreated = this.onGameCreated.bind(this);
		this.onGetPlayerTwoSign = this.onGetPlayerTwoSign.bind(this);
		this.onGetAvailableGamesList = this.onGetAvailableGamesList.bind(this);
		this.onGameStarted = this.onGameStarted.bind(this);
		this.onGameNotExist = this.onGameNotExist.bind(this);
		this.onGameIsFull = this.onGameIsFull.bind(this);
		this.onPlayerTurn = this.onPlayerTurn.bind(this);
		this.onPlayerWin = this.onPlayerWin.bind(this);
		this.onTieInGame = this.onTieInGame.bind(this);
		this.onRestartGame = this.onRestartGame.bind(this);
		this.onOnePlayerDisconnected = this.onOnePlayerDisconnected.bind(this);
	}

	componentDidMount() {
		socket.on('server:gameCreated', this.onGameCreated);
		socket.on('server:onGetPlayerTwoSign', this.onGetPlayerTwoSign);
		socket.on('server:availableGamesList', this.onGetAvailableGamesList);
		socket.on('server:gameStarted', this.onGameStarted);
		socket.on('server:gameNotExist', this.onGameNotExist);
		socket.on('server:gameIsFull', this.onGameIsFull);
		socket.on('server:onPlayerTurn', this.onPlayerTurn);
		socket.on('server:onPlayerWin', this.onPlayerWin);
		socket.on('server:onTieInGame', this.onTieInGame);
		socket.on('server:onRestartGame', this.onRestartGame);
		socket.on('server:onePlayerDisconnected', this.onOnePlayerDisconnected);
	}

	onGameCreated(data) {
		this.setState({
			isMainScreenVisible: false,
			isWaitUserScreenVisible: true,
			gameId: data.gameId,
			playerSign: data.playerOneSign
		});
		document.querySelector('.game-id').innerHTML = data.gameId;
	}

	onGetPlayerTwoSign(data) {
		this.setState({ playerSign: data.playerTwoSign });
	}

	onGetAvailableGamesList(data) {
		const availableGamesList = [];
		data.lobbyList.forEach(item => {
			availableGamesList.push({gameId: item.gameId, gameCreator: item.players.playerOne.name})
		});
		this.setState({ availableGames: availableGamesList });
	}

	onGameStarted(data) {
		const foeName = (this.state.userName === data.players.playerOne.name)
			? data.players.playerTwo.name
			: data.players.playerOne.name;
		this.setState({
			isWaitUserScreenVisible: false,
			isJoinToGameScreenVisible: false,
			isBoardVisible: true,
			gameIsOver: false,
			currentTurn: data.currentTurn,
			foeName: foeName,
			userScore: 0,
			foeScore: 0,
			boardState: ['', '', '', '', '', '', '', '', '']
		});
	}

	onGameNotExist() {
		alert('Sorry, but this game not exist...');
	}

	onGameIsFull() {
		alert('Sorry, but this game are full...');
	}

	onPlayerTurn(data) {
		this.setState({ boardState: data.boardState, currentTurn: data.currentTurn });
	}

	onPlayerWin(data) {
		if (this.state.playerSign === data.playerSign) {
			setTimeout(() => { alert('You win! Congratulations!') }, 250);
		} else {
			setTimeout(() => { alert('You loose, sorry') }, 250);
		};
		if (this.state.playerSign === data.players.playerOne.sign) {
			this.setState({
				gameIsOver: true,
				userScore: data.players.playerOne.score,
				foeScore: data.players.playerTwo.score });
		} else {
			this.setState({
				gameIsOver: true,
		  	userScore: data.players.playerTwo.score,
				foeScore: data.players.playerOne.score });
		};
	}

	onTieInGame() {
		this.setState({ gameIsOver: true });
		setTimeout(() => { alert('OMG! It is tie in game!') }, 250);
	}

	onRestartGame() {
		this.setState({
			gameIsOver: false,
			currentTurn: 'X',
			boardState: ['', '', '', '', '', '', '', '', '']
		})
	}

	onOnePlayerDisconnected() {
		alert('Sorry, but second player has been disconnected. You will be redirect to main game screen');
		this.setState({
			gameIsOver: true,
			isBoardVisible: false,
			isWaitUserScreenVisible: false,
			isJoinToGameScreenVisible: false,
			isMainScreenVisible: true });
	}

	handleClickStartBtn(userName) {
		socket.emit('client:hostCreateNewGame', { playerOneName: userName });
		this.setState({ userName });
	}

	handleClickJoinBtn(userName) {
		this.setState({
			isMainScreenVisible: false,
			isJoinToGameScreenVisible: true,
			userName
		});
		socket.emit('client:getPlayerTwoSign');
	}

	handleClickJoinLink(gameId) {
		socket.emit('client:playerJoinToGame', { gameId, playerTwoName: this.state.userName });
		this.setState({ gameId });
	}

	handleClickRestartBtn() {
		socket.emit('client:restartGame', { gameId: this.state.gameId });
	}

	render() {
		return (
			<div>
				<h1 className='game-header'>Tic Tac Toe Game</h1>
				{
					this.state.isMainScreenVisible
						? <MainScreen
								onClickStartBtn={ this.handleClickStartBtn }
								onClickJoinBtn={ this.handleClickJoinBtn } />
						: null
				}

				{ this.state.isWaitUserScreenVisible ? <WaitUserScreen /> : null }

				{
					this.state.isJoinToGameScreenVisible
						? <JoinToGameScreen
								availableGames={ this.state.availableGames }
						 		onClickJoinLink={ this.handleClickJoinLink } />
						: null
				}

				{
					this.state.isBoardVisible
						? <Board
								boardState={ this.state.boardState }
								currentTurn={ this.state.currentTurn }
								foeName={ this.state.foeName }
								foeScore={ this.state.foeScore }
								gameId={ this.state.gameId }
								gameIsOver={ this.state.gameIsOver }
							 	playerSign={ this.state.playerSign }
								userName={ this.state.userName }
								userScore={ this.state.userScore }
								onClickRestartBtn={ this.handleClickRestartBtn } />
						: null
				}
			</div>
		)
	}
};

class MainScreen extends React.Component {
	constructor() {
		super();

		this.clickStartBtn = this.clickStartBtn.bind(this);
		this.clickJoinBtn = this.clickJoinBtn.bind(this);
	}

	clickStartBtn() {
		if (this.usernameInput.value) {
			const userName = this.usernameInput.value;
			this.props.onClickStartBtn(userName);
		} else {
			alert('Please enter your name!');
		}
	}

	clickJoinBtn() {
		if (this.usernameInput.value) {
			const userName = this.usernameInput.value;
			this.props.onClickJoinBtn(userName);
		} else {
			alert('Please enter your name!');
		}
	}

	render() {
		return (
			<div className='main-screen__start-game-area'>
				<button
					className='start-game-btn'
					type='button'
					onClick={this.clickStartBtn} >create new game</button>
				<input
					autoFocus
					className='username-input'
					placeholder='Type your name...'
					ref={input => {this.usernameInput = input}}
					type='text' />
				<button
					className='join-game-btn'
					type='button'
					onClick={this.clickJoinBtn} >join to game</button>
			</div>
		)
	}
}

class WaitUserScreen extends React.Component {
	render() {
		return (
			<div id='wait-user-screen'>
				<div className='wait-user-text'>
					Please share this ID: <span className='game-id'></span>
				</div>
				<br />
				<img src='../../img/loader.svg' alt='loader image' />
			</div>
		)
	}
};

class JoinLink extends React.Component {
	constructor() {
		super();

		this.clickJoinLink = this.clickJoinLink.bind(this);
	}

	clickJoinLink(gameId) {
		this.props.onClickJoinLink(this.props.gameId);
	}

	render() {
		return (
			<tr
				className='joinlink-to-game'
				onClick={ this.clickJoinLink }>
				<td>{ this.props.gameId }</td>
				<td>{ this.props.gameCreator }</td>
			</tr>
		)
	}
}

class JoinToGameScreen extends React.Component {
	constructor() {
		super();
	}

	componentWillMount() {
		socket.emit('client:getAvailableGames');
	}

	render() {
		return (
			<div id='join-game-screen'>
				<h3>Select the game for play:</h3>
				<table>
					<tr>
						<th>Game ID</th>
						<th>Game creator</th>
					</tr>
				{
					this.props.availableGames.map(item => (
						<JoinLink
						 	gameId={ item.gameId }
							gameCreator={ item.gameCreator }
						 	onClickJoinLink={ this.props.onClickJoinLink } />)
					)
				}
			</table>
			</div>
		)
	}
};

class Board extends React.Component {
	constructor() {
		super();

		this.clickSquare = this.clickSquare.bind(this);
		this.clickRestartBtn = this.clickRestartBtn.bind(this);
	}

	clickSquare(event) {
		if (!this.props.gameIsOver) {
			if (this.props.currentTurn === this.props.playerSign) {
				if (event.target.innerHTML === '') {
				event.target.innerHTML = this.props.playerSign;
				socket.emit('client:playerTurn', {
					boardState: getBoardState(),
					gameId: this.props.gameId,
				 	playerSign: this.props.playerSign	});
				checkWinner(getBoardState(), winVar, this.props.playerSign, this.props.gameId);
				}
			}
		}
	}

	clickRestartBtn() {
		if (this.props.gameIsOver) {
			this.props.onClickRestartBtn();
		} else {
			alert('You have not completed this game...');
		}
	}

	render() {
		return (
			<div id='gameboard-screen'>
				<div className='players-info'>
					<div className='player-one-info'>
						<span>{ this.props.userName }</span>
						<br />
						<span className='scores-field-one'>{this.props.userScore}</span>
					</div>
					<div className='player-two-info'>
						<span>{ this.props.foeName }</span>
						<br />
						<span className='scores-field-two'>{this.props.foeScore}</span>
					</div>
				</div>

				<div className='board'>
					{
						this.props.boardState.map(item => (
							<div
								className='square'
								onClick={ this.clickSquare } >{item}</div>
						))
					}
				</div>

				<button
					className='restart-game-btn'
					onClick={ this.clickRestartBtn } >restart game</button>
			</div>
		)
	}
};



ReactDOM.render(
	<App />,
  document.getElementById('root')
);
