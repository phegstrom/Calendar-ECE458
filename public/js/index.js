//Angular code
var app = angular.module('calendarApp', ['angular.filter']);
app.run(function($rootScope, $q, $http) {

  $rootScope.bottomSelector = -1;
  $rootScope.events = [{
      "id": 293,
      "title": "Event 1",
      "url": "javascript:void(0)",
      "class": "event-important",
      "start": 1422424903780, // Milliseconds
      "end": 1422434903780 // Milliseconds
    }];

  $rootScope.createCalendar = function() {
    $rootScope.calendar = $("#calendar").calendar(
    {
      view: "month",
      tmpl_path: "/tmpls/",
      modal_title: function(event) { return event.title },
      modal: "#events-modal",
      modal_type: "template",
      events_source: $rootScope.events,
      onAfterViewLoad: function(view) {
        $('.btn-group button').removeClass('active');
        $('button[calendarView="' + view + '"]').addClass('active');
        $('.page-header h3').text(this.getTitle());

        $('a[data-event-id]').click(function() {
          $('#eventFrame').text($(this).attr('data-event-id'));
        });
      }
    });
  }
  $rootScope.setViewLength = function(viewLength) {
    $rootScope.calendar.view(viewLength);
    $rootScope.updateLocalEvents();
  }
  $rootScope.navigate = function(where) {
    $rootScope.calendar.navigate(where);
    $rootScope.updateLocalEvents();
  }
  $rootScope.updateLocalEvents = function() {
    $rootScope.localEvents = $rootScope.calendar.getEventsBetween($rootScope.calendar.getStartDate(),$rootScope.calendar.getEndDate());

    console.log($rootScope.localEvents);
  }

  $rootScope.parseDatabaseEvents = function() {
    var eventList = [];

    $rootScope.calendars.forEach(function(element, index, array) {
      eventList = eventList.concat(element.events);
    });

    var calendarEventList = [];

    eventList.forEach(function(element, index, array) {
      element.start = new Date(element.start);
      element.end = new Date(element.end);
      $rootScope.calendars.forEach(function(calendar, cIndex, cArray) {
        if(calendar._id === element.calendar) {
          element.calendarName = calendar.name;
        }
      });

      var newEvent = {};
      newEvent.id = element._id;
      newEvent.title = element.name;
      newEvent.url = 'javascript:void(0)';
      newEvent.class = 'event-important';
      newEvent.start = element.start.getTime();
      newEvent.end = element.end.getTime();
      newEvent.calendarId = element.calendar;
      newEvent.calendarName = element.calendarName;

      newEvent.parentData = element;

      calendarEventList.push(newEvent);
    });

    $rootScope.events = calendarEventList;
    $rootScope.createCalendar();
  }

  $rootScope.displayEventDetails = function(event) {
    $rootScope.bottomSelector=0;

    $rootScope.selectedEvent = event.parentData;
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

      
      var calendarEventPopulation = [];
      $rootScope.calendars.forEach(function(element, index, array) {
        calendarEventPopulation.push(
          $http.get('/calendar/id/'+element._id).
          success(function(data, status, headers, config) {
            element.events = angular.fromJson(data).events;
          })
        );
      });
      $q.all(calendarEventPopulation).then(function() {
        $rootScope.parseDatabaseEvents();
        $rootScope.updateLocalEvents();
      });
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
      $rootScope.getCalendarData();
    }).
    error(function(data, status, headers, config) {
      console.log('Could not delete event: ' + $rootScope.selectedEvent._id);
    });
  }

  
  //Initialization
  $rootScope.createCalendar();
  $rootScope.getCalendarData();
  $rootScope.updateLocalEvents();
});