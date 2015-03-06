app.controller('addRuleModalController', function($scope, $http, $modalInstance, $rootScope, modalService) {

  $scope.newRule = {};

  this.modalService = modalService;

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

// RULE ROUTES
  $scope.addUserEmailToRule = function() {
    var newUserEmail = angular.copy($scope.userEmail);
    if($scope.newRule.userIds) {
      $scope.newRule.userIds.push(newUserEmail);
    }
    else {
      $scope.newRule.userIds = [newUserEmail];
    }
    $scope.userEmail = '';
  }

  $scope.addUserGroupToRule = function() {
    var newGroupId = angular.copy($scope.userGroup._id);
    if($scope.newRule.userGroupIds) {
      $scope.userGroupDisplay.push($scope.userGroup.name);
      $scope.newRule.userGroupIds.push(newGroupId);
    }
    else {
      $scope.userGroupDisplay = [$scope.userGroup.name];
      $scope.newRule.userGroupIds = [newGroupId];
    }
    $scope.userGroup = {};
  }

  $scope.addRule = function() {
    if (typeof $scope.newRule.userGroupIds === "undefined") {
      $scope.newRule.userGroupIds = [];
    } else if (typeof $scope.newRule.userIds === "undefined") {
      $scope.newRule.userIds = [];
    }
    console.log($scope.newRule);

    $http.post('/rule/'+ modalService.selectedCalendar._id, $scope.newRule).
    success(function(data, status, headers, config) {
      modalService.selectedCalendar.rules.push(angular.copy(angular.fromJson(data)));
      modalService.displayOwnerCalendar(modalService.selectedCalendar);
      $scope.newRule = {};
      $scope.userGroupDisplay = [];
      //console.log(modalService.selectedCalendar);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to create rule.');
    });
    $scope.cancel();
  }

});