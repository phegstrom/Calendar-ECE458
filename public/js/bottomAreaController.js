app.controller('bottomAreaController', function($scope, $http) {
  $scope.title = '';
  $scope.text = '';
  $scope.$parent.eventDetails = {};

  var defaultForm = {
    name: '',
    description: '',
    location: '',
    alerts: [],
    willRepeat: false,
    repeatMode: '',
    repeatCount: 0,
    calendar: null
  }

  $scope.sendEventData = function() {
    var eventDetails = $scope.$parent.eventDetails;
    eventDetails.calendar = eventDetails.calendar._id;
    if(eventDetails.alerts) {
      eventDetails.alerts.forEach(function(element, index, array) {
          element.method = 'email';
        });
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
      repeats.days = [eventDetails.start];

      eventDetails.repeats = [repeats];
    }

    console.log(eventDetails);

    var request = {};

    if(eventDetails._id) {
      request = $http.put('/event/'+eventDetails._id, eventDetails).
      success(function(data, status, headers, config) {
        //Parse the object into a set of groups filled with users
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }
    else {
      request = $http.post('/event', eventDetails).
      success(function(data, status, headers, config) {
        //Parse the object into a set of groups filled with users
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
    }

    request.then(function() {
      $scope.eventForm.$setPristine();
      eventDetails = defaultForm;

      $scope.$parent.getCalendarData();
    });
  }

  $scope.addAlert = function() {
    var newAlert = new Date($scope.alertTime);
    if($scope.$parent.eventDetails.alerts) {
      $scope.$parent.eventDetails.alerts.push(newAlert);
    }
    else {
      $scope.$parent.eventDetails.alerts = [newAlert];
    }
  }

  $scope.removeAlert = function(time) {
    $scope.$parent.eventDetails.alerts = $scope.$parent.eventDetails.alerts.filter(function(alert){
      return alert != time;
    });
  }
});