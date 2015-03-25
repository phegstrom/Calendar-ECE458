app.controller('modalController', function($scope, $http, $modalInstance, $rootScope) {

  var MINUTE = 1000*60; //ms * sec

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

  $scope.freeTimeDetails = {};

  $scope.ssuDetails = {};

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
              $http.put('/request/approveEdit/' + eventDetails.requestID, {editNum: editNumber}).
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
        $rootScope.setEventData(tempCalendar, owningCalendar.evType, true, true, dBEvent);
        dBEvent.alerts = eventDetails.alerts;

        var calEvent = $rootScope.convertDBEventToCalEvent(dBEvent);
        owningCalendar.events.push(dBEvent);
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
      var foundOwnRequest = false;
      for(var reqIndex=0; reqIndex < $rootScope.ownRequests.length; reqIndex++) {
        if($rootScope.ownRequests[reqIndex]._id == changedRequest._id) {
          $rootScope.ownRequests[reqIndex] = changedRequest._id;
          foundOwnRequest = true;
        }
      }

      //Don't update if the request is not yours
      for(var reqIndex=0; reqIndex < $rootScope.otherRequests.length; reqIndex++) {
          if($rootScope.otherRequests[reqIndex]._id == changedRequest._id) {
            $rootScope.otherRequests[reqIndex] = changedRequest._id;
            foundOwnRequest = true;
          }
        }

      if(!foundOwnRequest) {
        $rootScope.ownRequests.push(changedRequest);
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Could not invite users to event.');
    });
    $scope.cancel();
  }

  $scope.addUserGroupToRequest = function(details) {
    var selectedGroup = $scope.selectedGroup;
    if(details.userGroups) {
      if(details.userGroups.indexOf(selectedGroup) == -1) {
        details.userGroups.push(selectedGroup);
      }
    }
    else {
      details.userGroups = [selectedGroup];
    }
  }

  $scope.removeUserGroupFromRequest = function(userGroup, details) {
    var groupIndex = details.userGroups.indexOf(userGroup);
    if(groupIndex != -1) {
      details.userGroups.splice(groupIndex, 1);
    }
  }

  $scope.addUserToRequest = function(details) {
    var newUser = $scope.userEmail;
    if(details.userList) {
      if(details.userList.indexOf(newUser) == -1) {
        details.userList.push(newUser);
      }
    }
    else {
      details.userList = [newUser];
    }
  }
  $scope.removeUserFromRequest  = function(userEmail, details) {
    var userIndex = details.userList.indexOf(userEmail);
    if(userIndex != -1) {
      details.userList.splice(userIndex, 1);
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
    pudDetails.time = parseFloat(pudDetails.timeString);
    if(pudDetails.willRepeat) {
      pudDetails.interval = parseFloat(pudDetails.intervalString);
    }
    else {
      pudDetails.interval = 0;
    }

    if($rootScope.isValidTime(pudDetails.alertTime)) {
      pudDetails.alert = {
        time: pudDetails.alertTime,
        method: 'email'
      };
      pudDetails.alertInterv = parseFloat(pudDetails.alertRepeatString);
    }
    else {
      pudDetails.alertInterv = 0;
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

  // FIND FREE TIME SLOT ROUTES
  $scope.findFreeTimes = function() {
    var freeTimeDetails = $scope.freeTimeDetails;
    // time ranges

    if (typeof freeTimeDetails.recurrence == 'undefined') {
      $scope.freeTimeDetails.recurrence = 1;
    }
    if (typeof freeTimeDetails.userGroupIds == 'undefined') {
      freeTimeDetails.userGroupIds = [];
    }
    if (typeof freeTimeDetails.userEmails == 'undefined') {
      freeTimeDetails.userEmails = [];
    }
    $http.put('/ftr/findConflicts', freeTimeDetails).
    success(function(data, status, headers, config) {
      $scope.conflictSummary = angular.fromJson(data);
      console.log(conflictSummary);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to find free times.');
    });
    // NEED TO POPULATE SCOPE STUFF IN EVENT CREATION FROM TIMES
    $scope.cancel();
    $rootScope.displayConflictSummaryModal();
  }

  $scope.toggleConflictDetails = function(conflict) {
    if (typeof conflict.showDetails == 'undefined') {
      conflict.showDetails = true;
    }
    else {
      conflict.showDetails = !conflict.showDetails;
    }
  }

  $scope.addTimeSlot = function() {
    var timeSlot = {};
    timeSlot.startTime = angular.copy($scope.timeSlotStart);
    timeSlot.endTime = angular.copy($scope.timeSlotEnd);

    if($scope.freeTimeDetails.timeSlot) {
      $scope.freeTimeDetails.timeSlot.push(timeSlot);
    }
    else {
      $scope.freeTimeDetails.timeSlot = [timeSlot];
    }
    $scope.timeSlotStart = '';
    $scope.timeSlotEnd = '';
  }

  $scope.addUserGroupToFreeRequest = function() {
    var newGroupId = angular.copy($scope.userGroup._id);
    if($scope.freeTimeDetails.userGroupIds) {
      if($scope.freeTimeDetails.userGroupIds.indexOf(newGroupId) == -1) {
        $scope.freeUserGroupDisplay.push($scope.userGroup.name);
        $scope.freeTimeDetails.userGroupIds.push(newGroupId);
      }
    }
    else {
      $scope.freeUserGroupDisplay = [$scope.userGroup.name];
      $scope.freeTimeDetails.userGroupIds = [newGroupId];
    }
    $scope.userGroup = {};
  }

  $scope.addFreeUserToList = function() {
    var newFreeUserEmail = angular.copy($scope.freeUserEmail);
    if($scope.freeTimeDetails.userIds) {
      if($scope.freeTimeDetails.userIds.indexOf(newFreeUserEmail) == -1){
        $scope.freeTimeDetails.userIds.push(newFreeUserEmail);
      }
    }
    else {
      $scope.freeTimeDetails.userIds = [newFreeUserEmail];
    }
    $scope.freeUserEmail = '';
  }

  //SSU Functions
  $scope.addSectionToSsu = function(sectionStart, sectionEnd) {
    if($scope.ssuDetails.sections == undefined) {
      $scope.ssuDetails.sections = [];
    }

    var minutes = (sectionEnd - sectionStart) / MINUTE;

    console.log(minutes);

    if(minutes <= 0) {
      $scope.ssuDetails.sectionErrorText = 'Start time is not before end time.';
      return;
    }
    if($scope.ssuDetails.evMinDuration == undefined) {
      $scope.ssuDetails.sectionErrorText = 'Minimum sign-up time not set.';
      return;
    }
    if(minutes % $scope.ssuDetails.evMinDuration != 0) {
      $scope.ssuDetails.sectionErrorText = 'Interval is not a multiple of the minimum sign-up time.';
      return;
    }

    $scope.ssuDetails.sections.push({
      start: sectionStart,
      end: sectionEnd
    });
    $scope.ssuDetails.sectionErrorText = '';
  }

  $scope.removeSectionFromSsu = function(section) {
    var index = $scope.ssuDetails.sections.indexOf(section);

    if(index > 0) {
      $scope.ssuDetails.sections.splice(index, 1);
    }
    $scope.ssuDetails.sectionErrorText = '';
  }

  $scope.sendSsuData = function(ssuDetails) {
    //Convert sections into minimum slots, ensure that the minimum time is still valid in creation.
    var minimumTime = ssuDetails.evMinDuration;

    if(ssuDetails.evMaxDuration % minimumTime != 0) {
      $scope.ssuDetails.sectionErrorText = 'Maximum time is not a multiple of minimum time.';
      return;
    }
    if(ssuDetails.sections == undefined) {
      $scope.ssuDetails.sectionErrorText = 'No times were specified';
      return;
    }
    if(ssuDetails.userGroups == undefined) {
      ssuDetails.userGroups = [];
    }
    if(ssuDetails.userList == undefined) {
      ssuDetails.userList = [];
    }
    if(ssuDetails.description == undefined) {
      ssuDetails.description = '';
    }

    ssuDetails.evFreeBlocks = [];
    ssuDetails.sections.forEach(function(section, index, array) {
      var minutes = (section.end - section.start) / MINUTE;

      if(minutes % minimumTime != 0) {
        $scope.ssuDetails.sectionErrorText = 'A section is not a multiple of the minimum slot duration: ' + section.start.toLocaleString();
        ssuDetails.evFreeBlocks = undefined;
        return;
      }
      var dateBlockStart = new Date(section.start)
      while(section.end - dateBlockStart > 0) {
        var timeBlock = new Object();
        timeBlock.start = new Date(dateBlockStart);
        dateBlockStart = new Date(dateBlockStart.getTime() + minimumTime * MINUTE);
        if(dateBlockStart - timeBlock.start == 0) {
          return;
        }
        timeBlock.end = new Date(dateBlockStart);

        ssuDetails.evFreeBlocks.push(timeBlock);
      }
    });
    //Change the name of userList so the API is met
    ssuDetails.userEmails = ssuDetails.userList;
    //Change the name and values for userGroups so the API is met
    ssuDetails.userGroupIds = [];
    ssuDetails.userGroups.forEach(function(userGroup, index, array) {
      ssuDetails.userGroupIds.push(userGroup._id);
    });
    //Send data
    console.log(ssuDetails.evFreeBlocks);
    $http.post('/ssu', ssuDetails).
    success(function(data, status, headers, config) {
      $rootScope.slotSignupsCreated.push(angular.fromJson(data));
      $scope.ssuDetails = {};
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to create sign-up event.');
      $scope.ssuDetails = {};
    });
  }

  $scope.addTimeToSlot = function(timeRange, maxTime) {
    if($scope.currentTimeRange) {
      var newTimeRange = {};
      timeRange.start = new Date(timeRange.start);
      timeRange.end = new Date(timeRange.end);
      if(timeRange.end.getTime() == $scope.currentTimeRange.start.getTime()) {
        //Add to start
        newTimeRange = {
          start: new Date(timeRange.start),
          end: new Date($scope.currentTimeRange.end)
        }
      }
      else if(timeRange.start.getTime() == $scope.currentTimeRange.end.getTime()) {
        //Add to end
        newTimeRange = {
          start: new Date($scope.currentTimeRange.start),
          end: new Date(timeRange.end)
        }
      }
      else {
        return;
      }

      //Check that max time has not been violated
      if((newTimeRange.end.getTime() - newTimeRange.start.getTime()) / MINUTE <= maxTime) {
        $scope.currentTimeRange = newTimeRange;
      }
    }
    else {
      $scope.currentTimeRange = {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      }
    }
  }

  $scope.clearCurrentTimeRange = function() {
    $scope.currentTimeRange = undefined;
  }

  $scope.ssuSignupForSlot = function(selectedBlock, ssuId) {
    $http.put('/ssu/signUp/' + ssuId, selectedBlock).
    success(function(data, status, headers, config) {
      console.log(data);
      $scope.clearCurrentTimeRange();
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to sign-up for slot.');
    });
  }

  $scope.cancelSignupSlot = function(slot) {
    $http.put('/ssu/cancelSlot/' + slot._id).
    success(function(data, status, headers, config) {
      console.log(data);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to cancel sign-up slot.');
    });
  }

});