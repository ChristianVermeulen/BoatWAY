angular.module('boatway')

    .controller('ListViewCtrl', function ($scope,
                                          $rootScope,
                                          Ships,
                                          UserProfile,
                                          $ionicModal,
                                          $interval,
                                          $http) {
        var myShip = UserProfile.getShip();
        var shipsToLoad = 0;
        var refreshInterval;
        var lastUpdate = 100;
        $scope.shipsFromBehind = [];
        $scope.shipsFromFront = [];
        $scope.userLocation = myShip;
        $scope.service = UserProfile;


        // Prepare modal popup for shipDetails
        $ionicModal.fromTemplateUrl('templates/modalShipDetail.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {$scope.modal = modal;});
        $scope.openModal = function (){$scope.modal.show()}
        $scope.closeModal = function () {$scope.modal.hide();};
        $scope.$on('$destroy', function () {$scope.modal.remove();});

        // Location has been updates, so recalculate everything
        $scope.$watchCollection('service.getShip().location', function (newVal) {
            refreshView();
        });

        // When view loads, connect all listeners and eventhandlers
        $scope.$on('$ionicView.enter', function() {

            // Regular 1 minute interval
            refreshInterval = $interval(function () {
                refreshView();
            }, 1000 * 60);

            // Immediately trigger a refresh;
            refreshView();
        });

        $scope.$on('$ionicView.leave', function () {
            $interval.cancel(refreshInterval);
        });

        /*
         * Retrieve position updates & command ships in radius of 5km
         * and start the filtering process to show relevant ships in the list
         *
         * @return  none
         */
        function refreshView() {
            var d = new Date();
            var diff = d.getTime() - lastUpdate;
            diff = diff / 1000;

            if (shipsToLoad == 0 && diff >= 60) {
                lastUpdate = d.getTime();

                if(ionic.Platform.isIOS())
                {
                    ProgressIndicator.showSimple();
                }
                else
                {
                    ProgressIndicator.show("Scherm Verversen");
                }

                shipsToLoad=-1;
                myShip = UserProfile.getShip();
                $scope.ship = myShip;
                $scope.shipsFromBehind = [];
                $scope.shipsFromFront = [];
                Ships.getInRadius(myShip.location, 5000).then(retrieveShipsDetails);
            }
        }

        /*
         * Retrieve details for every ship
         *
         * @param   data    JSON string of all ships in radius
         */
        function retrieveShipsDetails(data) {
            var ships = Object.keys(data.data);

            shipsToLoad = ships.length; // Set a countdown to stop simultaneous requests from happening

            for (var i = 0; i < ships.length; i++) {
                Ships.getMMSI(ships[i]).then(filterMovingShip, function(reason){
                    console.log("Failed to get MMSI because: "+reason);
                    shipsToLoad--;
                    if(shipsToLoad == 0) {
                        ProgressIndicator.hide();
                    }
                });
            }
        }

        /*
         * Check if the ship is moving or not in order to determine
         * whether it is relevant for future calculations
         *
         * @param   ship    A JSON with the data of the ship
         */
        function filterMovingShip(ship) {
            ship = ship.data;

            shipsToLoad--; // Decrement the countdown so we end up with 0 after the last ship.
            if(shipsToLoad == 0){
                ProgressIndicator.hide();
                var d = new Date();
                var front = {
                    me: myShip,
                    timeStamp: d.getTime(),
                    others: []
                };

                var behind = {
                    me: myShip,
                    timeStamp: d.getTime(),
                    others: []
                };

                for(var i=0; i<$scope.shipsFromFront.length; i++){
                    front.others.push(JSON.stringify($scope.shipsFromFront[i]));
                }

                for(var i=0; i<$scope.shipsFromBehind.length; i++){
                    behind.others.push(JSON.stringify($scope.shipsFromBehind[i]));
                }

                $http({
                    url: 'https://api.mongolab.com/api/1/databases/boatway/collections/fromfront?apiKey=f8fSLZc7mmyHJgmk4WzBuDb2AtVlZoL0',
                    method: 'POST',
                    data: JSON.stringify(front)
                })
                .success(function (data, status, headers, config) {
                    //
                })
                .error(function (data, status, headers, config) {
                    console.log(status);
                });
                $http({
                    url: 'https://api.mongolab.com/api/1/databases/boatway/collections/frombehind?apiKey=f8fSLZc7mmyHJgmk4WzBuDb2AtVlZoL0',
                    method: 'POST',
                    data: JSON.stringify(behind)
                })
                .success(function (data, status, headers, config) {
                    //
                })
                .error(function (data, status, headers, config) {
                    console.log(status);
                });
            }

            if (ship.status != 'MOORED' && ship.speedOverGround != 0) {
                filterShipFromBehind(ship);
            }
        }

        /*
         * Check if the ship is behind us or in front of us
         * and add it to the correct array
         *
         * @param   ship    object of the ship to be checked
         */
        function filterShipFromBehind(ship) {
            // Get our and the ships latlon
            var shipLatLon = new LatLon(ship.location.latitude, ship.location.longitude);
            var myLatLon = new LatLon(myShip.location.latitude, myShip.location.longitude);


            var bearing = myLatLon.bearingTo(shipLatLon);
            var difference = Ships.normalizeAngle(bearing - myShip.courseOverGround);

            // Finally check if the relative bearing is between 90 and 270 degrees
            // indicating it is behind us
            if (difference > 90 && difference < 270) {
                ship.relativePosition = "behind";
                filterShipAtCourse(ship);
            }
            else if (difference < 90 || difference > 270) {
                ship.relativePosition = "front";
                filterShipAtCourse(ship);
            }
        }

        /*
         * Checks if the ship is at the same course either in front or behind
         *
         * @param   ship    object of the ship to be checked
         */
        function filterShipAtCourse(ship) {
            // Check if we need to invert the course to see if ship is relevant
            if (ship.relativePosition == "front" && ship.courseOverGround <= 180) {
                ship.courseOverGround += 180;
            }
            else if (ship.relativePosition == "front" && ship.courseOverGround > 180) {
                ship.courseOverGround -= 180;
            }

            // Prepare min and max courses
            var myMinCourse = myShip.courseOverGround;
            var myMaxCourse = myShip.courseOverGround;
            var shipMinCourse = ship.courseOverGround;
            var shipMaxCourse = ship.courseOverGround;

            // Check if we are at the virge of 0 or 360 degrees and normalize
            if (myMinCourse > 270) myMinCourse -= 360;
            if (myMaxCourse > 270) myMaxCourse -= 360;
            if (shipMinCourse > 270) shipMinCourse -= 360;
            if (shipMaxCourse > 270) shipMaxCourse -= 360;

            // Create overlap zone
            myMinCourse -= 45;
            myMaxCourse += 45;
            shipMinCourse -= 45;
            shipMaxCourse += 45;

            // Only use ships have +/- 45 degrees the same course
            if ((shipMinCourse > myMinCourse && shipMinCourse < myMaxCourse) ||
                (shipMaxCourse > myMinCourse && shipMaxCourse < myMaxCourse)) {
                filterShipNearing(ship);
            }
        }

        /*
         * Checks if the ship is actually getting closer to us
         *
         * @param   ship    object of the ship to be checked
         */
        function filterShipNearing(ship) {
            var mySpeed = myShip.speedOverGround; // km/h

            var current = ship;
            var currentSpeed = current.speedOverGround * 1.852; // knots -> km/h

            // Only use ships who are nearing towards us
            if (currentSpeed > mySpeed) {
                calculateTTI(current);
            }
        }

        /*
         * Calculate the Time To Impact to see how long it takes for the ship to pass us.
         *
         * @param   ship    object of the ship to be checked
         */
        function calculateTTI(ship) {
            var d = new Date();
            var mySpeed = myShip.speedOverGround; // km/h
            var current = ship;
            var currentSpeed = current.speedOverGround * 1.852; // knots -> km/h
            var distance = Ships.distanceToMe(current.location, myShip.location); // meter

            if (ship.relativePosition == "front") {
                var speed = ((currentSpeed + mySpeed) * 1000) / 60; // meter per minute
            }
            else if (ship.relativePosition == "behind") {
                var speed = ((currentSpeed - mySpeed) * 1000) / 60; // meter per minute
            }

            var tti = Math.round(distance / speed); // amount of minutes
            current.distance = Math.round(distance);
            current.tti = tti;
            current.expectedImpact = d.getTime() + (tti * 60 * 1000);
            current.speedDiff = (currentSpeed - mySpeed);
            current.relativeSpeed = Math.round(speed);
            current.speedOverGround = Math.round(current.speedOverGround * 1.852);

            if (ship.relativePosition == "behind" && $scope.shipsFromBehind.length <= 4 && ship.tti < 20) {
                $scope.shipsFromBehind.push(current);
                Ships.setShipsFromBehind($scope.shipsFromBehind);
            }
            if (ship.relativePosition == "front" && $scope.shipsFromFront.length <= 4 && ship.tti < 20) {
                $scope.shipsFromFront.push(current);
                Ships.setShipsFromFront($scope.shipsFromFront);
            }

        }

        /*
         * Show ship detail in modal popup
         *
         * @param   mmsi string of the ships mmsi to show details for
         */
        $scope.shipDetail = function (mmsi) {
            Ships.getMMSI(mmsi).then(function (data) {
                ship = data.data;
                ship.tti = Ships.getShipTTI(ship.mmsi);
                ship.length = ship.positionOfTransponder.distanceToBow + ship.positionOfTransponder.distanceToStern;
                ship.width = ship.positionOfTransponder.distanceToPort + ship.positionOfTransponder.distanceToStarboard;
                ship.speedOverGround = Math.round(ship.speedOverGround * 1.852);
                $scope.shipDetails = ship;
                $scope.shipDetails.distance = Ships.distanceToMe(ship.location, myShip.location);
                $scope.openModal();
            });
        }
    });
