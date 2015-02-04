app.controller('sideBarController', function($scope, $http) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;

  // USER GROUP DISPLAYS
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

  // CALENDAR ROUTES
  // display contents of single calendar
  $scope.displayCalendar = function(calendar) {
    $scope.text = 'N/A';
    $scope.selector = 3;

    $http.get('/calendar/id/' + calendar._id).
    success(function(data, status, headers, config) {
      $scope.selectedCalendar=angular.fromJson(data);
      $scope.title = $scope.selectedCalendar.name;
      console.log($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to get calendar data.';
    });    
  }
  // display contents of a single calendar you are owner of
  $scope.displayOwnerCalendar = function(calendar) {
    $scope.text = 'N/A';
    $scope.selector = 5;

    $http.get('/calendar/id/' + calendar._id).
    success(function(data, status, headers, config) {
      $scope.selectedCalendar=angular.fromJson(data);
      $scope.title = $scope.selectedCalendar.name;
      console.log($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to get calendar data.';
    });  
  }

  // pulls all calendars into $scope variable, getCalendarData() in index.js
  $scope.displayCalendars = function() {
    $scope.title = 'Calendars';
    $scope.text = '';
    $scope.selector = 2;
    
    $scope.$parent.getCalendarData();
  }
  // POST to create calendar
  $scope.createCalendar = function(calendarNameInput) {
    $http.post('/calendar', {name: calendarNameInput}).
    success(function(data, status, headers, config) {
      $scope.inputCalendarName = '';
      $scope.displayCalendars();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create calendar.';
    });
  }
  // delete calendar
  $scope.deleteCalendar = function(calendarIdInput) {
    $http.delete('/calendar/'+calendarIdInput).
    success(function(data, status, headers, config) {
      $scope.displayCalendars();
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete group.';
    });
  }

  // add users to modify users list
  $scope.addModUser = function() {
    console.log({modList: $scope.modUserList});
    $http.put('/calendar/modList/add/' + $scope.selectedCalendar._id, {modList: $scope.modUserList}).
    success(function(data, status, headers, config) {
      $scope.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to add user with modify.';
    });
    $scope.modUserList = [];
  }

  $scope.addModUsertoList = function() {
    var newModUserId = angular.copy($scope.inputModUserId);
    if($scope.modUserList) {
      $scope.modUserList.push(newModUserId);
    }
    else {
      $scope.modUserList = [newModUserId];
    }
    $scope.inputModUserId = '';
  }

  // delete users from modify users list
  $scope.removeModUser = function(modUserID) {
    $http.put('/calendar/modList/remove/' + $scope.selectedCalendar._id, {modList: [modUserID]}).
    success(function(data, status, headers, config) {
      $scope.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to remove user from modify.';
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

  // RULES ROUTES
  $scope.addUserIdToRule = function() {
    var newUserId = angular.copy($scope.userId);
    if($scope.newRule.userIds) {
      $scope.newRule.userIds.push(newUserId);
    }
    else {
      $scope.newRule.userIds = [newUserId];
    }
    $scope.userId = '';
  }

  $scope.addUserGroupIdToRule = function() {
    var newGroupId = angular.copy($scope.userGroupId);
    if($scope.newRule.userGroupIds) {
      $scope.newRule.userGroupIds.push(newGroupId);
    }
    else {
      $scope.newRule.userGroupIds = [newGroupId];
    }
    $scope.userGroupId = '';
  }

  $scope.addRule = function() {
    console.log($scope.newRule);
    $http.post('/rule/'+ $scope.selectedCalendar._id, $scope.newRule).
    success(function(data, status, headers, config) {
      $scope.displayOwnerCalendar($scope.selectedCalendar);
      $scope.newRule = {};
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to create rule.';
    });
  }

  $scope.deleteRule = function(ruleId) {
    $http.delete('/rule/'+ $scope.selectedCalendar._id + '/' + ruleId).
    success(function(data, status, headers, config) {
      $scope.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete rule.';
    });
  }

  //Event display
  $scope.displayEvents = function() {
    $scope.title = 'Events';
    $scope.selector = 4;
  }
});