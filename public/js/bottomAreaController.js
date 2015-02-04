app.controller('bottomAreaController', function($scope, $http) {
  $scope.title = '';
  $scope.text = '';
  $scope.selector = 1;
  $scope.eventDetails = {};

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
    console.log($scope.eventDetails.start instanceof Date);
    $scope.eventDetails.calendar = $scope.eventDetails.calendar._id;
    if($scope.eventDetails.alerts) {
      $scope.eventDetails.alerts.forEach(function(element, index, array) {
          element.method = 'email';
        });
    }
    var repeats = {};
    if($scope.eventDetails.willRepeat) {
      switch($scope.eventDetails.repeatMode) {
        case 'Number':
          repeats.frequency = $scope.eventDetails.repeatCount;
          break;
        case 'End Date':
          repeats.endDate = $scope.eventDetails.repeatUntil;
          break;
        default:
          console.log('Repeat method not found.');
      }
      repeats.days = [$scope.eventDetails.start];

      $scope.eventDetails.repeat = [repeats];
    }

    var request = $http.post('/event', $scope.eventDetails).
    success(function(data, status, headers, config) {
      //Parse the object into a set of groups filled with users
    }).
    error(function(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

    request.then(function() {
      $scope.eventForm.$setPristine();
      $scope.eventDetails = defaultForm;

      $scope.$parent.parseDatabaseEvents();
    });
  }

  $scope.addAlert = function() {
    var newAlert = new Date($scope.alertTime);
    if($scope.eventDetails.alerts) {
      $scope.eventDetails.alerts.push(newAlert);
    }
    else {
      $scope.eventDetails.alerts = [newAlert];
    }
  }

  $scope.removeAlert = function(time) {
    $scope.eventDetails.alerts = $scope.eventDetails.alerts.filter(function(alert){
      return alert != time;
    });
  }
});