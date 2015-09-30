angular.module('boatway')

    .controller('AboutCtrl', function ($scope, UserProfile, $cordovaAppVersion, $ionicHistory) {
        $scope.appVersion = "0.0.0";
        document.addEventListener("deviceready", function () {
            $cordovaAppVersion.getAppVersion().then(function (version) {
                $scope.appVersion = version;
            });
        }, false);

        $scope.goBack = function(){
            console.log( $ionicHistory.viewHistory().histories.ion3.stack[0].url );
            window.location = "#"+$ionicHistory.viewHistory().histories.ion3.stack[0].url;
        }
    });