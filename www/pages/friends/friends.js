angular.module('starter.friends', [])

//The controller for the friends page.
.controller('FriendsCtrl', function($scope, $state, $window, Friends, Game, LS, Auth, User) {

  Auth.checkLoginStatus(function() {
    $scope.getFriends = Friends.getFriends;
    $scope.makeGame = Game.makeGame;
    $scope.data = {};

    var facebookId = localStorage.getItem('FBuserID');
    var facebookPic = localStorage.getItem('FBuserPic');
    $scope.data.user = localStorage.getItem('FBuserName') || "";

    Friends.getChallenges(facebookId)
    .then(function(games){
      console.log(games);
    })
    .catch(function(e){
      console.log(e);
    });

    if (facebookId === "undefined" || $scope.data.user === "undefined"){
      console.log("undefined user");
    } else {
      Auth.signin({facebookId: facebookId, username: $scope.data.user, image: facebookPic})
      .then(function(resp){

        openFB.api({
          path: '/me/friends',
          success: function(data){
            $scope.data.friends = [];
            for(var i = 0; i < data.data.length; i++) {
              var thisFriend = data.data[i];
              User.userInfo(thisFriend.id)
              .then( function(friendData) {
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
      var creator = localStorage.getItem('FBuserID') || "default";
      var conditions = {creator: creator, challenged: friend.facebookId};
      console.log('conditions', conditions)
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
    };
  });



});
