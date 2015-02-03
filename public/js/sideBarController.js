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
  // display contents of single calendar
  $scope.displayCalendar = function(calendarName) {
    $scope.title = calendarName;
    $scope.text = 'N/A';
    $scope.selector = 2;
    
    $scope.selectedCalendar = [];

    for(i=0; i < $scope.calendars.length; i++) {
      if($scope.calendars[i].name === calendarName) {
        $scope.selectedCalendar = $scope.calendars[i];
        break;
      }
    }
  }

  $scope.displayCalendars = function() {
    $scope.title = 'Calendar Information';
    $scope.text = '';
    $scope.selector = 2;

    $http.get('/calendars').
    success(function(data, status, headers, config) {
      $scope.calendars = angular.fromJson(data);
      console.log($scope.calendars);
      //Parse the object into a set of groups filled with users
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.createCalendar = function(calendarNameInput) {
    $http.post('/calendars', {name: calendarNameInput, owner: 'userID_fromsession?'}).
    success(function(data, status, headers, config) {
      displayCalendars();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create calendar.';
    });
  }

  //User Group Manipulation
  $scope.createGroup = function(groupNameInput) {
    $http.post('/usergroup', {groupName: groupNameInput, userEmails: []}).
    success(function(data, status, headers, config) {
      $scope.displayUserGroups();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create group.';
    });
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

  $scope.addUserToGroup = function(userEmailInput) {
    $http.put('/usergroup/'+$scope.selectedUserGroup._id, {userEmails: [userEmailInput]}).
    success(function(data, status, headers, config) {
      $scope.displayUserGroup($scope.selectedUserGroup);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to add user.';
    });
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