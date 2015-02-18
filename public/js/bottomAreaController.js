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
            $rootScope.events[eventIndex] = $rootScope.convertDBEventToCalEvent(modifiedEvent);
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
});