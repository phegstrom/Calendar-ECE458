//Angular code
var app = angular.module('calendarApp', ['angular.filter', 'mwl.calendar']);
app.run(function($rootScope, $q, $http) {

  //Store a week in milliseconds
  var DAY = 1000*60*60*24;

  $rootScope.bottomSelector = -1;
  var currentYear = moment().year();
  var currentMonth = moment().month();

  $rootScope.events=[];
  $rootScope.calendarView = 'month';
  $rootScope.calendarDay = new Date();

  $rootScope.setViewLength = function(viewLength) {
    $rootScope.calendarView = viewLength;
    $rootScope.updateLocalEvents();
  }
  $rootScope.goToToday = function() {
    $rootScope.calendarDay = new Date();
    $rootScope.updateLocalEvents();
  }
  $rootScope.updateLocalEvents = function() {
    //$rootScope.localEvents = $rootScope.calendar.getEventsBetween($rootScope.calendar.getStartDate(),$rootScope.calendar.getEndDate());
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
    console.log(calendarEventList);
  }

  $rootScope.displayEventDetails = function(event) {
    $rootScope.bottomSelector=0;
    $rootScope.selectedEvent = event.parentData;
    console.log($rootScope.selectedEvent);
  }

  $rootScope.getCalendarData = function() {
    var ownGet = $http.get('/calendar/myCalId').
    success(function(data, status, headers, config) {
      $rootScope.myCalendars = angular.fromJson(data);

      $rootScope.myCalendars.forEach(function(element, index, array) {
        element.grouping = 'Owned Calendar';
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

  $rootScope.displayEventCreator = function() {
    $rootScope.eventDetails = {};
    $rootScope.bottomSelector = 1;
  }

  $rootScope.editSelectedEvent = function() {
    $rootScope.eventDetails = $rootScope.selectedEvent;
    $rootScope.calendars.forEach(function(element, index, array) {
      if(element._id === $rootScope.selectedEvent.calendar) {
        $rootScope.eventDetails.calendar = element;
      }
    });
    $rootScope.bottomSelector = 1;
  }

  $rootScope.deleteSelectedEvent = function() {
    $rootScope.bottomSelector = -1;

    $http.delete('/event/'+$rootScope.selectedEvent._id).
    success(function(data, status, headers, config) {
      console.log('Event deleted: ' + $rootScope.selectedEvent._id);
      for(var i=0;i<$rootScope.events;i++) {
        if($rootScope.events[i].parentData._id == $rootScope.selectedEvent._id) {
          array.splice(i, 1);
        }
      }
    }).
    error(function(data, status, headers, config) {
      console.log('Could not delete event: ' + $rootScope.selectedEvent._id);
    });
  }

  var canEditEvent = function(dBEvent) {
    for(var i=0;i<$rootScope.myCalendars.length;i++) {
      if(dBEvent.calendar === $rootScope.myCalendars[i]._id) {
        return true;
      }
    }
    for(var i=0;i<$rootScope.modCalendars.length;i++) {
      if(dBEvent.calendar === $rootScope.modCalendars[i]._id) {
        return true;
      }
    }
    return false;
  }

  var canViewEvent = function(dBEvent) {
    for(var i=0;i<$rootScope.viewBusyCalendars.length;i++) {
      if(dBEvent.calendar === $rootScope.viewBusyCalendars[i]._id) {
        return false;
      }
    }
    return true;
  }

  $rootScope.convertDBEventToCalEvent = function(dBEvent) {
    dBEvent.start = new Date(dBEvent.start);
    dBEvent.end = new Date(dBEvent.end);
    $rootScope.calendars.forEach(function(calendar, cIndex, cArray) {
      if(calendar._id === dBEvent.calendar) {
        dBEvent.calendarName = calendar.name;
      }
    });
    dBEvent.canEditEvent = canEditEvent(dBEvent);
    dBEvent.canViewEvent = canViewEvent(dBEvent);

    var newEvent = {};
    newEvent.title = dBEvent.name;
    if(dBEvent.canViewEvent) {
      newEvent.type = 'warning';
    }
    else {
      newEvent.type = 'important';
      newEvent.title = 'Event';
    }
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



  
  //Initialization
  $rootScope.getCalendarData();
  $rootScope.updateLocalEvents();
});