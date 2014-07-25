angular.module('starter.game', [])
.controller('GameCtrl', function($scope, $scope, $state, $window, Game) {
  //reset game
  $scope.gameStatus = {};
  $scope.gameStatus.counter = 0;
  $scope.gameStatus.numCorrect = 0;
  $scope.gameStatus.cards = [];
  $scope.gameStatus.hanziType = $window.localStorage.getItem('hanziOptions') || 'tradHanzi'

  //grab 3 random cards and the correct one
  $scope.shuffle = function(){
  	var tempPossibilities = [];
  	for (var i = 0; i < $scope.data.game.deck.length; i++){
  	  if (i !== $scope.gameStatus.counter)
  	    tempPossibilities.push($scope.data.game.deck[i]);
  	}
  	var tempCards = [];
  	for (var i = 0; i < 3; i++){
  	  var rng = Math.floor(Math.random() * tempPossibilities.length);
  	  tempCards.push(tempPossibilities[rng]);
  	  tempPossibilities.splice(rng, 1)
	}
	//Insert answer at random index
	var randomIndex = Math.floor(Math.random() * 4)
	var answer = $scope.data.game.deck[$scope.gameStatus.counter];
	tempCards.splice(randomIndex, 0, answer)
	$scope.gameStatus.cards = tempCards;
  }


  //Find game id from localStorage
  $scope.getGame = Game.getGame;
  $scope.data = {};
  $scope.data.gameId = $window.localStorage.getItem('currentGame'); 

  //Query database
  $scope.getGame($scope.data.gameId).then(function(resp){
    console.log(resp.data);
    $scope.data.game = resp.data;
    $scope.data.game.deck = resp.data.deck;
    $scope.shuffle()
  });

  //Activated on card click
  $scope.next = function(card){
  	//Increment score if correct
  	if (card === $scope.data.game.deck[$scope.gameStatus.counter]){
  	  $scope.gameStatus.numCorrect++
    }
    
    //Move to next card
  	$scope.gameStatus.counter++

  	//Stop at deck length
  	if ($scope.gameStatus.counter < $scope.data.game.deck.length){
  		$scope.shuffle()
  	} else {
  		//Store result on localStorage and update database
      //Creator will default to true because the oauth and user data structures are 
      //not yet complete
      var creator = $scope.data.game.creator === $window.localStorage.getItem('FBuserID');
  		$window.localStorage.setItem('lastScore', $scope.gameStatus.numCorrect);
      Game.update($scope.data.gameId, {
        lastScore: $scope.gameStatus.numCorrect, 
        creator: creator
      })
      .then(function(resp){
        console.log("Update response:")
        console.log(resp)
      })

      //Go to results page
  		$state.go('results');
  	}
  }
});

