app.controller('modalController', function($scope, $http, $modalInstance, $rootScope) {
  $scope.daysOfTheWeek = [
    {name: 'Sunday',
      number: 0},
    {name: 'Monday',
      number: 1},
    {name: 'Tuesday',
      number: 2},
    {name: 'Wednesday',
      number: 3},
    {name: 'Thursday',
      number: 4},
    {name: 'Friday',
      number: 5},
    {name: 'Saturday',
      number: 6},
  ];
  $scope.requestDetails = {};

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

  var defaultForm = {
    name: '',
    description: '',
    location: '',
    alerts: [],
    willRepeat: false,
    start: Date.parse('today'),
    end: Date.parse('today'),
    repeatMode: '',
    repeatCount: 0,
    calendar: null,
    weekdayRepeats: [false, false, false, false, false, false, false]
  }

  $scope.deleteSelectedEvent = function() {
    var selectedEventId = $rootScope.selectedEvent._id;
    var eventRequestId = $rootScope.selectedEvent.requestID;

    $http.delete('/event/'+$rootScope.selectedEvent._id).
    success(function(data, status, headers, config) {
      console.log('Event deleted: ' + selectedEventId);

      var calendarEventList = [];
      for(var i=0; i < $rootScope.events.length; i++) {
        if($rootScope.events[i].parentData._id == selectedEventId) {
          calendarEventList = $rootScope.getCalendar($rootScope.events[i].parentData.calendarId).events;
          $rootScope.events.splice(i, 1);
          i--;
        }
      }

      for(var calEventIndex = 0; calEventIndex < calendarEventList.length; calEventIndex++) {
        if(calendarEventList[calEventIndex]._id == selectedEventId) {
          calendarEventList.splice(calEventIndex, 1);
          break;
        }
      }

      if(eventRequestId) {
        for(var requestIndex=0; requestIndex < $rootScope.ownRequests.length; requestIndex++) {
          if(eventRequestId == $rootScope.ownRequests[requestIndex]._id) {
            $rootScope.ownRequests.splice(requestIndex, 1);
            break;
          }
        }
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Could not delete event: ' + $rootScope.selectedEvent._id);
    })

    $scope.cancel();
  }

  $scope.inviteUsers = function() {
    $scope.cancel();
    $rootScope.displayInviteUserModal();
  }

  $scope.sendEventData = function() {
    var eventDetails = $rootScope.eventDetails;
    eventDetails.calendar = eventDetails.calendar._id;
    if(eventDetails.alerts) {
      var newAlerts = [];
      for(var index = 0; index < eventDetails.alerts.length; index++) {
        var alert = new Object();
        alert = {time: new Date(eventDetails.alerts[index]), method: 'email'};
        newAlerts.push(alert);
      }
      eventDetails.alerts = newAlerts;
    }
    var repeats = {};
    if(eventDetails.willRepeat) {
      switch(eventDetails.repeatMode) {
        case 'Number':
          repeats.frequency = eventDetails.repeatCount;
          break;
        case 'End Date':
          repeats.endDate = eventDetails.repeatUntil;
          break;
        default:
          console.log('Repeat method not found.');
      }

      repeats.days = [];
      for(var day = 0; day < $scope.daysOfTheWeek.length; day++) {
        if(eventDetails.weekdayRepeats[day]) {
          console.log(day);
          repeats.days.push(Date.parse($scope.daysOfTheWeek[day].name));
        }
      }

      eventDetails.repeats = [repeats];
    }

    if(eventDetails.isPUD) {
      console.log('WE DID IT TEAM');
      eventDetails.evType='pud';
    }
    else {
      eventDetails.evType='regular';
    }

    var request = {};

    if(eventDetails._id) {
      request = $http.put('/event/'+eventDetails._id, eventDetails).
      success(function(data, status, headers, config) {
        var modifiedEvent = angular.fromJson(data);
        for(var eventIndex=0; eventIndex < $rootScope.events.length; eventIndex++) {
          if($rootScope.events[eventIndex].parentData._id == modifiedEvent._id) {
            modifiedEvent.type = eventDetails.type;
            modifiedEvent.canViewEvent = eventDetails.canViewEvent;
            modifiedEvent.canEditEvent = eventDetails.canEditEvent;
            modifiedEvent.calendarName = eventDetails.calendarName;
            modifiedEvent.calendarId = eventDetails.calendarId;
            var modifiedCalEvent = $rootScope.convertDBEventToCalEvent(modifiedEvent);
            console.log(modifiedCalEvent);
            $rootScope.events[eventIndex] = modifiedCalEvent;
          }
        }

        //If this event is tied to another user's request
        var ownRequestData = $rootScope.getOwnRequest(eventDetails.requestID);
        var otherRequestData = $rootScope.getOtherRequest(eventDetails.requestID);
        if(ownRequestData != null || otherRequestData != null) {
          $http.put('/request/edit/' + eventDetails._id, eventDetails).
          success(function(data, status, headers, config) {
            if(ownRequestData != null) {
              var editNumber = {
                editNum: ownRequestData.edits.length
              }
              $http.put('/request/approveEdit/' + eventDetails.requestID, editNumber).
              success(function(data, status, headers, config) {
                $rootScope.ownRequests[$rootScope.ownRequests.indexOf(ownRequestData)] = angular.fromJson(data);
              }).
              error(function(data, status, headers, config) {
                console.log('Could not automatically approve request edit.');
              });
            }
          }).
          error(function(data, status, headers, config) {
            console.log('Could not edit event request: ' + eventDetails.requestID);
          });
        }
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }
    else {
      request = $http.post('/event', eventDetails).
      success(function(data, status, headers, config) {
        var dBEvent = angular.fromJson(data);
        console.log(dBEvent);
        console.log(eventDetails);
        var owningCalendar = $rootScope.getCalendar(eventDetails.calendar);


        var tempCalendar = {
          events: [dBEvent],
          name: owningCalendar.name,
          _id: owningCalendar._id
        };
        $rootScope.setEventData(tempCalendar, owningCalendar.evType, true, true);

        var calEvent = $rootScope.convertDBEventToCalEvent(dBEvent);
        owningCalendar.events.push(calEvent);
        $rootScope.events.push(calEvent);
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }

    request.then(function() {
      $scope.eventForm.$setPristine();
      eventDetails = defaultForm;
    });

    $scope.cancel();
  }

  $scope.editSelectedEvent = function() {
    $rootScope.eventDetails = angular.copy($rootScope.selectedEvent);
    $rootScope.calendars.forEach(function(element, index, array) {
      if(element._id === $rootScope.selectedEvent.calendar) {
        $rootScope.eventDetails.calendar = element;
      }
    });
    $rootScope.displayCreateEventModal();
    $scope.cancel();
  }

  $scope.addAlert = function() {
    var newAlert = new Date($scope.alertTime);
    console.log(newAlert);
    console.log($scope.alertTime);
    if($rootScope.eventDetails.alerts) {
      $rootScope.eventDetails.alerts.push(newAlert);
    }
    else {
      $rootScope.eventDetails.alerts = [newAlert];
    }
  }

  $scope.removeAlert = function(time) {
    $rootScope.eventDetails.alerts = $rootScope.eventDetails.alerts.filter(function(alert){
      return alert != time;
    });
  }

  $scope.sendUserInvites = function() {
    var requestDetails = $scope.requestDetails;

    var invitedUsers = [];
    if (typeof requestDetails.userList != 'undefined') {
      for(var userIndex=0; userIndex < requestDetails.userList.length; userIndex++) {
        invitedUsers.push(requestDetails.userList[userIndex]);
      }
    }

    if (typeof requestDetails.userGroups != 'undefined') {
      for(var groupIndex=0; groupIndex < requestDetails.userGroups.length; groupIndex++) {
        for(var userIndex=0; userIndex < requestDetails.userGroups[groupIndex].users.length; userIndex++) {
          if(invitedUsers.indexOf(requestDetails.userGroups[groupIndex].users[userIndex].email) == -1) {
            invitedUsers.push(requestDetails.userGroups[groupIndex].users[userIndex].email);
          }
        }
      }
    }

    var addUsersRequest = {
      info: requestDetails.description,
      users: invitedUsers
    };

    $http.put('/request/addUsers/'+$rootScope.selectedEvent._id, addUsersRequest).
    success(function(data, status, headers, config) {
      var changedRequest = angular.fromJson(data);
      //Find the request
      //foundRequest=changedRequest
    }).
    error(function(data, status, headers, config) {
      console.log('Could not invite users to event.');
    });
    $scope.cancel();
  }

  $scope.addUserGroupToRequest = function() {
    var selectedGroup = $scope.selectedGroup;
    if($scope.requestDetails.userGroups) {
      if($scope.requestDetails.userGroups.indexOf(selectedGroup) == -1) {
        $scope.requestDetails.userGroups.push(selectedGroup);
      }
    }
    else {
      $scope.requestDetails.userGroups = [selectedGroup];
    }
  }

  $scope.removeUserGroupFromRequest = function(userGroup) {
    var groupIndex = $scope.requestDetails.userGroups.indexOf(userGroup);
    if(groupIndex != -1) {
      $scope.requestDetails.userGroups.splice(groupIndex, 1);
    }
  }

  $scope.addUserToRequest = function() {
    var newUser = $scope.userEmail;
    if($scope.requestDetails.userList) {
      if($scope.requestDetails.userList.indexOf(newUser) == -1) {
        $scope.requestDetails.userList.push(newUser);
      }
    }
    else {
      $scope.requestDetails.userList = [newUser];
    }
  }
  $scope.removeUserFromRequest  = function(userEmail) {
    var userIndex = $scope.requestDetails.userList.indexOf(userEmail);
    if(userIndex != -1) {
      $scope.requestDetails.userList.splice(userIndex, 1);
    }
  }

  $scope.convertDates = function(startDate, endDate) {
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    if (startDate.toDateString() == endDate.toDateString()) {
      var displayDate = startDate.toLocaleString('en-US', {weekday: 'short', month: 'long', day: 'numeric'});
      var startTime = startDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
      var endTime = endDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
      return displayDate + ', ' + startTime + ' - ' + endTime;
    }
    else {
      var end = endDate.toLocaleString('en-US', {weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'});
      var start = startDate.toLocaleString('en-US', {weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'})
      return start + ' - ' + end;
    }
  }

  //PUD Functions
  $scope.sendPudData = function(pudDetails) {
    pudDetails.time = parseInt(pudDetails.timeString);
    if(pudDetails.willRepeat) {
      pudDetails.interval = parseInt(pudDetails.intervalString);
    }

    console.log(pudDetails);

    var request = {};

    if(pudDetails._id) {
      request = $http.put('/pud/'+pudDetails._id, pudDetails).
      success(function(data, status, headers, config) {
        for(var pudIndex=0; pudIndex < $rootScope.pudList; pudIndex++) {
          if($rootScope.pudList[pudIndex]._id == pudDetails._id) {
            $rootScope.pudList[pudIndex].description = pudDetails.description;
            $rootScope.pudList[pudIndex].time = pudDetails.time;
            $rootScope.pudList[pudIndex].interval = pudDetails.interval;
          }
        }
      }).
      error(function(data, status, headers, config) {
        console.log('Could not edit PUD.');
      });
    }
    else {
      request = $http.post('/pud/createPUD', pudDetails).
      success(function(data, status, headers, config) {
        console.log(data);
        var newPud = angular.fromJson(data);
        
        $rootScope.pudList.push(newPud);
      }).
      error(function(data, status, headers, config) {
        console.log('Could not create PUD.');
      });
    }

    $scope.cancel();
  }
});