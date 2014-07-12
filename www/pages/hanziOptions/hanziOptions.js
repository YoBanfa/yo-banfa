angular.module('starter.hanziOptions', [])
.controller('HanziOptionsCtrl', function($scope, $state) {
  $scope.enter = function() {
    $state.go('tab.account');
  };
});