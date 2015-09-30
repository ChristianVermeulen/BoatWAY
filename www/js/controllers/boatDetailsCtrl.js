angular.module('boatway')

    .controller('BoatDetailsCtrl', function ($scope, UserProfile) {

        $scope.myShip = UserProfile.getShip();
        $scope.update = function(){
            UserProfile.saveUser();
        }
    });
