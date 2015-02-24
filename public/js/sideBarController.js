app.controller('sideBarController', function($scope, $http, $rootScope) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;
  $scope.newRule = {};

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

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
    $rootScope.userGroups.forEach(function(group,index,array) {
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
        $rootScope.userGroups.push(angular.fromJson(data));
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

      for(var userGroupIndex=0; userGroupIndex < $rootScope.userGroups.length; userGroupIndex++) {
        if(groupIdInput == $rootScope.userGroups[userGroupIndex]._id) {
          $rootScope.userGroups.splice(userGroupIndex, 1);
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
    if($scope.newRule.userIds) {
      $scope.newRule.userIds.push(newUserEmail);
    }
    else {
      $scope.newRule.userIds = [newUserEmail];
    }
    $scope.userEmail = '';
  }

  $scope.addUserGroupToRule = function() {
    var newGroupId = angular.copy($scope.userGroup._id);
    if($scope.newRule.userGroupIds) {
      $scope.userGroupDisplay.push($scope.userGroup.name);
      $scope.newRule.userGroupIds.push(newGroupId);
    }
    else {
      $scope.userGroupDisplay = [$scope.userGroup.name];
      $scope.newRule.userGroupIds = [newGroupId];
    }
    $scope.userGroup = {};
  }

  $scope.addRule = function() {
    if (typeof $scope.newRule.userGroupIds === "undefined") {
      $scope.newRule.userGroupIds = [];
    } else if (typeof $scope.newRule.userIds === "undefined") {
      $scope.newRule.userIds = [];
    }
    console.log($scope.newRule);
    console.log($scope.selectedCalendar);

    $http.post('/rule/'+ $scope.selectedCalendar._id, $scope.newRule).
    success(function(data, status, headers, config) {
      $scope.newRule._id = angular.fromJson(data)._id;
      $scope.displayOwnerCalendar($scope.selectedCalendar);
      $scope.selectedCalendar.rules.push(angular.copy($scope.newRule));
      $scope.newRule = {};
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to create rule.');
    });
  }

  $scope.deleteRule = function(ruleId) {
    console.log(ruleId);
    console.log($scope.selectedCalendar);
    $http.delete('/rule/'+ ruleId + '/' + $scope.selectedCalendar._id).
    success(function(data, status, headers, config) {

      for(var deleteRuleIndex = 0; deleteRuleIndex < $scope.selectedCalendar.rules.length; deleteRuleIndex++) {
        if($scope.selectedCalendar.rules[deleteRuleIndex]._id == ruleId) {
          $scope.selectedCalendar.rules.splice(deleteRuleIndex, 1);
          break;
        }
      }

      $scope.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to delete rule.');
    });
  }

  //PUD event display
  $scope.displayPUDEvents = function() {
    $scope.selector = 4;
  }

  $scope.completePud = function(pud) {
    $http.post('/pud/' + pud._id).
    success(function(data, status, headers, config) {
      removePud(pud);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to complete PUD');
    });
  }

  $scope.deletePud = function(pud) {
    $http.delete('/pud/' + pud._id).
    success(function(data, status, headers, config) {
      removePud(pud);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to delete PUD');
    })
  }

  var removePud = function(pud) {
    var pudIndex = $rootScope.pudList.indexOf(pud);
    if(pudIndex != -1) {
      $rootScope.pudList.splice(pudIndex, 1);
    }
  }

  //User group display?
  var populateUserGroups = function() {
    $http.get('/usergroup').
    success(function(data, status, headers, config) {
      $rootScope.userGroups = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  //Request display
  $scope.displayInvites = function() {
    $scope.selector = 6;
  }
  $scope.acceptRequest = function(request, requestCalendar) {
    var calendarSelection = requestCalendar;

    var calendarID = {
        calendarId: calendarSelection._id
      };

    $http.put('/request/accept/'+ request._id, calendarID).
    success(function(data, status, headers, config) {
      var returnedRequest = angular.fromJson(data);
      returnedRequest.eventID = request.eventID;
      var dBEvent = returnedRequest.eventID;
      //Currently only allows adding to Owned Calendars
      $rootScope.setEventData(calendarSelection, "success", true, true, dBEvent);

      console.log(dBEvent);

      var calEvent = $rootScope.convertDBEventToCalEvent(dBEvent);

      for(var eventIndex=0; eventIndex < calendarSelection.events.length; eventIndex++) {
        if(calendarSelection.events[eventIndex]._id == dBEvent._id) {
          calendarSelection.events[eventIndex] = dBEvent;
        }
        else if(eventIndex == calendarSelection.events.length - 1) {
          calendarSelection.events.push(dBEvent);
        }
      }
      for(var eventIndex=0; eventIndex < $rootScope.events.length; eventIndex++) {
        if($rootScope.events[eventIndex].parentData._id == dBEvent._id) {
          $rootScope.events[eventIndex] = calEvent;
        }
        else if(eventIndex == $rootScope.events.length - 1) {
          $rootScope.events.push(calEvent);
        }
      }
      removeRequest(request);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to accept invite.';
      console.log(data);
      console.log(status);
      console.log(headers);
      console.log(config);
    });
  }

  $scope.declineRequest = function(request) {
    $http.put('/request/deny/'+ request._id).
    success(function(data, status, headers, config) {
      removeRequest(request);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to decline invite.';
    });
  }

  $scope.ignoreRequest = function(request) {
    $http.put('/request/remove/'+ request._id).
    success(function(data, status, headers, config) {
      removeRequest(request);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to ignore invite.';
    });
  }

  $scope.respondToRequestEdit = function(request, event, route) {
    var requestIndex = $rootScope.ownRequests.indexOf(request);
    var eventIndex = request.edits.indexOf(event);

    var editNum = {
      editNum: eventIndex
    };

    $http.put('/request/' + route + 'Edit/' + request._id,editNum).
    success(function(data, status, headers, config) {
      $rootScope.ownRequests[requestIndex].edits.splice(eventIndex, 1);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to ' + route + ' request edit.');
    });
  }

  var removeRequest = function(request) {
    for(requestIndex=0; requestIndex < $rootScope.pendingRequests.length; requestIndex++) {
        if(request._id == $rootScope.pendingRequests[requestIndex]._id) {
          $rootScope.pendingRequests.splice(requestIndex, 1);
          break;
        }
      }
  }

  //Initialization
  populateUserGroups();
});