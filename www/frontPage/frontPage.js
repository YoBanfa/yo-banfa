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
