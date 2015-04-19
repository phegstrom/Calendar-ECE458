app.controller('ssuModalController', function($scope, $http, $q, $modalInstance, $rootScope, modalService) {

  this.modalService = modalService;

  var MINUTE = 1000*60; //ms * sec

  $scope.ssuDetails = {};

  $scope.cancel = function(){
    $modalInstance.dismiss('cancel');
  };

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

    if(ssuDetails.preferenceBased || ssuDetails.evMaxDuration == undefined) {
      ssuDetails.evMaxDuration = minimumTime;
    }
    else if(ssuDetails.evMaxDuration % minimumTime != 0) {
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

      $scope.cancel();
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
    console.log('WTF');
    if(!$scope.selectedSsu.preferenceBased && $scope.selectedSsuSlots.length >= $scope.selectedSsu.maxPerUser) {
      console.log('not prefbased');
      return;
    }
    else if($scope.selectedSsu.preferenceBased && $scope.selectedSsu.preferenceComplete) {
      console.log('prefComplete');
      return;
    }

    console.log(selectedBlock);
    $http.put('/ssu/signUp/' + ssuId, selectedBlock).
    success(function(data, status, headers, config) {
      console.log(data);
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
      if(!newSsu.preferenceBased) {
        oldAttendee.slots.push(newSlot);
      }
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
  $scope.removeUserFromRequest = function(userEmail, details) {
    var userIndex = details.userList.indexOf(userEmail);
    if(userIndex != -1) {
      details.userList.splice(userIndex, 1);
    }
  }

  $scope.moveSsu = function(slot, direction) {

    var movement = 0;
    if (direction == 'up'){
      movement = -1;
    }
    else if (direction == 'down') {
      movement = 1;
    }

    var oldSlotIndex = $rootScope.selectedTimeSlots.indexOf(slot);

    if(oldSlotIndex != -1) {

      if(oldSlotIndex + movement >= 0 && oldSlotIndex + movement < $rootScope.selectedTimeSlots.length) {
        var reorderedSlots = [];

        for(var index=0; index < $rootScope.selectedTimeSlots.length; index++) {
          reorderedSlots.push($rootScope.selectedTimeSlots[index]._id);
        }

        console.log(reorderedSlots);

        swap(reorderedSlots, oldSlotIndex, oldSlotIndex + movement);

        var reorderRequest = {
          slots: reorderedSlots,
          ssuId: $rootScope.selectedSsu._id
        };

        console.log(reorderedSlots);

        $http.put('/ssu/reorder', reorderRequest).
        success(function(data, status, headers, config) {
          console.log(data);
          swap($rootScope.selectedTimeSlots, oldSlotIndex, oldSlotIndex + movement);
        }).
        error(function(data, status, headers, config) {
          console.log('Failed to reorder SSUs');
        });
      }
    }
  }

  var swap = function(list, index1, index2) {
    var temp = list[index1];
    list[index1] = list[index2];
    list[index2] = temp;
  }
  
  $scope.resolveSsuData = function(resolutionDetails) {
    //do the make user object thing
    var requestDetails = {
      ssuId: $rootScope.selectedSsu._id,
      users: []
    }

    console.log(resolutionDetails);

    for(var slotIndex = 0; slotIndex < resolutionDetails.slots.length; slotIndex++) {
      var slot = resolutionDetails.slots[slotIndex];

      //The userEmail selected is actually an attendee object instead of the email itself
      resolutionDetails.slots[slotIndex].userEmail = slot.userEmail.useremail;
    }

    var usersAssigned = [];
    for(var slotIndex = 0; slotIndex < resolutionDetails.slots.length; slotIndex++) {
      var slot = resolutionDetails.slots[slotIndex];
      if(slot.userEmail && slot.userEmail != '' && users.indexOf(slot.userEmail) == -1) {
        requestDetails.users.push(slot);
        usersAssigned.push(slot.userEmail);
      }
    }
    //do the http thing
    $http.put('/ssu/resolve', requestDetails).
    success(function(data, status, headers, config) {
      var newSsu = angular.fromJson(data);
      $rootScope.selectedSsu = newSsu;
    }).
    error(function(data, status, headers, config) {
      console.log('Failed to resolve sign-ups.');
    });
  }

});