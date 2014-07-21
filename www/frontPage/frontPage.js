angular.module('starter.frontPage', [])
.controller('FrontPageCtrl', function($scope, $state, $window, Auth, User) {
  //temporary fix for oauth not working
  $scope.user = {};

  $scope.login = function(){
    openFB.login('public_profile', function(){
      // a little janky, but works for now
      window.location.href = window.location.origin + '/#/friends';
      User.userData();
      $scope.loginMain();
    },
    function(err){
      // maybe just throw this error?
      console.log(err);
    });
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
