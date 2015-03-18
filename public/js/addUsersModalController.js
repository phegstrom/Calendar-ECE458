app.controller('addUsersModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {

  $scope.selectedCalendar = modalService.selectedCalendar;

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

  // add users to modify users list
  $scope.addModUser = function() {
    var modList = angular.copy($scope.modUserList);
    console.log($scope.modUserList);
    $http.put('/calendar/modList/add/' + $scope.selectedCalendar._id, {modList: modList}).
    success(function(data, status, headers, config) {
      $scope.selectedCalendar.modList = angular.copy(angular.fromJson(data));
      console.log(angular.fromJson(data));
      //console.log($scope.selectedCalendar);
      modalService.selectedCalendar = $scope.selectedCalendar;
      modalService.displayOwnerCalendar(modalService.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      $scope.text = 'Failed to add user with modify.';
    });
    $scope.modUserList = [];
    
    $scope.cancel();
  }

  $scope.addModUsertoList = function() {
    var newModUserEmail = angular.copy($scope.inputModUserEmail);
    if($scope.modUserList) {
      $scope.modUserList.push(newModUserEmail);
    }
    else {
      $scope.modUserList = [newModUserEmail];
    }
    $scope.inputModUserEmail = '';
  }

});