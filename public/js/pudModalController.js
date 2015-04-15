app.controller('pudModalController', function($scope, $http, $q, $modalInstance, $rootScope, modalService) {

  this.modalService = modalService;

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

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

    if(!$rootScope.isValidTime(pudDetails.expirationDate)) {
      pudDetails.expirationDate = undefined;
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