angular.module('boatway')

.controller('ProfileCtrl', function($scope, UserProfile)
{
    $scope.myShip = UserProfile.getShip();
    $scope.update = function(){
        UserProfile.saveUser();
    }
    $scope.$watch(function(){return UserProfile.getShip().location;}, function(newVal) {
        console.log("UserProfile ship change triggered");
    }, true);
});
