app.controller('conflictSummaryModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

  $scope.conflictSummary = modalService.conflictSummary;
  console.log($scope.conflictSummary);

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

  $scope.toggleConflictDetails = function(summary) {
  	var i;
  	for(i = 0; i < $scope.conflictSummary.length; i++) {
  	  if ($scope.conflictSummary[i] == summary) {
        if (typeof $scope.conflictSummary[i].showDetails == 'undefined') {
          $scope.conflictSummary[i].showDetails = true;
        }
        else {
          $scope.conflictSummary[i].showDetails = !$scope.conflictSummary[i].showDetails;
        }
      }
	  }
  }

  $scope.chooseEventTime = function(start, end) {
    $scope.cancel();

    $rootScope.eventDetails.start = new Date(start);
    $rootScope.eventDetails.end = new Date(end);

    // SAVE USER LIST TO modalService???
    $rootScope.freeTimeEvent = true;

  }

});
