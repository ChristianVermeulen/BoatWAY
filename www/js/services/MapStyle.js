angular.module('boatway')

    .factory('MapStyle', function () {
        return {
            getStyle: function () {
                return [{
                    "featureType": "administrative",
                    "elementType": "all",
                    "stylers": [{"visibility": "off"}]
                }, {
                    "featureType": "landscape",
                    "elementType": "all",
                    "stylers": [{"visibility": "on"}, {"color": "#063c6b"}]
                }, {
                    "featureType": "poi",
                    "elementType": "all",
                    "stylers": [{"visibility": "off"}]
                }, {
                    "featureType": "road",
                    "elementType": "all",
                    "stylers": [{"visibility": "off"}]
                }, {
                    "featureType": "transit",
                    "elementType": "all",
                    "stylers": [{"visibility": "off"}]
                }, {
                    "featureType": "water",
                    "elementType": "all",
                    "stylers": [{"color": "#FFFFFF"}]
                }, {"featureType": "water", "elementType": "labels.text.fill", "stylers": [{"color": "#063c6b"}]}];
            }
        };
    })
