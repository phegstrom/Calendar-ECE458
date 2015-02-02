var app = angular.module('calendar', ['ui.router']);

app.run(function($rootScope, $http) {

});

// ui-router config settings for controllers
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
	// TODO: CREATE MORE STATES FOR VARIOUS CONTROLLERS AND ROUTES
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: '/home.html',
      controller: 'sideBarController'
    })
  $urlRouterProvider.otherwise('/');
}]);

// side bar controller
app.controller('sideBarController', [
	'$scope',
	'$http',
	function($scope, $http) {
		$scope.title = 'Select an Option';
		$scope.text = 'N/A';

		$scope.displayUserGroups = function() {
			$scope.title = 'User Groups';
			$scope.text = 'N/A';

			$http.get('/usergroup').
			success(function(data, status, headers, config) {
			  $scope.text = angular.fromJson(data);
			  //Parse the object into a set of groups filled with users
			}).
			error(function(data, status, headers, config) {
			  // called asynchronously if an error occurs
			  // or server returns response with an error status.
			});
		}
}]);

// TODO: ADD CONTROLLERS AND ALL RELEVANT $http METHODS