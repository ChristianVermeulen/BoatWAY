angular.module('boatway')

    .controller('ResourcesCtrl', function ($scope,
                                          UserProfile,
                                          $interval,
                                          $state) {
        $scope.$on('$ionicView.enter', function(a,b) {
            console.log(a);
            console.log(b);
        });
    });
