angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
 .factory('MenuService', function() {

  var menuItems = [
    { text: 'Home', iconClass: 'icon ion-map', link: 'friends'},
    { text: 'Friends', iconClass: 'icon ion-map', link: 'friends'},
    { text: 'Options', iconClass: 'icon ion-map', link: 'hanziOptions'},
    { text: 'Logout', iconClass: 'icon ion-map', link: 'logout'}
  ];

  return {
    all: function() {
      return menuItems;
    }
  };
})
 // Store hanziOptions in local storage
.factory('LS', function($window, $rootScope) {
  angular.element($window).on('storage', function(event) {
  if (event.key === 'hanziOptions') {
    $rootScope.apply();
  }
  });
  return {
  setData: function(val) {
      $window.localStorage && $window.localStorage.setItem('hanziOptions', val);
      return this;
  },
  getData: function() {
      return $window.localStorage && $window.localStorage.getItem('hanziOptions');
  }
  };
})

.factory('Friends', function($http) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [
    { id: 0, name: 'Scruff McGruff' },
    { id: 1, name: 'G.I. Joe' },
    { id: 2, name: 'Miss Frizzle' },
    { id: 3, name: 'Ash Ketchum' }
  ];

  //return entire list of friends
  var getFriends = function(user){
    //returns results of ajax get request to api/links
    return $http({
      method: 'GET',
      url: '/api/users/' + user + '/friendslist'
    });
  };

  //return all games which the user did not create
  var getChallenges = function(user){
    return $http({
      method: 'GET',
      url: '/api/users/' + user + '/challenges'
    });
  };

  //functions injected when Friends is injected
  return {
    //test function
    all: function() {
      return friends;
    },

    //actual functions
    getFriends: getFriends,
    getChallenges: getChallenges
  }
})

.factory('Game', function($http){
  //make a new game
  var makeGame = function(data){
    return $http({
      method: 'POST',
      data: data,
      url: '/api/games/creategame'
    })
  };

  //retrieve the cards for a game (for challenged player)
  var getGame = function(game){
    return $http({
      method: 'GET',
      url: '/api/games/' + game + '/getgame'
    })
  };

  //update game should return the scores.  It should also destroy
  //or mark the game as complete on the server side
  var update = function(game, data){
    return $http({
      method: 'PUT',
      data: data,
      url: '/api/games/' + game + '/updatescore'
    })
  };

  //functions injected when Game a parameter
  return {
    makeGame: makeGame,
    getGame: getGame,
    update: update
  }
})

.factory('DeckOptions', function($http) {
  // Might use a resource here that returns a JSON array
  // $http.get('/api/cards').success(function(cards) {
  //     $scope.cards = cards;
  //   });

  // Some fake testing data
  var decks = [
    { id: 0, name: 'HSK' },
    { id: 1, name: 'Custom1' },
    { id: 2, name: 'Custom2' },
    { id: 3, name: 'Custom3' }
  ];

  return {
    all: function() {
      return decks;
    }//,
    // get: function(deckId) {
    //   // Simple index lookup
    //   return deck[deckId];
    // }
  }
})

.factory('Auth', function ($http, $location, $window) {
  //authorization is currently nonfunctional
  var signin = function (userinfo) {
    return $http({
      method: 'POST',
      url: '/api/users/signin',
      data: userinfo
    })
    .then(function (resp) {
      return resp.data.token;
    });
  };

  return {
    signin: signin,
  };
})

.factory('User', function ($http){

  var userInfo = function(userID) {
    return $http({
      method: 'GET',
      url: '/api/users/' + userID,
    }).then(function(resp) {
      return resp.data;
    });
  };

  return {
    userInfo: userInfo
  };

});
