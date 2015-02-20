app.controller('bottomAreaController', function($scope, $http, $modalInstance, $rootScope) {
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
    end: Date.parse('tomorrow'),
    repeatMode: '',
    repeatCount: 0,
    calendar: null,
    weekdayRepeats: [false, false, false, false, false, false, false]
  }

  $scope.deleteSelectedEvent = function() {
    var selectedEventId = $rootScope.selectedEvent._id;

    $http.delete('/event/'+$rootScope.selectedEvent._id).
    success(function(data, status, headers, config) {
      console.log('Event deleted: ' + selectedEventId);

      var calendarEventList = [];
      for(var i=0; i < $rootScope.events.length; i++) {
        if($rootScope.events[i].parentData._id == selectedEventId) {
          calendarEventList = $rootScope.getCalendar($rootScope.events[i].parentData.calendar).events;
          $rootScope.events.splice(i, 1);
          i--;
        }
      }

      for(var calEventIndex = 0; calEventIndex < calendarEventList.length; calEventIndex++) {
        if(calendarEventList[i]._id == selectedEventId) {
          calendarEventList.splice(calEventIndex, 1);
          break;
        }
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Could not delete event: ' + $rootScope.selectedEvent._id);
    }).then(function(){
      $rootScope.updateLocalEvents();
    });

    $scope.cancel();
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
        var owningCalendar = $rootScope.getCalendar(dBEvent.calendar);

        var tempCalendar = {
          events: [dBEvent],
          name: owningCalendar.name,
          _id: owningCalendar._id
        };
        $rootScope.setEventData(tempCalendar, 'info', true, true);

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

      $rootScope.updateLocalEvents();
    });

    $scope.cancel();
  }

  $scope.addAlert = function() {
    var newAlert = new Date($rootScope.alertTime);
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

  $scope.inviteUsers = function() {
    var requestDetails = $scope.requestDetails;

    var invitedUsers = [];

    for(var userIndex=0; userIndex < requestDetails.userList.length; userIndex++) {
      invitedUsers.push(requestDetails.userList[userIndex]);
    }

    for(var groupIndex=0; groupIndex < requestDetails.userGroups.length; groupIndex++) {
      for(var userIndex=0; userIndex < requestDetails.userGroups[groupIndex].users.length; userIndex++) {
        if(invitedUsers.indexOf(requestDetails.userGroups[groupIndex].users[userIndex].email) == -1) {
          invitedUsers.push(requestDetails.userGroups[groupIndex].users[userIndex].email);
        }
      }
    }

    var addUsersRequest = {
      info: requestDetails.description,
      users: invitedUsers
    };

    $http.put('/request/addUsers/'+requestDetails.eventId, addUsersRequest).
    success(function(data, status, headers, config) {
      var changedRequest = angular.fromJson(data);
      //Find the request
      //foundRequest=changedRequest
    }).
    error(function(data, status, headers, config) {
      console.log('Could not invite users to event.');
    });
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
});