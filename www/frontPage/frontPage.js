angular.module('starter.frontPage', [])
.controller('FrontPageCtrl', function($scope, $state, $window, Auth, User) {
  //temporary fix for oauth not working
  $scope.user = {};

  $scope.login = function(){
    openFB.login(function(response) {
      if(response.status === 'connected') {
        alert('Facebook login succeeded, got access token: ' + response.authResponse.token);
      } else {
        alert('Facebook login failed: ' + response.error);
      }
    }, {scope: 'email,read_stream,publish_stream'});


    openFB.api({path: '/me/friends', success: function(data){console.log(data);}, error: function(err) {console.log(err);}});
  };

  $scope.signin = function (isValid) {
    // if( !isValid ) { return; }
    // Auth.signup($scope.user)
    //   .then(function (token) {
    //     $window.localStorage.setItem('yobanfaUsername', $scope.user.username);
    //     $state.go('friends');
    //   })
    //   .catch(function (error) {
    //     alert("error");
    //   });
    console.log('signin!!!');
  };

  $scope.something = function(){
    console.log('something!!!');
  };

  $scope.$watch(localStorage['FBuserName'], function(newVal, oldVal){
    //Here your view content is fully loaded !!
    var id = localStorage.getItem('FBuserID');
    var name = localStorage.getItem('FBuserName');
    console.log('frontpage friend userID: ' + name +': ' + newVal);
  });

/*  $scope.enter = function() {
    $state.go('friends');
  };*/
});
