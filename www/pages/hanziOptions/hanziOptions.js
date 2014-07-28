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