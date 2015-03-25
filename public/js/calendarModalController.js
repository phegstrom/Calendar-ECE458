app.controller('calendarModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {
	$scope.selectedCalendar = modalService.selectedCalendar;

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };
});