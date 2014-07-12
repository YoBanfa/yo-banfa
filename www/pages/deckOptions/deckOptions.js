angular.module('starter.deckOptions', [])
.controller('DeckOptionsCtrl', function($scope, $state) {
  $scope.enter = function() {
    $state.go('tab.account');
  };
});