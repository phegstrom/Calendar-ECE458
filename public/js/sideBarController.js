app.controller('sideBarController', function($scope, $http) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;
  $scope.newRule = {};

  // USER GROUP DISPLAYS
  $scope.displayUserGroups = function() {
    $scope.text = '';
    $scope.selector = 0;
  }

  $scope.displayUserGroup = function(userGroup) {
    $scope.text = '';
    $scope.selector = 1;

    $scope.selectedUserGroup = userGroup;
  }

  // CALENDAR ROUTES
  // display contents of single calendar
  $scope.displayCalendar = function(calendar) {
    $scope.text = '';
    $scope.selector = 3;

    $scope.selectedCalendar = calendar;
  }
  // display contents of a single calendar you are owner of
  $scope.displayOwnerCalendar = function(calendar) {
    $scope.text = 'N/A';
    $scope.selector = 5;

    $scope.selectedCalendar = calendar;
  }

  $scope.displayCalendars = function() {
    $scope.text = '';
    $scope.selector = 2;
  }

  // POST to create calendar
  $scope.createCalendar = function(calendarNameInput) {
    $http.post('/calendar', {name: calendarNameInput}).
    success(function(data, status, headers, config) {
      var calendarData = angular.fromJson(data);
      $scope.inputCalendarName = '';
      $scope.displayCalendars();
      $scope.$parent.addCalendar(calendarData);
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
      $scope.$parent.deleteCalendar(calendarIdInput);
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
    var isConflicting = false;
    $scope.userGroups.forEach(function(group,index,array) {
      if($scope.inputUserGroup == group.name) {
        $scope.text = 'Failed to create group, a group with that name already exists.';
        isConflicting = true;
      }
    });

    if(!isConflicting) {
      var inputUserGroup = angular.copy($scope.inputUserGroup);
      $http.post('/usergroup', {groupName: $scope.inputUserGroup, userEmails: []}).
      success(function(data, status, headers, config) {
        $scope.displayUserGroups();
        $scope.userGroups.push(angular.fromJson(data));
      }).
      error(function(data, status, headers, config) {
        $scope.text = 'Failed to create group.';
      });
    }

    $scope.inputUserGroup = '';
  }
  $scope.deleteUserGroup = function(groupIdInput) {
    $http.delete('/usergroup/'+groupIdInput).
    success(function(data, status, headers, config) {
      $scope.displayUserGroups();

      for(var userGroupIndex=0; userGroupIndex < $scope.userGroups.length; userGroupIndex++) {
        if(groupIdInput == $scope.userGroups[userGroupIndex]._id) {
          $scope.userGroups.splice(userGroupIndex, 1);
          break;
        }
      }

    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete group.';
    });
  }

  $scope.addUserToGroup = function() {
    var nonUniqueUser = false;
    for(var userIndex=0; userIndex<$scope.selectedUserGroup.users.length; userIndex++) {
      if($scope.selectedUserGroup.users[userIndex].email == $scope.inputUserEmail) {
        nonUniqueUser = true;
      }
    }

    if(!nonUniqueUser) {
      $http.put('/usergroup/'+$scope.selectedUserGroup._id, {userEmails: [$scope.inputUserEmail]}).
      success(function(data, status, headers, config) {
        $scope.displayUserGroup($scope.selectedUserGroup);
        var userIds = angular.fromJson(data);
        var users = [];
        for(var idIndex=0; idIndex<userIds.length; idIndex++) {
          for(var userIndex=0; userIndex<$scope.$parent.userList.length; userIndex++) {
            if($scope.$parent.userList[userIndex]._id == userIds[idIndex]) {
              users.push($scope.$parent.userList[userIndex]);
            }
          }
        }
        $scope.selectedUserGroup.users = $scope.selectedUserGroup.users.concat(users);
      }).
      error(function(data, status, headers, config) {
        $scope.text = 'Failed to add user.';
      }).then(function(){
        $scope.inputUserEmail = '';
      });
    }
    else {
      $scope.inputUserEmail = '';
      $scope.text = 'Can\'t add user, user already in group.';
    }
  }
  $scope.deleteUserFromGroup = function(userEmailInput) {
    $http.post('/usergroup/delete/user/'+$scope.selectedUserGroup._id, {userEmails: [userEmailInput]}).
    success(function(data, status, headers, config) {
      console.log(data);
      $scope.displayUserGroup($scope.selectedUserGroup);
      var deletedUserIds = angular.fromJson(data);

      deletedUserIds.forEach(function(id, index, array) {
        for(var userIndex=0; userIndex<$scope.selectedUserGroup.users.length; userIndex++) {
          while(userIndex < $scope.selectedUserGroup.users.length && $scope.selectedUserGroup.users[userIndex]._id == id) {
            $scope.selectedUserGroup.users.splice(userIndex, 1);
          }
        }
      });
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to delete user.\n' + data;
    });
  }

  // RULES ROUTES
  $scope.addUserEmailToRule = function() {
    var newUserEmail = angular.copy($scope.userEmail);
    if($scope.newRule.userEmails) {
      $scope.newRule.userEmails.push(newUserEmail);
    }
    else {
      $scope.newRule.userEmails = [newUserEmail];
    }
    $scope.userEmail = '';
  }

  $scope.addUserGroupIdToRule = function() {
    var newGroupId = angular.copy($scope.userGroupId._id);
    if($scope.newRule.userGroupIds) {
      $scope.newRule.userGroupIds.push(newGroupId);
    }
    else {
      $scope.newRule.userGroupIds = [newGroupId];
    }
    $scope.userGroupId = {};
  }

  $scope.addRule = function() {
    if (typeof $scope.newRule.userGroupIds === "undefined") {
      $scope.newRule.userGroupIds = [];
    } else if (typeof $scope.newRule.userIds === "undefined") {
      $scope.newRule.userIds = [];
    }
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
    $http.delete('/rule/'+ ruleId + '/' + $scope.selectedCalendar._id).
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

  var populateUserGroups = function() {
    $http.get('/usergroup').
    success(function(data, status, headers, config) {
      $scope.userGroups = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  //Initialization
  populateUserGroups();
});