
/**
 * OpenFB is a micro-library that lets you integrate your JavaScript application with Facebook.
 * OpenFB works for both BROWSER-BASED apps and CORDOVA/PHONEGAP apps.
 * This library has no dependency: You don't need (and shouldn't use) the Facebook SDK with this library. Whe running in
 * Cordova, you also don't need the Facebook Cordova plugin. There is also no dependency on jQuery.
 * OpenFB allows you to login to Facebook and execute any Facebook Graph API request.
 * @author Christophe Coenraets @ccoenraets
 * @version 0.4
 */
var openFB = (function () {

    var FB_LOGIN_URL = 'https://www.facebook.com/dialog/oauth',
        FB_LOGOUT_URL = 'https://www.facebook.com/logout.php',

        // By default we store fbtoken in sessionStorage. This can be overridden in init()
        tokenStore = window.sessionStorage,

        fbAppId = '648798351882921',

        context = window.location.pathname.substring(0, window.location.pathname.indexOf("/",2)),

        baseURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + context,

        oauthRedirectURL = baseURL + '/oauthcallback.html',

        logoutRedirectURL = baseURL + '/logoutcallback.html',

        // Because the OAuth login spans multiple processes, we need to keep the login callback function as a variable
        // inside the module instead of keeping it local within the login function.
        loginCallback,

        // Indicates if the app is running inside Cordova
        runningInCordova,

        // Used in the exit event handler to identify if the login has already been processed elsewhere (in the oauthCallback function)
        loginProcessed;

    console.log(oauthRedirectURL);
    console.log(logoutRedirectURL);

    document.addEventListener("deviceready", function () {
        runningInCordova = true;
    }, false);

    /**
     * Initialize the OpenFB module. You must use this function and initialize the module with an appId before you can
     * use any other function.
     * @param params - init paramters
     *  appId: The id of the Facebook app,
     *  tokenStore: The store used to save the Facebook token. Optional. If not provided, we use sessionStorage.
     */
    function init(params) {
        if (params.appId) {
            fbAppId = params.appId;
        } else {
            throw 'appId parameter not set in init()';
        }

        if (params.tokenStore) {
            tokenStore = params.tokenStore;
        }
    }

    /**
     * Checks if the user has logged in with openFB and currently has a session api token.
     * @param callback the function that receives the loginstatus
     */
    function getLoginStatus(callback) {
        var token = tokenStore['fbtoken'],
            loginStatus = {};
        if (token) {
            loginStatus.status = 'connected';
            loginStatus.authResponse = {token: token};
        } else {
            loginStatus.status = 'unknown';
        }
        if (callback) callback(loginStatus);
    }

    /**
     * Login to Facebook using OAuth. If running in a Browser, the OAuth workflow happens in a a popup window.
     * If running in Cordova container, it happens using the In-App Browser. Don't forget to install the In-App Browser
     * plugin in your Cordova project: cordova plugins add org.apache.cordova.inappbrowser.
     *
     * @param callback - Callback function to invoke when the login process succeeds
     * @param options - options.scope: The set of Facebook permissions requested
     * @returns {*}
     */
    function login(callback, options) {

        var loginWindow,
            startTime,
            scope = '';

        if (!fbAppId) {
            return callback({status: 'unknown', error: 'Facebook App Id not set.'});
        }

        // Inappbrowser load start handler: Used when running in Cordova only
        function loginWindow_loadStartHandler(event) {
            var url = event.url;
            if (url.indexOf("access_token=") > 0 || url.indexOf("error=") > 0) {
                // When we get the access token fast, the login window (inappbrowser) is still opening with animation
                // in the Cordova app, and trying to close it while it's animating generates an exception. Wait a little...
                var timeout = 600 - (new Date().getTime() - startTime);
                setTimeout(function () {
                    loginWindow.close();
                }, timeout > 0 ? timeout : 0);
                oauthCallback(url);
            }
        }

        // Inappbrowser exit handler: Used when running in Cordova only
        function loginWindow_exitHandler() {
            console.log('exit and remove listeners');
            // Handle the situation where the user closes the login window manually before completing the login process
            deferredLogin.reject({error: 'user_cancelled', error_description: 'User cancelled login process', error_reason: "user_cancelled"});
            loginWindow.removeEventListener('loadstop', loginWindow_loadStartHandler);
            loginWindow.removeEventListener('exit', loginWindow_exitHandler);
            loginWindow = null;
            console.log('done removing listeners');
        }

        if (options && options.scope) {
            scope = options.scope;
        }

        loginCallback = callback;
        loginProcessed = false;

//        logout();

        if (runningInCordova) {
            oauthRedirectURL = "https://www.facebook.com/connect/login_success.html";
        }

        startTime = new Date().getTime();
        loginWindow = window.open(FB_LOGIN_URL + '?client_id=' + fbAppId + '&redirect_uri=' + oauthRedirectURL +
            '&response_type=token&scope=' + scope, '_blank', 'location=no');

        // If the app is running in Cordova, listen to URL changes in the InAppBrowser until we get a URL with an access_token or an error
        if (runningInCordova) {
            loginWindow.addEventListener('loadstart', loginWindow_loadStartHandler);
            loginWindow.addEventListener('exit', loginWindow_exitHandler);
        }
        // Note: if the app is running in the browser the loginWindow dialog will call back by invoking the
        // oauthCallback() function. See oauthcallback.html for details.

    }

    /**
     * Called either by oauthcallback.html (when the app is running the browser) or by the loginWindow loadstart event
     * handler defined in the login() function (when the app is running in the Cordova/PhoneGap container).
     * @param url - The oautchRedictURL called by Facebook with the access_token in the querystring at the ned of the
     * OAuth workflow.
     */
    function oauthCallback(url) {
        // Parse the OAuth data received from Facebook
        var queryString,
            obj;

        loginProcessed = true;
        if (url.indexOf("access_token=") > 0) {
            queryString = url.substr(url.indexOf('#') + 1);
            obj = parseQueryString(queryString);
            tokenStore['fbtoken'] = obj['access_token'];
            if (loginCallback) loginCallback({status: 'connected', authResponse: {token: obj['access_token']}});
        } else if (url.indexOf("error=") > 0) {
            queryString = url.substring(url.indexOf('?') + 1, url.indexOf('#'));
            obj = parseQueryString(queryString);
            if (loginCallback) loginCallback({status: 'not_authorized', error: obj.error});
        } else {
            if (loginCallback) loginCallback({status: 'not_authorized'});
        }
    }

    /**
     * Logout from Facebook, and remove the token.
     * IMPORTANT: For the Facebook logout to work, the logoutRedirectURL must be on the domain specified in "Site URL" in your Facebook App Settings
     *
     */
    function logout(callback) {
        var logoutWindow,
            token = tokenStore['fbtoken'];

        /* Remove token. Will fail silently if does not exist */
        tokenStore.removeItem('fbtoken');

        if (token) {
            logoutWindow = window.open(FB_LOGOUT_URL + '?access_token=' + token + '&next=' + logoutRedirectURL, '_blank', 'location=no');
            if (runningInCordova) {
                setTimeout(function() {
                    logoutWindow.close();
                }, 700);
            }
        }

        if (callback) {
            callback();
        }

    }

    /**
     * Lets you make any Facebook Graph API request.
     * @param obj - Request configuration object. Can include:
     *  method:  HTTP method: GET, POST, etc. Optional - Default is 'GET'
     *  path:    path in the Facebook graph: /me, /me.friends, etc. - Required
     *  params:  queryString parameters as a map - Optional
     *  success: callback function when operation succeeds - Optional
     *  error:   callback function when operation fails - Optional
     */
    function api(obj) {

        var method = obj.method || 'GET',
            params = obj.params || {},
            xhr = new XMLHttpRequest(),
            url;

        params['access_token'] = tokenStore['fbtoken'];

        url = 'https://graph.facebook.com' + obj.path + '?' + toQueryString(params);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (obj.success) obj.success(JSON.parse(xhr.responseText));
                } else {
                    var error = xhr.responseText ? JSON.parse(xhr.responseText).error : {message: 'An error has occurred'};
                    if (obj.error) obj.error(error);
                }
            }
        };

        xhr.open(method, url, true);
        xhr.send();
    }

    /**
     * Helper function to de-authorize the app
     * @param success
     * @param error
     * @returns {*}
     */
    function revokePermissions(success, error) {
        return api({method: 'DELETE',
            path: '/me/permissions',
            success: function () {
                tokenStore['fbtoken'] = undefined;
                success();
            },
            error: error});
    }

    function parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString),
            obj = {},
            params = qs.split('&');
        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    }

    function toQueryString(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    // The public API
    return {
        init: init,
        login: login,
        logout: logout,
        revokePermissions: revokePermissions,
        api: api,
        oauthCallback: oauthCallback,
        getLoginStatus: getLoginStatus
    }

}());

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $compileProvider) {

  
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file):/);
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file):/);

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    // Each tab has its own nav history stack:

    .state('frontPage', {
      url: '/',
      templateUrl: 'frontPage/frontPage.html',
      controller: 'FrontPageCtrl'
    })

    .state('friends', {
      url: '/friends',
      templateUrl: 'pages/friends/friends.html',
      controller: 'FriendsCtrl'
    })

    .state('game', {
      url: '/game',
      templateUrl: 'pages/game/game.html',
      controller: 'GameCtrl'
    })

    .state('results', {
      url: '/results',
      templateUrl: 'pages/results/results.html',
      controller: 'ResultsCtrl'
    })
    
    .state('hanziOptions', {
      url: '/hanziOptions',
      templateUrl: 'pages/hanziOptions/hanziOptions.html',
      controller: 'HanziOptionsCtrl'
    })

    .state('deckOptions', {
      url: '/deckOptions',
      templateUrl: 'pages/deckOptions/deckOptions.html',
      controller: 'DeckOptionsCtrl'
    })

    .state('logout', {
      url: '/logout',
      controller: 'LogoutCtrl'
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});


angular.module('starter.controllers', ['starter.frontPage', 'starter.friends', 'starter.game', 'starter.results', 'starter.hanziOptions', 'starter.deckOptions'])

.controller('MenuController', function ($scope, MenuService) {
  // "MenuService" is a service returning mock data (services.js)
  $scope.list = MenuService.all();
  //Get the user's name from local storage to show on sidebar
  $scope.user = localStorage.getItem('FBuserName') || "";
})
.controller('LogoutCtrl', function ($scope, $state) {
  // Check if this works when deployed!
  openFB.logout(function(){
    window.localStorage.clear();
    $state.go('frontPage');
  })
})
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
    })
    .then(function(resp){
      return resp.data;
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
      method: 'POST',
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

.factory('Auth', function ($http, $state, $window) {
  //authorization is currently nonfunctional
  var signin = function (userinfo) {
    return $http({
      method: 'POST',
      url: '/api/users/signin',
      data: userinfo
    })
    .then(function (resp) {
      return resp.data;
    });
  };

  var checkLoginStatus = function (callback) {
    openFB.getLoginStatus(function(resp) {
      if (resp.status === "connected") {
        callback();
      } else {
        $state.go('frontPage');
      }
    })
  };

  return {
    signin: signin,
    checkLoginStatus: checkLoginStatus
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

angular.module('starter.frontPage', [])
.controller('FrontPageCtrl', function($scope, $state, $window, Auth, User) {

  openFB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      $state.go('friends');
    } else {
      $scope.login = function(){
        openFB.login(function(response) {
          if(response.status === 'connected') {
            openFB.api({path: '/me', success: function(data){
              window.localStorage.setItem('FBuserID', data.id);
              window.localStorage.setItem('FBuserName', data.name);
              window.localStorage.setItem('FBuserLocale', data.locale);
              openFB.api({
                path: '/me/picture',
                params: {redirect:false},
                success: function(data) {
                  window.localStorage.setItem('FBuserPic', data.data.url);
                  $state.go('friends');
                },
                error: function(err) {console.log(err);}
              });
            }, error: function(err) {console.log(err);}});
          } else {
            alert('Facebook login failed: ' + response.error);
          }
        }, {scope: 'email, user_friends'});
      };
    }
  })


});



angular.module('starter.deckOptions', [])
.controller('DeckOptionsCtrl', function($scope, $state) {
  $scope.enter = function() {
    $state.go('tab.account');
  };
});
angular.module('starter.friends', [])

//The controller for the friends page.
.controller('FriendsCtrl', function($scope, $state, $window, Friends, Game, LS, Auth, User) {

  Auth.checkLoginStatus(function() {
    $scope.getFriends = Friends.getFriends;
    $scope.makeGame = Game.makeGame;
    $scope.data = {};
    $scope.buttonText = {
      start: "Start Game",
      challenged: "Waiting for opponent",
      creator: "Accept Challenge"
    };

    var facebookId = localStorage.getItem('FBuserID');
    var facebookPic = localStorage.getItem('FBuserPic');
    $scope.data.user = localStorage.getItem('FBuserName') || "";


    if (facebookId === "undefined" || $scope.data.user === "undefined"){
      console.log("undefined user");
    } else {
      Auth.signin({facebookId: facebookId, username: $scope.data.user, image: facebookPic})
      .then(function(resp){
        return Friends.getChallenges(resp.facebookId);
      })
      .then(function(games){
        
        console.log(games);


        openFB.api({
          path: '/me/friends',
          success: function(data){
            $scope.data.friends = [];
            for(var i = 0; i < data.data.length; i++) {
              var thisFriend = data.data[i];
              User.userInfo(thisFriend.id)
              .then( function(friendData) {
                friendData.status = "start";
                for (var j = 0; j < games.length; j++){
                  if (games[j].challenged === friendData.facebookId) {
                    friendData.status = "challenged";
                    friendData.game = games[j];
                    break;
                  }
                  if (games[j].creator === friendData.facebookId){
                    friendData.status = "creator";
                    friendData.game = games[j];
                    break;
                  }
                }
                $scope.data.friends.push(friendData)
              })
            }
            $state.go('friends');
          },
          error: function(err) {
            window.localStorage.clear();
            window.sessionStorage.clear();
            $state.go('frontPage');
            console.log(err);
          }
        });
      });
    }

    $scope.toGame = function(friend) {
      //Disable make game button
      $scope.chosen = true;

      //Make game
      if (friend.status === "start") {
        var creator = localStorage.getItem('FBuserID') || "default";
        var conditions = {creator: creator, challenged: friend.facebookId};
        //console.log('conditions', conditions)
        $scope.makeGame(conditions).then(function(resp){
          console.log(resp.data);
          //Save game id
          $window.localStorage.setItem('currentGame', resp.data._id);
          // Get hanziOptions from local storage
          var hanziOptions = LS.getData();
          // if they exist, route to deck, else to hanzi
          if (hanziOptions) {
            $state.go('deckOptions');
          } else {
            $state.go('hanziOptions');
          }
        });
      } else {
        $window.localStorage.setItem('currentGame', friend.game._id);
        $state.go('game');
      }
    };
  });



});

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


angular.module('starter.hanziOptions', [])
.controller('HanziOptionsCtrl', function($scope, $state, LS, Auth) {
  Auth.checkLoginStatus(function() {
    $scope.value = LS.getData();
    $scope.options = [
      {title: 'Traditional', pinyin: 'fántǐzì', hanzi: '繁體字', code: 'tradHanzi'},
      {title: 'Simplified', pinyin: 'jiǎntizì ', hanzi: '简体字', code: 'simpleHanzi'},
      {title: 'Pinyin', pinyin: 'pīnyīn', hanzi: 'pīnyīn', code: 'pinyin'}
    ];
    $scope.latestData = function() {
  	 return LS.getData();
    };
    $scope.update = function(val) {
    	console.log('value', val);
    	return LS.setData(val);
    };
  });
});
angular.module('starter.results', [])
.controller('ResultsCtrl', function($scope, $state, $window) {
  //Grab game result from localstorage
  $scope.resultStatus = {};
  $scope.resultStatus.numCorrect = $window.localStorage.getItem('lastScore')

  $scope.return = function() {
    $state.go('friends');
  };
});


