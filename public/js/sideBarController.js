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
      console.log(data);
      $scope.userGroups = angular.fromJson(data).userGroups;
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  $scope.displayUserGroup = function(groupName) {
    $scope.title = groupName;
    $scope.text = 'N/A';
    $scope.selector = 1;
    
    $scope.selectedUserGroup = [];

    for(i=0; i < $scope.userGroups.length; i++) {
      if($scope.userGroups[i].name === groupName) {
        $scope.selectedUserGroup = $scope.userGroups[i];
        break;
      }
    }
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
    $scope.text = 'N/A';
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

  $scope.createGroup = function(groupNameInput) {
    $http.post('/usergroup', {groupName: groupNameInput, userEmails: []}).
    success(function(data, status, headers, config) {
      displayUserGroups();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create group.';
    });
  }

  $scope.addUserToGroup = function(userEmailInput) {
    $http.put('/usergroup/'+$scope.selectedUserGroup._id, {userEmails: [userEmailInput]}).
    success(function(data, status, headers, config) {
      $scope.displayUserGroup($scope.selectedUserGroup.name);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create group.';
    });
  }
});