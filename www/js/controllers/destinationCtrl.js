angular.module('boatway')

    .controller('DestinationCtrl', function ($scope, UserProfile) {

        $scope.myShip = UserProfile.getShip();

        if($scope.myShip.name != "")
        {
            $scope.nextPage = "#/app/map-view";
        }
        else
        {
            $scope.nextPage = "#/boat-details";
        }
    });
