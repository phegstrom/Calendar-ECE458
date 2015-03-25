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

  $scope.toggleConflictDetails = function(conflict) {
    if (typeof conflict.showDetails == 'undefined') {
      conflict.showDetails = true;
    }
    else {
      conflict.showDetails = !conflict.showDetails;
    }
  }

});
