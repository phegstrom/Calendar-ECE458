app.controller('sideBarController', function($scope, $http, $rootScope, modalService) {
  $scope.title = 'Select an Option';
  $scope.text = 'N/A';
  $scope.selector = -1;

  this.modalService = modalService;

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
    modalService.selectedCalendar = calendar;
    $rootScope.displayOtherCalendarModal();
  }
  // display contents of a single calendar you are owner of
  $scope.displayOwnerCalendar = function(calendar) {
    console.log(calendar);
    $scope.selectedCalendar = calendar;
    modalService.selectedCalendar = calendar;
    $rootScope.displayOwnedCalendarModal();
  }

  modalService.displayOwnerCalendar = $scope.displayOwnerCalendar;

  $scope.displayCalendars = function() {
    $scope.text = '';
    $scope.selector = 2;
  }

  // POST to create calendar
  $scope.createCalendar = function(calendarNameInput) {
    $http.post('/calendar', {name: calendarNameInput}).
    success(function(data, status, headers, config) {
      var calendarData = angular.fromJson(data);
      console.log(angular.fromJson(data));
      $scope.inputCalendarName = '';
      $scope.displayCalendars();

      calendarData.evType='success';
      calendarData.grouping='Owned Calendar';
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
    var modList = angular.copy($scope.modUserList);
    console.log($scope.modUserList);
    $http.put('/calendar/modList/add/' + $scope.selectedCalendar._id, {modList: modList}).
    success(function(data, status, headers, config) {
      $scope.selectedCalendar.modList = angular.copy(angular.fromJson(data));
      console.log(angular.fromJson(data));
      //console.log($scope.selectedCalendar);
      modalService.selectedCalendar = $scope.selectedCalendar;
      $scope.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to add user with modify.';
    });
    $scope.modUserList = [];
  }

  $scope.addModUsertoList = function() {
    var newModUserEmail = angular.copy($scope.inputModUserEmail);
    if($scope.modUserList) {
      $scope.modUserList.push(newModUserEmail);
    }
    else {
      $scope.modUserList = [newModUserEmail];
    }
    $scope.inputModUserEmail = '';
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

  $scope.movePud = function(pud, direction) {
    var movement = 0;
    if(direction == 'up'){
      movement = -1;
    }
    else if(direction == 'down') {
      movement = 1;
    }

    var oldPudIndex = $rootScope.pudList.indexOf(pud);

    if(oldPudIndex != -1) {

      if(oldPudIndex + movement >= 0 && oldPudIndex + movement < $rootScope.pudList.length) {
        var pudIds = [];
        var pudNames = [];

        for(var pudIndex=0; pudIndex < $rootScope.pudList.length; pudIndex++) {
          pudIds.push($rootScope.pudList[pudIndex]._id);
          pudNames.push($rootScope.pudList[pudIndex].description);
        }

        console.log(pudNames);
        console.log(pudIds);

        swap(pudIds, oldPudIndex, oldPudIndex + movement);
        swap(pudNames, oldPudIndex, oldPudIndex + movement);

        var pudIdContainer = {
          PUDs: pudIds
        };

        console.log(pudNames);
        console.log(pudIds);

        $http.put('/pud/user/reorder', pudIdContainer).
        success(function(data, status, headers, config) {
          console.log(data);
          swap($rootScope.pudList, oldPudIndex, oldPudIndex + movement);
        }).
        error(function(data, status, headers, config) {
          console.log('Failed to reorder PUDs');
        });
      }
    }
  }

  var removePud = function(pud) {
    var pudIndex = $rootScope.pudList.indexOf(pud);
    if(pudIndex != -1) {
      $rootScope.pudList.splice(pudIndex, 1);
    }
  }

  var swap = function(list, index1, index2) {
    var temp = list[index1];
    list[index1] = list[index2];
    list[index2] = temp;
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

    $http.put('/request/' + route + 'Edit/' + request._id, editNum).
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

  //TEMP CRAP HERE THAT NEEDS TO MOVE TO MODAL IN A BIT MAN
  $scope.deleteSignUpEvent = function(signupEvent) {
    $http.delete('/ssu/'+signupEvent._id).
    success(function(data, status, headers, config) {
      var signupIndex = $rootScope.slotSignupsCreated.indexOf(signupEvent);
      if(signupIndex>=0) {
        $rootScope.slotSignupsCreated.splice(signupIndex, 1);
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to delete signup event.');
    });
  }

  //Initialization
  populateUserGroups();
});