var app = angular.module('configSettings', []);
app.constant('configSettings', {
	'createUserApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/createUser',
	'authenticateUserApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/authenticateUser/',
	'startGameApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/startGame',
	'addFlagApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/addFlag',
	'addQuestionMarkApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/addQuestionMark',
	'playGameApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/playGame',
	'gamesApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/games/',
	'userGamesApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/games/users/'
 }); 

(function(angular) {
  'use strict';
angular.module('ngAppMinesweeperGame', ['configSettings']).controller('ngAppMinesweeperGameController', function($scope, $http, $interval, configSettings) {
	$scope.username = '';
	$scope.password = '';
	$scope.userId = '';
	$scope.gameId = '';

	$scope.rows = 10;
	$scope.cols = 10;
	$scope.mines = 50;

	$scope.gamesLoaded = false;

	$scope.game = {};
	$scope.timeSpent = '';
	$scope.time = '';
	$scope.showGames = false;
	$scope.showNewGame = false;
	$scope.userLogged = false;
	$scope.disableBoardConfiguration = false;
	$scope.gameOver = false;
	$scope.displayingAllGames = false;
	$scope.loading = false;
	$scope.flagSelected = 'flag';

	$scope.register = function() {
		let data = JSON.stringify({userName: $scope.username, password: $scope.password});
		$scope.loading = true;
		$http.post(configSettings.createUserApiEndpoint, data).then(function (response) {
			$scope.userId = response.data.id;
			$scope.loadUserGames();
			$scope.userLogged = true;
			$scope.loading = false;
		}, function (response) {
			$scope.loading = false;
			$scope.handleError(response, true);
		});
	}

	$scope.login = function() {
		$scope.loading = true;
		let data = JSON.stringify({userName: $scope.username, password: $scope.password});
		$http.post(configSettings.authenticateUserApiEndpoint, data).then(function (response) {
			$scope.userId = response.data.userId;
			$scope.userLogged = true;
			$scope.loading = false;
			$scope.loadUserGames();
		}, 
		function(response) {
			$scope.loading = false;
			$scope.handleError(response);
		});
	}

	$scope.history = function() {
		$scope.showGames = true;
		$scope.showNewGame = false;
		$scope.timeSpent = '';
		$scope.stopTimer();
		$scope.loadUserGames();
	}

	$scope.logout = function() {
		$scope.stopTimer();
		$scope.restart();
	}

	$scope.loadUserGames = function() {
		$scope.displayingAllGames = false;
		$http.get(configSettings.userGamesApiEndpoint + $scope.userId).then(function (response) {
				$scope.games = response.data;
				$scope.showGames = $scope.games.length > 0;
				$scope.showNewGame = !$scope.showGames;
			}, 
			function(response) {
				$scope.handleError(response);
			}
		);
	}

	$scope.startGame = function() {
		$scope.gameOver = false;

		let data = JSON.stringify({userId: $scope.userId, rows: $scope.rows, cols: $scope.cols, mines: $scope.mines});

		$http.post(configSettings.startGameApiEndpoint, data).then(function (response) {
			$scope.game = response.data;
			$scope.gameId = $scope.game.gameId;
			$scope.gameStarted = true;
			$scope.startTimer();
		}, function (response) {
			$scope.handleError(response, true);
		});
	};

	$scope.resume = function(gameId) {
		$scope.gameOver = false;
		$scope.gameId = gameId;
		$http.get(configSettings.gamesApiEndpoint + gameId).then(function (response) {
				$scope.game = response.data;
				$scope.showGames = false;
				$scope.showNewGame = !$scope.showGames;
				$scope.disableBoardConfiguration = true;
				$scope.rows = $scope.game.rows;
				$scope.cols = $scope.game.cols;
				$scope.mines = $scope.game.mines;
				$scope.startTimer();
			},
			function(response) {
				$scope.handleError(response);
			}
		);
	}

	$scope.cellClick = function(e, row, col) {
		if($scope.gameOver) return;

		e = e || window.event;
		
		let data = JSON.stringify({gameId: $scope.gameId, row: row, column: col});

		if(e.which == 3) { //add flag or question mark
			let endpoint = ($scope.flagSelected === 'flag') ? configSettings.addFlagApiEndpoint : configSettings.addQuestionMarkApiEndpoint;
			$http.post(endpoint, data).then(function (response) {
				$scope.game = response.data;
				console.log($scope.game.board);
			}, function (response) {
				$scope.handleError(response, true);
			});
		} else {
			$http.post(configSettings.playGameApiEndpoint, data).then(function (response) {
				$scope.game = response.data;
				if(! $scope.game.active) {
					if($scope.game.userWon) {
						$scope.gameState = 'Game over. You win!';
						alert("Victory, your are the best!");
					} else {
						alert("Sorry but you loss!!");
						$scope.gameState = 'Game over. You loss!';
					}
					$scope.disableBoardConfiguration = false;
					$scope.gameOver = true;
					$scope.stopTimer();
				}
			}, function (response) {
				$scope.handleError(response, true);
			});
		}	
	};

	$scope.restart = function() {
		$scope.showGames = false;
		$scope.showNewGame = false;
		$scope.userLogged = false;
		$scope.disableBoardConfiguration = false;
		$scope.gameState = '';
		$scope.timeSpent = '';
		$scope.game = {};
	};

	$scope.newConfiguration = function() {
		$scope.gameState = '';
		$scope.timeSpent = '';
		$scope.game = {};
		$scope.showGames = false; 
		$scope.showNewGame = true;
		$scope.disableBoardConfiguration = false;
	}

	$scope.loadGames = function() {
		$scope.displayingAllGames = true;
		$http.get(configSettings.gamesApiEndpoint).then(function (response) {
				$scope.games = response.data;
			}, 
			function(response) {
				$scope.handleError(response);
			}
		);
	}

	$scope.stopTimer = function() {
		if ($scope.timerInterval !== undefined) {
			$interval.cancel($scope.timerInterval);
		}
	};
	
	$scope.startTimer = function() {
		$scope.timeSpent = '';
		$scope.time = '';
		$scope.timerInterval = $interval(function() {
			let d = $scope.time;
			d = Number(d);
			var h = Math.floor(d / 3600);
			var m = Math.floor(d % 3600 / 60);
			var s = Math.floor(d % 3600 % 60);
		
			var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
			var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
			var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
			
			$scope.timeSpent = hDisplay + mDisplay + sDisplay; 
			$scope.time++;
		}, 1000);
	};

	$scope.handleError = function(response) {
		if(response.data != null) {
			let msg = response.data.message;
			if (msg != undefined || msg != '') {
				alert(msg);
			} else {
				alert('Internal Error');
			}
		} else {
			alert('Backend server down');
		}

	};

	$scope.appLoaded = true;
});
})(window.angular);
