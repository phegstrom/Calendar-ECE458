app.controller('sideBarController', function($scope, $http) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;

  $scope.displayUserGroups = function() {
    $scope.title = 'User Groups';
    $scope.text = '';
    $scope.selector = 0;

    $http.get('/usergroup').
    success(function(data, status, headers, config) {
      $scope.userGroups = angular.fromJson(data).userGroups;
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.displayUserGroup = function(userGroup) {
    $scope.title = userGroup.name;
    $scope.text = '';
    $scope.selector = 1;

    $http.get('/usergroup/' + userGroup._id).
    success(function(data, status, headers, config) {
      $scope.selectedUserGroup=angular.fromJson(data);
      console.log(userGroup._id);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to get group data.';
    });
  }
  // display contents of single calendar -- won't work until server creates GET route
  $scope.displayCalendar = function(calendar) {
    $scope.title = calendar.title;
    $scope.text = 'N/A';
    $scope.selector = 2;
    
    $http.get('/calendar/' + calendar._id).
    success(function(data, status, headers, config) {
      $scope.selectedCalendar=angular.fromJson(data);
      console.log(calendar._id);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to get calendar data.';
    });
  }

  $scope.displayCalendars = function() {
    $scope.title = 'Calendars';
    $scope.text = '';
    $scope.selector = 2;
    
    $scope.$parent.getCalendarData();
  }

  $scope.createCalendar = function(calendarNameInput) {
    $http.post('/calendar', {name: calendarNameInput}).
    success(function(data, status, headers, config) {
      $scope.displayCalendars();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create calendar.';
    });
  }

  //User Group Manipulation
  $scope.createGroup = function() {
    $http.post('/usergroup', {groupName: $scope.inputUserGroup, userEmails: []}).
    success(function(data, status, headers, config) {
      $scope.displayUserGroups();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create group.';
    });

    $scope.inputUserGroup = '';
  }
  $scope.deleteUserGroup = function(groupIdInput) {
    $http.delete('/usergroup/'+groupIdInput).
    success(function(data, status, headers, config) {
      $scope.displayUserGroups();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete group.';
    });
  }

  $scope.addUserToGroup = function() {
    $http.put('/usergroup/'+$scope.selectedUserGroup._id, {userEmails: [$scope.inputUserEmail]}).
    success(function(data, status, headers, config) {
      $scope.displayUserGroup($scope.selectedUserGroup);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to add user.';
    });

    $scope.inputUserEmail = '';
  }
  $scope.deleteUserFromGroup = function(userEmailInput) {
    $http.post('/usergroup/delete/user/'+$scope.selectedUserGroup._id, {userEmails: [userEmailInput]}).
    success(function(data, status, headers, config) {
      console.log(data);
      $scope.displayUserGroup($scope.selectedUserGroup);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete user.\n' + data;
    });
  }
});