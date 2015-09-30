angular.module('boatway')
    .factory('Ships', ['$http', function ($http) {
        var fromBehind = [];
        var fromFront = [];

        return {
            /**
             * Set new list of ships from behind
             *
             * @param   behind array of all ships behind
             */
            setShipsFromBehind: function(behind){
                fromBehind = behind;
            },

            /**
             * Set new list of ships from behind
             *
             * @param   front array of all ships behind
             */
            setShipsFromFront: function(front){
                fromFront = front;
            },

            /**
             * Return the amount of minutes until a ship passes
             * If not relevant (because moving away or not found) this will return false
             *
             * @param   mmsi    a string with the MMSI number to be checked
             */
            getShipTTI: function(mmsi){
                var tti = false;

                for(var i=0;i<fromFront.length;i++){
                    if(fromFront[i].mmsi == mmsi){
                        tti = fromFront[i].tti;
                    }
                }
                for(var i=0;i<fromBehind.length;i++){
                    if(fromBehind[i].mmsi == mmsi){
                        tti = fromBehind[i].tti;
                    }
                }

                return tti;
            },

            /*****
             * Retrieve all ships within a bounding box
             *
             * @param: bounds
             ******/
            getInBounds: function (bounds) {
                var ne = bounds.getNorthEast(); // LatLng of the north-east corner
                var sw = bounds.getSouthWest(); // LatLng of the south-west corder
                return $http({
                    url: 'http://backend.teqplay.nl:9090/ship/details',
                    method: 'GET',
                    params: {
                        bottomRightLat: sw.lat(),
                        bottomRightLon: ne.lng(),
                        topLeftLat: ne.lat(),
                        topLeftLon: sw.lng()
                    }
                })
                    .success(function (data, status, headers, config) {
                        return data;
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            },

            /*****
             * Retrieve all ships within a circle
             *
             * @param: location
             * @param: radius
             ******/
            getInRadius: function (location, radius) {

                return $http({
                    url: 'http://backend.teqplay.nl:9090/ship/circle',
                    method: 'GET',
                    params: {
                        lat: location.latitude,
                        lon: location.longitude,
                        radius: radius
                    }
                })
                    .success(function (data, status, headers, config) {
                        return data;
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            },

            /*****
             * Retrieve a ships details from MMSI
             *
             * @param: mmsi
             ******/
            getMMSI: function (mmsi) {
                return $http({
                    url: 'http://backend.teqplay.nl:9090/ship/' + mmsi,
                    method: 'GET'
                })
                    .success(function (data, status, headers, config) {
                        return data;
                    })
                    .error(function (data, status, headers, config) {
                        console.log(data);
                    });
            },

            /**
             * Calculates the correct lat's&lon's & rotation for all four corners of the ship based on ship's center latlon, ship size & heading
             *
             * Shamelessly stolen from Bram Giessen
             * https://bitbucket.org/teqplay/vts-operators-inzicht-veiligheid
             *
             * @param shipLat
             * @param shipLon
             * @param shipLength
             * @param shipWidth
             * @param shipHeading
             * @returns {*[]}
             */
            calculatePolygonSizeAndRotationOnMap: function (shipLat, shipLon, shipLength, shipWidth, shipHeading) {
                //Calculate ship size based on center lat and lon
                var ship_lt_lat = shipLat + (((shipLength / 2) / 1000) / 6378 ) * (180 / Math.PI);
                var ship_lt_lon = shipLon - (((shipWidth / 2) / 1000) / 6378 ) * (180 / Math.PI) / Math.cos(shipLat * Math.PI / 180);

                var ship_rt_lat = shipLat + (((shipLength / 2) / 1000) / 6378 ) * (180 / Math.PI);
                var ship_rt_lon = shipLon + (((shipWidth / 2) / 1000) / 6378 ) * (180 / Math.PI) / Math.cos(shipLat * Math.PI / 180);

                var ship_lb_lat = shipLat - (((shipLength / 2) / 1000) / 6378 ) * (180 / Math.PI);
                var ship_lb_lon = shipLon - (((shipWidth / 2) / 1000) / 6378 ) * (180 / Math.PI) / Math.cos(shipLat * Math.PI / 180);

                var ship_rb_lat = shipLat - (((shipLength / 2) / 1000) / 6378 ) * (180 / Math.PI);
                var ship_rb_lon = shipLon + (((shipWidth / 2) / 1000) / 6378 ) * (180 / Math.PI) / Math.cos(shipLat * Math.PI / 180);

                var ship_tip_lat = shipLat + ((((shipLength / 2) + (shipLength / 5)) / 1000) / 6378 ) * (180 / Math.PI);
                var ship_tip_lon = shipLon;


                var p1 = this.rotateShipOnMap(shipHeading, shipLat, shipLon, ship_lt_lat, ship_lt_lon),
                    p2 = this.rotateShipOnMap(shipHeading, shipLat, shipLon, ship_rt_lat, ship_rt_lon),
                    p3 = this.rotateShipOnMap(shipHeading, shipLat, shipLon, ship_lb_lat, ship_lb_lon),
                    p4 = this.rotateShipOnMap(shipHeading, shipLat, shipLon, ship_rb_lat, ship_rb_lon),
                    p5 = this.rotateShipOnMap(shipHeading, shipLat, shipLon, ship_tip_lat, ship_tip_lon),
                    polygonPoints = [p5, p1, p3, p4, p2];

                return polygonPoints;
            },

            /**
             * Calculate new polygon points based on ships rotation ships center lat&lon (rotation point) and the lat&lon of the point to be rotated
             * Gets called for all points of polygon
             *
             * Shamelessly stolen from Bram Giessen
             * https://bitbucket.org/teqplay/vts-operators-inzicht-veiligheid
             *
             * @param angle
             * @param origin_lat
             * @param origin_lon
             * @param new_lat
             * @param new_lon
             * @returns {L.LatLng}
             */
            rotateShipOnMap: function (angle, origin_lat, origin_lon, new_lat, new_lon) {
                var radianAngle = angle * (Math.PI / 180);

                var radius = this.distanceForPolygon(origin_lat, origin_lon, new_lat, new_lon);
                var theta = radianAngle + Math.atan2(new_lon - origin_lon, new_lat - origin_lat);

                var x = origin_lat + (radius * Math.cos(theta));
                var y = origin_lon + (radius * Math.sin(theta));

                return new google.maps.LatLng(x, y);
            },

            /**
             * calculate distance between two points on map
             *
             * Shamelessly stolen from Bram Giessen
             * https://bitbucket.org/teqplay/vts-operators-inzicht-veiligheid
             *
             * @param origin_lat
             * @param origin_lon
             * @param new_lat
             * @param new_lon
             * @returns {number}
             */
            distanceForPolygon: function (origin_lat, origin_lon, new_lat, new_lon) {
                var lat = Math.pow(new_lat - origin_lat, 2);
                var lng = Math.pow(new_lon - origin_lon, 2);

                return Math.sqrt(lat + lng);
            },

            /**
             * Calculate the distance of the ship to ourselves
             *
             * @param location{lat, long}
             * @returns distance
             */
            distanceToMe: function (shipLocation, myLocation) {
                var R = 6378.137; // Radius of earth in KM
                var dLat = (shipLocation.latitude - myLocation.latitude) * Math.PI / 180;
                var dLon = (shipLocation.longitude - myLocation.longitude) * Math.PI / 180;
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(myLocation.latitude * Math.PI / 180) * Math.cos(shipLocation.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c;
                return Math.round(d * 1000); // meters
            },

            /***********
             * Normalize negative degrees for course.
             *
             ************/
            normalizeAngle: function (angle) {
                var newAngle = angle;
                if (newAngle < 0) {
                    newAngle += 360;
                }
                return newAngle;
            }
        }

    }]);