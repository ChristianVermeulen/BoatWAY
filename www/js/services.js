angular.module('boatway.services', [])

    .factory('AuthToken', ['$http', function ($http, $q) {
        var token;

        function getToken() {
            if (angular.isDefined(token)) return $q.when(token);

            return $http
                .post('http://backend.teqplay.nl:9090/auth/login',
                {username: 'boatway', password: 'XXXXXXXX'})
                .then(function (data) {
                    token = data.data.token;
                    $http.defaults.headers.get = {'Authorization': token};
                    return token;
                });
        }

        return {
            getToken: getToken(),
        }
    }]);
