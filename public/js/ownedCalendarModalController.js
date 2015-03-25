app.controller('ownedCalendarModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {
	$scope.selectedCalendar = modalService.selectedCalendar;
});