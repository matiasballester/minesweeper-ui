var app = angular.module('configSettings', []);
app.constant('configSettings', {
	'startGameApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/startGame',
	'addFlagApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/addFlag',
	'playGameApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/playGame',
	'gamesApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/games/',
	'userGamesApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/games/user/',
	'gameApiEndpoint': 'https://mballester-minesweeper-api.herokuapp.com/minesweeper/game/'
 }); 

(function(angular) {
  'use strict';
angular.module('ngAppMinesweeperGame', ['configSettings']).controller('ngAppMinesweeperGameController', function($scope, $http, $interval, configSettings) {
	$scope.username = '';
	$scope.rows = 2;
	$scope.cols = 2;
	$scope.mines = 2;

	$scope.loadingGame = false;
	$scope.flagToggleOn = false;
	$scope.gamesLoaded = false;

	$scope.game = {};
	$scope.gameState = '';
	$scope.timeSpent = '';
	$scope.showGames = false;
	$scope.showNewGame = false;
	$scope.userLogged = false;
	$scope.disableBoardConfiguration = false;

	$scope.handleError = function(response) {
		let msg = response.data.message;
		if (response.status === -1) {
			alert('Destination unreachable.');
		} else if (msg != undefined || msg != '') {
			alert(msg);
		} else {
			alert('Internal Error');
		}
	};

	$scope.startGame = function() {
		$scope.timeSpent = '';
		$scope.loadingGame = true;

		let data = JSON.stringify({userName: $scope.username, rows: $scope.rows, cols: $scope.cols, mines: $scope.mines});

		$http.post(configSettings.startGameApiEndpoint, data).then(function (response) {
			$scope.game = response.data;
			console.log($scope.game.board);
			$scope.gameState = 'Game ongoing';
			$scope.gameStarted = true;
			$scope.loadingGame = false;
		}, function (response) {
			$scope.handleError(response, true);
			$scope.loadingGame = false;
		});
	};

	$scope.cellClick = function(e, row, col) {
		e = e || window.event;
		
		let data = JSON.stringify({userName: $scope.username, row: row, column: col});

		$scope.gameState = 'Playing the game!';

		if(e.which == 3) { //flag
			$http.post(configSettings.addFlagApiEndpoint, data).then(function (response) {
				$scope.game = response.data;
				console.log($scope.game.board);
			}, function (response) {
				$scope.handleError(response, true);
				$scope.loadingGame = false;
			});
		} else {
			let data = JSON.stringify({userName: $scope.username, row: row, column: col});
			$http.post(configSettings.playGameApiEndpoint, data).then(function (response) {
				$scope.game = response.data;
				if ($scope.game.state == 'LOST' || $scope.game.state == 'VICTORY') {
					if($scope.game.state == 'LOST') { 
						alert("Sorry but you loss!!");
						$scope.gameState = 'Game over. You loss!';
					} else {
						$scope.gameState = 'Game over. You win!';
						alert("Victory, your are the best!");
					}
					let res = Math.abs(new Date($scope.game.endTime) - new Date($scope.game.startTime)) / 1000;
					let hours = Math.floor(res / 3600) % 24;  
					let minutes = Math.floor(res / 60) % 60;
					let seconds = Math.floor(res % 60);  
					$scope.timeSpent = hours + "HH " + minutes + "MM "+ seconds + "SS";
					$scope.disableBoardConfiguration = false;
				}
			}, function (response) {
				$scope.handleError(response, true);
				$scope.loadingGame = false;
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
	}

	$scope.loadGames = function() {
		$http.get(configSettings.gamesApiEndpoint).then(function (response) {
				$scope.games = response.data;
			}, 
			function(response) {
				$scope.handleError(response);
			}
		);
	}

	$scope.loadUserGames = function() {
		$http.get(configSettings.userGamesApiEndpoint + $scope.username).then(function (response) {
				$scope.games = response.data;
				$scope.showGames = $scope.games.length > 0;
				$scope.showNewGame = !$scope.showGames;
			}, 
			function(response) {
				$scope.handleError(response);
			}
		);
	}

	$scope.login = function() {
		$scope.userLogged = true;
		$scope.loadUserGames();
	}
	
	$scope.logout = function() {
		$scope.restart();
	}

	$scope.resume = function(gameId) {
		$http.get(configSettings.gameApiEndpoint + gameId).then(function (response) {
				$scope.game = response.data;
				$scope.showGames = false;
				$scope.showNewGame = !$scope.showGames;
				$scope.disableBoardConfiguration = true;
				$scope.rows = $scope.game.board.length;
				$scope.cols = $scope.game.board[0].length;
			}, 
			function(response) {
				$scope.handleError(response);
			}
		);
	}
});
})(window.angular);
