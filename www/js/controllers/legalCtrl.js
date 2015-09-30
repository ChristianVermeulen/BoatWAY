angular.module('boatway')

    .controller('LegalCtrl', function ($scope, UserProfile, $cordovaAppVersion) {
        $scope.appVersion = "0.0.0";
        document.addEventListener("deviceready", function () {
            $cordovaAppVersion.getAppVersion().then(function (version) {
                $scope.appVersion = version;
            });
        }, false);
    });
