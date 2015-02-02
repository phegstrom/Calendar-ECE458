app.controller('sideBarController', function($scope, $http) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;

  $scope.displayUserGroups = function() {
    $scope.title = 'User Groups';
    $scope.text = 'N/A';
    $scope.selector = 0;

    $http.get('/usergroup').
    success(function(data, status, headers, config) {
      $scope.userGroups = angular.fromJson(data);
      //$scope.text = data;
      //$scope.userGroups = [{name: 'Bob'}, {name: 'Betty'}, {name: 'Quetzlcoatl'}];
      //Parse the object into a set of groups filled with users
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.displayUsers = function(groupName) {
    $scope.title = groupName;
    $scope.text = 'N/A';
    $scope.selector = 1;
    
    $scope.selectedUserGroup = null;

    for(i=0; i < $scope.userGroups.length; i++) {
      if($scope.userGroups[i].name === groupName) {
        $scope.selectedUserGroup = $scope.userGroups[i];
        break;
      }
    }
  }

  $scope.displayCalendarInfo = function() {
    $scope.title = 'Calendar Information';
    $scope.text = 'N/A';
    $scope.selector = 2;

    $http.get('/calendars').
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