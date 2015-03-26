app.controller('ssuModalController', function($scope, $http, $q, $modalInstance, $rootScope, modalService) {

  this.modalService = modalService;

  var MINUTE = 1000*60; //ms * sec

  $scope.ssuDetails = {};

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

  $scope.addSectionToSsu = function(sectionStart, sectionEnd) {
    if($scope.ssuDetails.sections == undefined) {
      $scope.ssuDetails.sections = [];
    }

    var minutes = (sectionEnd - sectionStart) / MINUTE;

    console.log(minutes);

    if(minutes <= 0) {
      $scope.ssuDetails.sectionErrorText = 'Start time is not before end time.';
      return;
    }
    if($scope.ssuDetails.evMinDuration == undefined) {
      $scope.ssuDetails.sectionErrorText = 'Minimum sign-up time not set.';
      return;
    }
    if(minutes % $scope.ssuDetails.evMinDuration != 0) {
      $scope.ssuDetails.sectionErrorText = 'Interval is not a multiple of the minimum sign-up time.';
      return;
    }

    $scope.ssuDetails.sections.push({
      start: sectionStart,
      end: sectionEnd
    });
    $scope.ssuDetails.sectionErrorText = '';
  }

  $scope.removeSectionFromSsu = function(section) {
    var index = $scope.ssuDetails.sections.indexOf(section);

    if(index > 0) {
      $scope.ssuDetails.sections.splice(index, 1);
    }
    $scope.ssuDetails.sectionErrorText = '';
  }

  $scope.sendSsuData = function(ssuDetails) {
    //Convert sections into minimum slots, ensure that the minimum time is still valid in creation.
    var minimumTime = ssuDetails.evMinDuration;

    if(ssuDetails.evMaxDuration % minimumTime != 0) {
      $scope.ssuDetails.sectionErrorText = 'Maximum time is not a multiple of minimum time.';
      return;
    }
    if(ssuDetails.sections == undefined) {
      $scope.ssuDetails.sectionErrorText = 'No times were specified';
      return;
    }
    if(ssuDetails.userGroups == undefined) {
      ssuDetails.userGroups = [];
    }
    if(ssuDetails.userList == undefined) {
      ssuDetails.userList = [];
    }
    if(ssuDetails.description == undefined) {
      ssuDetails.description = '';
    }

    ssuDetails.evFreeBlocks = [];
    ssuDetails.sections.forEach(function(section, index, array) {
      var minutes = (section.end - section.start) / MINUTE;

      if(minutes % minimumTime != 0) {
        $scope.ssuDetails.sectionErrorText = 'A section is not a multiple of the minimum slot duration: ' + section.start.toLocaleString();
        ssuDetails.evFreeBlocks = undefined;
        return;
      }
      var dateBlockStart = new Date(section.start)
      while(section.end - dateBlockStart > 0) {
        var timeBlock = new Object();
        timeBlock.start = new Date(dateBlockStart);
        dateBlockStart = new Date(dateBlockStart.getTime() + minimumTime * MINUTE);
        if(dateBlockStart - timeBlock.start == 0) {
          return;
        }
        timeBlock.end = new Date(dateBlockStart);

        ssuDetails.evFreeBlocks.push(timeBlock);
      }
    });
    //Change the name of userList so the API is met
    ssuDetails.userEmails = ssuDetails.userList;
    //Change the name and values for userGroups so the API is met
    ssuDetails.userGroupIds = [];
    ssuDetails.userGroups.forEach(function(userGroup, index, array) {
      ssuDetails.userGroupIds.push(userGroup._id);
    });
    //Send data
    console.log(ssuDetails.evFreeBlocks);
    $http.post('/ssu', ssuDetails).
    success(function(data, status, headers, config) {
      $rootScope.slotSignupsCreated.push(angular.fromJson(data));
      $scope.ssuDetails = {};
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to create sign-up event.');
      $scope.ssuDetails = {};
    });
  }

  $scope.addTimeToSlot = function(timeRange, maxTime) {
    if($scope.currentTimeRange) {
      var newTimeRange = {};
      timeRange.start = new Date(timeRange.start);
      timeRange.end = new Date(timeRange.end);
      if(timeRange.end.getTime() == $scope.currentTimeRange.start.getTime()) {
        //Add to start
        newTimeRange = {
          start: new Date(timeRange.start),
          end: new Date($scope.currentTimeRange.end)
        }
      }
      else if(timeRange.start.getTime() == $scope.currentTimeRange.end.getTime()) {
        //Add to end
        newTimeRange = {
          start: new Date($scope.currentTimeRange.start),
          end: new Date(timeRange.end)
        }
      }
      else {
        return;
      }

      //Check that max time has not been violated
      if((newTimeRange.end.getTime() - newTimeRange.start.getTime()) / MINUTE <= maxTime) {
        $scope.currentTimeRange = newTimeRange;
      }
    }
    else {
      $scope.currentTimeRange = {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      }
    }
  }

  $scope.clearCurrentTimeRange = function() {
    $scope.currentTimeRange = undefined;
  }

  $scope.ssuSignupForSlot = function(selectedBlock, ssuId) {
    $http.put('/ssu/signUp/' + ssuId, selectedBlock).
    success(function(data, status, headers, config) {
      var newSsu = angular.fromJson(data);
      $rootScope.selectedSsu.freeBlocks = newSsu.freeBlocks;


      var newAttendee = getAttendee(newSsu, $rootScope.currentUserEmail);
      console.log(newAttendee);

      var newSlot = {
        start: selectedBlock.start,
        end: selectedBlock.end,
        _id: newAttendee.slots[newAttendee.slots.length - 1]
      }

      var oldAttendee = getAttendee($rootScope.selectedSsu, $rootScope.currentUserEmail);

      oldAttendee.slots.push(newSlot);
      $scope.clearCurrentTimeRange();
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to sign-up for slot.');
    });
  }

  var getAttendee = function(newSsu, userEmail) {
    for(var index = 0; index < newSsu.attendees.length; index++) {
      if(newSsu.attendees[index].userEmail == userEmail) {
        return newSsu.attendees[index];
      }
    }
  }

  $scope.cancelSignupSlot = function(slot, selectedSlots) {
    console.log(slot);
    $http.put('/ssu/cancelSlot/' + slot._id).
    success(function(data, status, headers, config) {
      var newSsu = angular.fromJson(data);
      $rootScope.selectedSsu.freeBlocks = newSsu.freeBlocks;

      selectedSlots.splice(selectedSlots.indexOf(slot), 1);
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to cancel sign-up slot.');
    });
  }


  $scope.addUserGroupToRequest = function(details) {
    var selectedGroup = $scope.selectedGroup;
    if(details.userGroups) {
      if(details.userGroups.indexOf(selectedGroup) == -1) {
        details.userGroups.push(selectedGroup);
      }
    }
    else {
      details.userGroups = [selectedGroup];
    }
  }

  $scope.removeUserGroupFromRequest = function(userGroup, details) {
    var groupIndex = details.userGroups.indexOf(userGroup);
    if(groupIndex != -1) {
      details.userGroups.splice(groupIndex, 1);
    }
  }

  $scope.addUserToRequest = function(details) {
    var newUser = $scope.userEmail;
    if(details.userList) {
      if(details.userList.indexOf(newUser) == -1) {
        details.userList.push(newUser);
      }
    }
    else {
      details.userList = [newUser];
    }
  }
  $scope.removeUserFromRequest  = function(userEmail, details) {
    var userIndex = details.userList.indexOf(userEmail);
    if(userIndex != -1) {
      details.userList.splice(userIndex, 1);
    }
  }

});