app.controller('calendarModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {
	$scope.selectedCalendar = modalService.selectedCalendar;

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

  $scope.deleteRule = function(ruleId) {
    //console.log($scope.selectedCalendar);
    $http.delete('/rule/'+ ruleId + '/' + $scope.selectedCalendar._id).
    success(function(data, status, headers, config) {

      for(var deleteRuleIndex = 0; deleteRuleIndex < $scope.selectedCalendar.rules.length; deleteRuleIndex++) {
        if($scope.selectedCalendar.rules[deleteRuleIndex]._id == ruleId) {
          $scope.selectedCalendar.rules.splice(deleteRuleIndex, 1);
          break;
        }
      }
      modalService.selectedCalendar = $scope.selectedCalendar;
      //modalService.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to delete rule.');
    });
  }

  $scope.removeModUser = function(modUserEmail) {
    $http.put('/calendar/modList/remove/' + $scope.selectedCalendar._id, {modList: [modUserEmail]}).
    success(function(data, status, headers, config) {

      $scope.selectedCalendar.modList = angular.copy(angular.fromJson(data));
      modalService.selectedCalendar = $scope.selectedCalendar;
      //modalService.displayOwnerCalendar($scope.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to remove user from modify.';
    });
  }

});