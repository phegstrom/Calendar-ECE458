app.controller('bottomAreaController', function($scope, $http) {
  $scope.title = '';
  $scope.text = 'FFFAAAAACKING';
  $scope.selector = 1;

  $scope.sendEventData = function(postData) {
    $http.post('/events', postData).
    success(function(data, status, headers, config) {
      $scope.text = angular.fromJson(data);
      //Parse the object into a set of groups filled with users
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }
});