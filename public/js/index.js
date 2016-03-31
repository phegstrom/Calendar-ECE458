//Angular code
var app = angular.module('calendarApp', ['angular.filter', 'mwl.calendar', 'ui.bootstrap']);

app.service('modalService', function() {

  var selectedCalendar;
  var displayOwnerCalendar;
  var conflictSummary;
  var freeTimeEvent;
  var requestDetails;

});


app.run(function($rootScope, $q, $http, $modal) {

  //Store a week in milliseconds
  var DAY = 1000*60*60*24;
  $rootScope.HOUR = 1000*60*60;

  $rootScope.bottomSelector = -1;
  var currentYear = moment().year();
  var currentMonth = moment().month();

  $rootScope.events=[];
  $rootScope.calendarView = 'month';
  $rootScope.calendarDay = new Date();

  $rootScope.getSlotSignups = function() {
    $rootScope.slotSignupsCreated = [];
    $rootScope.slotSignupsIncoming = [];

    $http.get('/ssu').
    success(function(data, status, headers, config) {
      $rootScope.slotSignupsCreated = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve list of created slot signup events.');
    });

    $http.get('/ssu/getIncoming').
    success(function(data, status, headers, config) {
      $rootScope.slotSignupsIncoming = angular.fromJson(data);

      console.log($rootScope.slotSignupsIncoming);
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve list of incoming slot signup events.');
    });
  }

  $rootScope.getAllUsers = function() {
    $rootScope.userList = [];

    $http.get('/users').
    success(function(data, status, headers, config) {
      $rootScope.userList = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve list of users.');
    });
  }

  $rootScope.getCurrentUserID = function() {
    $http.get('/user').
    success(function(data, status, headers, config) {
      $rootScope.currentUserID = data;
      $http.get('/user/email/' + data).
      success(function(data, status, headers, config) {
        $rootScope.currentUserEmail = data;
      }).
      error(function(data, status, headers, config) {
        console.log('Could not get current user\'s email');
      })
    }).
    error(function(data, status, headers, config) {
      console.log('Could not get current user\'s ID');
    })
  }

  $rootScope.getRequests = function() {
    $rootScope.ownRequests = [];
    $rootScope.otherRequests = [];

    $http.get('/request/getCreated').
    success(function(data, status, headers, config) {
      $rootScope.ownRequests = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve list of created event requests.');
    });

    $http.get('/request/getIncoming').
    success(function(data, status, headers, config) {
      $rootScope.otherRequests = angular.fromJson(data);
      $rootScope.pendingRequests = [];

      for(var requestIndex=0; requestIndex < $rootScope.otherRequests.length; requestIndex++) {
        if($rootScope.otherRequests[requestIndex].usersStatus[$rootScope.currentUserID].status == 'pending') {
          $rootScope.pendingRequests.push($rootScope.otherRequests[requestIndex]);
        }
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve list of incoming event requests.');
    });
  }

  $rootScope.getPuds = function() {
    $rootScope.pudList = [];

    $http.get('/pud').
    success(function(data, status, headers, config) {
      $rootScope.pudList = angular.fromJson(data);
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve PUD list.');
    });
  }

  $rootScope.setViewLength = function(viewLength) {
    $rootScope.calendarView = viewLength;
  }
  $rootScope.nav = function(direction) {
    //There is a race condition here that makes the update apply
    // before the calendar navigation.

    if(direction == 'back') {
      $rootScope.calendarControl.prev();
    }
    else if(direction == 'forward') {
      $rootScope.calendarControl.next();
    }

    updateOnDateChange();
  }

  var updateOnDateChange = function() {
    var originalValue = angular.copy($rootScope.calendarDay);
    console.log($rootScope.calendarDay);

    if(originalValue == $rootScope.calendarDay) {
      console.log(originalValue);
      console.log($rootScope.calendarDay);
      setTimeout(waitOnDateChange, 10);
      return;
    }
    console.log(originalValue);
    console.log($rootScope.calendarDay);
    originalValue = angular.copy($rootScope.calendarDay);
  }

  $rootScope.goToToday = function() {
    $rootScope.calendarDay = new Date();
  }

  $rootScope.parseDatabaseEvents = function() {
    var eventList = [];

    $rootScope.calendars.forEach(function(element, index, array) {
      eventList = eventList.concat(element.events);
    });

    var calendarEventList = [];

    for(var evNum=0;evNum<eventList.length;evNum++) {
      var element = eventList[evNum];
      var newEvent = $rootScope.convertDBEventToCalEvent(element);

      calendarEventList.push(newEvent);

      calendarEventList.concat(getRepeatedEventsInScope(element, newEvent));
    }

    $rootScope.events = calendarEventList;
  }

  $rootScope.displayEventDetails = function(event) {
    if(event.parentData) {
      //CalEvent
      $rootScope.selectedEvent = event.parentData;
    }
    else if(event) {
      //DBEvent
      $rootScope.selectedEvent = event;
    }

    //Populate request details if owner of request
    $rootScope.selectedRequest = $rootScope.getOwnRequest($rootScope.selectedEvent.requestID);

    if($rootScope.selectedRequest) {}
    else {
      $rootScope.selectedRequest = $rootScope.getOtherRequest($rootScope.selectedEvent.requestID);
    }


    //Populate PUD value if it exists
    if($rootScope.selectedEvent.evType == 'pud') {
      $http.get('/event/pud/' + $rootScope.selectedEvent._id).
      success(function(data, status, headers, config) {
        var resData = angular.fromJson(data);
        $rootScope.selectedEvent.pudDetails = resData.display;
      });
    }

    $modal.open({
        templateUrl: '/modal/eventDetailsModal',
        controller: 'eventModalController'
      });
    //console.log($rootScope.selectedEvent);
  }

  $rootScope.displayCreateEventModal = function() {
    $rootScope.freeTimeEvent = false;
    $modal.open({
        templateUrl: '/modal/createEventModal',
        controller: 'eventModalController'
      });
  }

  $rootScope.displayBulkAddEventsModal = function() {
    $rootScope.freeTimeEvent = false;
    $modal.open({
        templateUrl: '/modal/bulkAddEventsModal',
        controller: 'eventModalController'
      });
  }

  $rootScope.displayAddRuleModal = function() {
    $modal.open({
        templateUrl: '/modal/addRuleModal',
        controller: 'addRuleModalController'
      });
  }

  $rootScope.displayFindFreeTimeModal = function() {
    $modal.open({
      templateUrl: '/modal/findFreeTimeModal',
      controller: 'eventModalController'
    });
  }

  $rootScope.displayConflictSummaryModal = function() {
    $modal.open({
      templateUrl: '/modal/conflictSummaryModal',
      controller: 'conflictSummaryModalController'
    });
  }

  $rootScope.displayAddUsersModal = function() {
    $modal.open({
      templateUrl: '/modal/addUserModal',
      controller: 'addUserModalController'
    });
  }

  $rootScope.displayInviteUserModal = function() {
    $modal.open({
        templateUrl: '/modal/inviteUserModal',
        controller: 'eventModalController'
      });
  }
  $rootScope.displayOwnedCalendarModal = function() {
    $modal.open({
        templateUrl: '/modal/ownedCalendarModal',
        controller: 'calendarModalController'
      });
  }
  $rootScope.displayOtherCalendarModal = function() {
    $modal.open({
        templateUrl: '/modal/otherCalendarModal',
        controller: 'calendarModalController'
      });
  }

  $rootScope.editPud = function(pud) {
    $rootScope.pudDetails = angular.copy(pud);
    $rootScope.pudDetails.timeString = new String($rootScope.pudDetails.time);
    $rootScope.pudDetails.intervalString = new String($rootScope.pudDetails.interval);
    $rootScope.displayCreatePudModal();
  }

  $rootScope.createPudEvent = function() {
    $rootScope.pudDetails = {};
    $rootScope.displayCreatePudModal();
  }

  $rootScope.displayCreatePudModal = function() {
    $modal.open({
      templateUrl: '/modal/createPudModal',
      controller: 'pudModalController'
    });
  }

  $rootScope.displaySsuDetails = function(ssuEvent) {
    $rootScope.selectedSsu = ssuEvent;

    if(!$rootScope.selectedSsu.preferenceFinal && $rootScope.selectedSsu.preferenceComplete) {
      var selectedPreferences = $rootScope.selectedSsu.preferences;

      $rootScope.resolutionDetails = {
        slots: []
      };

      for(var freeTimeIndex = 0; freeTimeIndex < $rootScope.selectedSsu.freeBlocks.length; freeTimeIndex++) {
        var selectedBlock = $rootScope.selectedSsu.freeBlocks[freeTimeIndex];
        var slotObject = {
          userEmail: '',
          startTime: selectedBlock.start,
          endTime: selectedBlock.end
        }


        var slotStart = new Date(selectedBlock.start);
        for(var preferenceIndex = 0; preferenceIndex < selectedPreferences; preferenceIndex++) {
          var preferenceStart = new Date(selectedPreferences[preferenceIndex].finalSlot.startTime);
          if(slotStart == preferenceStart) {
            slotObject.userEmail = selectedPreferences[preferenceIndex].useremail;
          }
        }
      }

      console.log($rootScope.selectedSsu);

      $modal.open({
        templateUrl: '/modal/ssuResolutionModal',
        controller: 'ssuModalController'
      });
    }
    else {
      $modal.open({
          templateUrl: '/modal/ssuDetailsModal',
          controller: 'ssuModalController'
        });
    }

    console.log($rootScope.selectedSsu);
  }

  $rootScope.displayCreateSsuModal = function() {
    $modal.open({
      templateUrl: '/modal/createSsuModal',
      controller: 'ssuModalController'
    });
  }

  $rootScope.displaySsuSignupModal = function(ssuEvent) {
    $rootScope.selectedSsu = ssuEvent;

    for(var attendeeIndex = 0; attendeeIndex < ssuEvent.attendees.length; attendeeIndex++) {
      if(ssuEvent.attendees[attendeeIndex].userEmail == $rootScope.currentUserEmail) {
        $rootScope.selectedSsuSlots = ssuEvent.attendees[attendeeIndex].slots;
      }
    }

    for(var preferenceIndex = 0; preferenceIndex < ssuEvent.preferences.length; preferenceIndex++) {
      if(ssuEvent.preferences[preferenceIndex].useremail == $rootScope.currentUserEmail) {
        $rootScope.selectedTimeSlots = ssuEvent.preferences[preferenceIndex].timeSlots;
      }
    }

    $modal.open({
      templateUrl: '/modal/ssuSignupModal',
      controller: 'ssuModalController'
    });
  }

  $rootScope.getCalendarData = function() {
    var ownGet = $http.get('/calendar/myCalId').
    success(function(data, status, headers, config) {
      $rootScope.myCalendars = angular.fromJson(data);

      $rootScope.myCalendars.forEach(function(element, index, array) {
        element.grouping = 'Owned Calendar';
        element.evType = 'success';
        $rootScope.setEventData(element, "success", true, true);
      });
    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve owned calendars.');
    });

    var modGet = $http.get('/calendar/modCalId').
    success(function(data, status, headers, config) {
      $rootScope.modCalendars = angular.fromJson(data);

      $rootScope.modCalendars.forEach(function(element, index, array) {
        element.grouping = 'Modifiable Calendar';
        element.evType = 'info';
        $rootScope.setEventData(element, "info", true, true);
      });

    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve modifiable calendars.');
    });


    var viewGet = $http.get('/calendar/canView').
    success(function(data, status, headers, config) {
      $rootScope.viewCalendars = angular.fromJson(data);

      $rootScope.viewCalendars.forEach(function(element, index, array) {
        element.grouping = 'Viewable Calendar';
        element.evType = 'warning';
        $rootScope.setEventData(element, "warning", true, false);
      });

    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve viewable calendars.');
    });


    var busyGet = $http.get('/calendar/canViewBusy').
    success(function(data, status, headers, config) {
      $rootScope.viewBusyCalendars = angular.fromJson(data);

      $rootScope.viewBusyCalendars.forEach(function(element, index, array) {
        element.grouping = 'Busy Calendar';
        element.evType = 'important';
        $rootScope.setEventData(element, "important", false, false);
      });

    }).
    error(function(data, status, headers, config) {
      console.log('Could not retrieve busy calendars.');
    });
    

    $q.all([ownGet, modGet, viewGet, busyGet]).then(function() {
      $rootScope.calendars = [];
      $rootScope.calendars = $rootScope.calendars.concat($rootScope.myCalendars, $rootScope.modCalendars, $rootScope.viewCalendars, $rootScope.viewBusyCalendars);
      $rootScope.parseDatabaseEvents();
    });
  }

  $rootScope.createNewEvent = function() {
    $rootScope.eventDetails = {
      start: Date.parse('today'),
      end: Date.parse('tomorrow')
    };
    $rootScope.displayCreateEventModal();
  }

  $rootScope.convertDBEventToCalEvent = function(dBEvent) {
    dBEvent.start = new Date(dBEvent.start);
    dBEvent.end = new Date(dBEvent.end);

    var newEvent = {};
    newEvent.title = dBEvent.name;
    newEvent.type = dBEvent.type;
    newEvent.starts_at = dBEvent.start.getTime();
    newEvent.ends_at = dBEvent.end.getTime();

    newEvent.parentData = dBEvent;

    return newEvent;
  }

  var getRepeatedEventsInScope = function(dBEvent, calEvent) {
    var eventList = [];

    for(var rep=0;rep<dBEvent.repeats.length;rep++) {
      var repetition = dBEvent.repeats[rep];
      var weekdays = [];

      for(var weekdayNum=0; weekdayNum<repetition.days.length; weekdayNum++) {
        day = new Date(repetition.days[weekdayNum]);
        day = day.getDay() - dBEvent.start.getDay();
        if(day <= 0) {
          day += 7;
        }

        weekdays[weekdayNum] = day;
      }

      weekdays.sort();

      var weekdayIndex = 0;
      if(repetition.frequency) {
        var eventIterations = [];
        for(var i=0; i<repetition.frequency;i++) {
          eventIterations.push(angular.copy(calEvent));
          eventIterations[i].starts_at +=  DAY * weekdays[weekdayIndex];
          eventIterations[i].ends_at += DAY * weekdays[weekdayIndex];

          weekdays[weekdayIndex] += 7;
          weekdayIndex++;
          if(weekdayIndex >= weekdays.length) {
            weekdayIndex = 0;
          }
        }
        eventList = eventList.concat(eventIterations);
      }
      else if(repetition.endDate) {
        var endDate = new Date(repetition.endDate);
        var currentTime = new Date(calEvent.starts_at);
        var eventIterations = [];
        var i = 0;
        while(currentTime < endDate) {
          eventIterations.push(angular.copy(calEvent));
          eventIterations[i].starts_at +=  DAY * weekdays[weekdayIndex];
          eventIterations[i].ends_at += DAY * weekdays[weekdayIndex];

          weekdays[weekdayIndex] += 7;
          weekdayIndex++;
          if(weekdayIndex >= weekdays.length) {
            weekdayIndex = 0;
          }

          currentTime = eventIterations[i].start;
          i++;
        }
        eventList = eventList.concat(eventIterations);
      }
    }

    return eventList;
  }

  $rootScope.setEventData = function(calendar, eventType, canView, canEdit, singleEvent) {
    if(calendar != undefined && singleEvent != undefined) {
      singleEvent.type = eventType;
      singleEvent.canViewEvent = canView;
      singleEvent.canEditEvent = canEdit;
      singleEvent.calendarName = calendar.name;
      singleEvent.calendarId = calendar._id;
    }
    else if(calendar != undefined) {
      calendar.events.forEach(function(dBEvent, index, array) {
        dBEvent.type = eventType;
        dBEvent.canViewEvent = canView;
        dBEvent.canEditEvent = canEdit;
        dBEvent.calendarName = calendar.name;
        dBEvent.calendarId = calendar._id;
        if(!canView) {
          dBEvent.name = calendar.owner.email + '\'s Event';
        }
      });
    }
    else {
      console.log('Could not set event data for ' + calendar + ' ' + singleEvent);
    }
  }

  $rootScope.isValidTime = function(date) {
    if(date == undefined) {
      return false;
    }

    var timestamp=Date.parse(date);
    return isNaN(timestamp) == false;
  }

  $rootScope.getCalendar = function(calendarId) {
    var matchedCalendar;
    $rootScope.calendars.forEach(function(calendar, index, array) {
      if(calendar._id == calendarId) {
        matchedCalendar = calendar;
      }
    });

    return matchedCalendar;
  }

  $rootScope.addCalendar = function(calendar) {
    calendar.grouping = 'Owned Calendar';
    $rootScope.myCalendars.push(calendar);
    $rootScope.calendars.push(calendar);
  }

  $rootScope.deleteCalendar = function(calendarId) {
    for(var i=0; i < $rootScope.events.length; i++) {
      console.log($rootScope.events[i].parentData.calendarId);
      while( i < $rootScope.events.length && $rootScope.events[i].parentData.calendarId == calendarId) {
        $rootScope.events.splice(i, 1);
      }
    }

    for(var i=0; i < $rootScope.myCalendars.length; i++) {
      if($rootScope.myCalendars[i]._id == calendarId) {
        $rootScope.myCalendars.splice(i, 1);
        break;
      }
    }

    for(var i=0; i < $rootScope.calendars.length; i++) {
      if($rootScope.calendars[i]._id == calendarId) {
        $rootScope.calendars.splice(i, 1);
        break;
      }
    }
  }

  //Email routes
  $rootScope.emailTextSchedule = function() {
    var startInterval = moment($rootScope.calendarDay).startOf($rootScope.calendarView).toDate();
    var endInterval = moment($rootScope.calendarDay).endOf($rootScope.calendarView).toDate();
    var eventList = [];

    $rootScope.events.forEach(function(calEvent, index, array) {
      var eventStart = new Date(calEvent.starts_at);
      var eventEnd = new Date(calEvent.ends_at);

      if(eventStart.getTime() <= endInterval.getTime() &&
          eventEnd.getTime() >= startInterval.getTime()) {
        eventList.push(calEvent.parentData);
      }
    });

    console.log(eventList);

    $http.post('/schedule/text', eventList).
    success(function(data, status, headers, config) {
        console.log('Calendar sent.')
      }).
    error(function(data, status, headers, config) {
        console.log('Failed to send calendar.');
      });
  }

  $rootScope.emailPngSchedule = function() {
    html2canvas(document.getElementById('calendar'), {
    //html2canvas(document.content, {
      logging: 'on'
    }).then(function(canvas) {
      console.log(canvas.toDataURL());

      var calendarImage = {
        image: canvas.toDataURL()
      }

      $http.post('/schedule/image', calendarImage).
      success(function(data, status, headers, config) {
          console.log('Calendar sent.')
        }).
      error(function(data, status, headers, config) {
          console.log('Failed to send calendar.');
        });
    });
  }

  $rootScope.findEvent = function(eventId) {
    for(var eventIndex=0; eventIndex < $rootScope.events.length; eventIndex++) {
      if($rootScope.events[eventIndex]._id == eventId) {
        return $rootScope.events[eventIndex];
      }
    }

    return undefined;
  }

  $rootScope.getUserEmail = function(userId) {
    for(var userIndex=0; userIndex < $rootScope.userList.length; userIndex++) {
      if($rootScope.userList[userIndex]._id == userId) {
        return $rootScope.userList[userIndex].email;
      }
    }
    return 'Unknown User';
  }

  $rootScope.getOwnRequest = function(requestId) {
    for(var requestIndex=0; requestIndex<$rootScope.ownRequests.length; requestIndex++) {
      if($rootScope.ownRequests[requestIndex]._id == requestId) {
        return $rootScope.ownRequests[requestIndex];
      }
    }

    return null;
  }

  $rootScope.getOtherRequest = function(requestId) {
    for(var requestIndex=0; requestIndex<$rootScope.otherRequests.length; requestIndex++) {
      if($rootScope.otherRequests[requestIndex]._id == requestId) {
        return $rootScope.otherRequests[requestIndex];
      }
    }

    return null;
  }
  
  //Initialization
  $rootScope.getCurrentUserID();
  $rootScope.getCalendarData();
  $rootScope.getAllUsers();
  $rootScope.getRequests();
  $rootScope.getPuds();
  $rootScope.getSlotSignups();
});