angular.module('starter.controllers', ['starter.frontPage', 'starter.friends', 'starter.game', 'starter.results', 'starter.hanziOptions', 'starter.deckOptions'])

.controller('MenuController', function ($scope, $location, MenuService) {
  // "MenuService" is a service returning mock data (services.js)
  $scope.list = MenuService.all();
  //Get the user's name from local storage to show on sidebar
  $scope.user = localStorage.getItem('FBuserName') || "";

  // $scope.goTo = function(page) {
  //   console.log('Going to ' + page);
  //   $location.url('/' + page);
  // };
})
.controller('LoginController', function ($scope, User) {
  $scope.navTitle = 'Log In';

  $scope.login = function(){
    openFB.login('public_profile', function(){
      // a little janky, but works for now
      window.location.href = window.location.origin + '/#/chats';
      User.userData();
      $scope.loginMain();
    },
    function(err){
      // maybe just throw this error?
      console.log(err);
    });
  };

})
.controller('UserController', function ($scope) {
  // somehow scope should be updated to have facebook name?
  // I think
  $scope.$root.loggedIn = false;

  $scope.logout = function(){
    openFB.logout();
    window.sessionStorage.clear();
    $scope.$root.loggedIn = false;
    console.log($scope.$root.loggedIn);
  };

  $scope.loginMain = function(){
    $scope.$root.loggedIn = true;
  };

});
