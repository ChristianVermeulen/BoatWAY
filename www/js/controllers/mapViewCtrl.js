angular.module('boatway')

    .controller('MapViewCtrl', function ($scope,
                                         $rootScope,
                                         $ionicLoading,
                                         MapStyle,
                                         Ships,
                                         UserProfile,
                                         $ionicModal,
                                         $interval) {

        // Prepare modal popup for shipDetails
        $ionicModal.fromTemplateUrl('templates/modalShipDetail.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function () {$scope.modal.show();}
        $scope.closeModal = function () {$scope.modal.hide();};
        $scope.$on('$destroy', function () {$scope.modal.remove();});

        // set vars for later
        var myLatlng = new google.maps.LatLng(0, 0);
        var markers = [];
        var myShipMarker;
        var myShipLocation;
        var myShip = UserProfile.getShip();
        var lastUpdate=100;
        var refreshInterval;
        $scope.ship = {};
        $scope.myLocation = [0, 0];
        $scope.centerChanged = false;
        $scope.service = UserProfile;

        // Set options for the map
        var mapOptions = {
            center: myLatlng,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true
        };

        // Create the map and add to scope
        var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        $scope.map = map;

        // Style the map to be less aggresive
        map.setOptions({styles: MapStyle.getStyle()});

        // Update map bounds when user drags and set a flag to not reset center on refresh
        google.maps.event.addListener(map, 'dragend', function () {
            $scope.updateShips(false, true);
            $scope.centerChanged = true;
        });

        // Update the map when center changed, this should not touch the centerChanged
        // flag since this is not user inflicted
        google.maps.event.addListener(map, 'center_changed', function () {
            $scope.updateShips(false);
        });

        // Watch the user location for changes and call
        $scope.$watchCollection('service.getShip().location', function (newVal) {
            $scope.newPosition();
        }, true);

        // When entering the view reconnect the interval
        // Also trigger a refresh
        $scope.$on('$ionicView.enter', function readyToTrick() {
            refreshInterval = $interval(function () {
                $scope.updateShips();
            }, 1000 * 60);
            $scope.newPosition();
        });

        // When leaving the view we need to get rid of the interval
        $scope.$on('$ionicView.leave', function () {
            lastUpdate = 100;
            $interval.cancel(refreshInterval);
        });

        /*
         * Update the position of our own ship
         *
         */
        $scope.newPosition = function () {
            myShip = UserProfile.getShip();
            $scope.ship = UserProfile.getShip();

            myShipLocation = new google.maps.LatLng(myShip.location.latitude, myShip.location.longitude)
            if ($scope.centerChanged == false) {
                map.panTo(myShipLocation); // only pan the map if the user is nog looking around manually
            }
            if (myShipMarker) {
                myShipMarker.setMap(null);
            }
            drawShip(myShip, true);
        };

        /*
         * Clear Ships of the map and
         * clear all markers and delete from internal cache
         *
         */
        function clearShips() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
                google.maps.event.clearListeners(markers[i], "click");
            }
            markers = [];
        }

        /*
         * Filter all ships which are not moving or MOORED
         *
         * @param   data    JSON object with all found ships
         */
        function filterShips(data) {
            clearShips();
            var ships = data.data;

            for (var i = 0; i < ships.length; i++) {
                var current = ships[i];

                if (current.status != 'MOORED' && current.speedOverGround != 0) {
                    drawShip(current);
                }
            }
        }

        function drawShip(ship, isMyShip) {

            // Calculate breadth and length
            var length = ship.positionOfTransponder.distanceToBow + ship.positionOfTransponder.distanceToStern;
            var width = ship.positionOfTransponder.distanceToPort + ship.positionOfTransponder.distanceToStarboard;

            // Calculate Polygon
            ship.shipPolygonPoints = Ships.calculatePolygonSizeAndRotationOnMap(
                ship.location.latitude,
                ship.location.longitude,
                length,
                width,
                ship.courseOverGround
            );

            // Choose color for my ship or other ship
            if(isMyShip){color = "#00FF00";}else{color="#FF0000";}

            if(myShip.markersAsArrow){
                var image = {
                    path: 'M 1 0 L 2 4 L 0 4 L 1 0 z',
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: color,
                    strokeWeight:0,
                    scale: 4,
                    rotation: ship.courseOverGround,
                    anchor: new google.maps.Point(1,2)
                };
                var position = new google.maps.LatLng(ship.location.latitude, ship.location.longitude);
                var shipMarker = new google.maps.Marker({
                    title: ship.name,
                    name: ship.name,
                    mmsi: ship.mmsi,
                    position: position,
                    shipLocation: ship.location,
                    destination: ship.destination,
                    speedOverGround: ship.speedOverGround,
                    length: length,
                    width: width,
                    maxDraught: ship.maxDraught,
                    icon: image
                });
            }
            else
            {
                var shipMarker = new google.maps.Polygon({
                    paths: ship.shipPolygonPoints,
                    strokeColor: color,
                    strokeOpacity: 0.8,
                    strokeWeight: 0,
                    fillColor: color,
                    fillOpacity: 0.8,
                    title: ship.name,
                    name: ship.name,
                    mmsi: ship.mmsi,
                    shipLocation: ship.location,
                    destination: ship.destination,
                    speedOverGround: ship.speedOverGround,
                    length: length,
                    width: width,
                    maxDraught: ship.maxDraught
                });
            }

            // Add polygon to map
            shipMarker.setMap(map);

            // Connect click listener
            google.maps.event.addListener(shipMarker, 'click', function () {
                showShipDetails(this);
            });

            // Add to the collection or my ship marker
            if (!isMyShip) {
                markers.push(shipMarker);
            }
            else {
                myShipMarker = shipMarker;
            }
        }
        /*
         * Draw a ship on the map
         *
         * @param   ship    Obj of the ship to be drawn
         * @param   isMyShip    true / false to draw in green
         */

        /*
         * Show ship detail in modal popup
         *
         * @param   shipMarker  The marker obj of Google Maps with all ship info
         */
        function showShipDetails(shipMarker) {
            $scope.shipDetails = shipMarker;
            $scope.shipDetails.tti = Ships.getShipTTI(shipMarker.mmsi);
            $scope.shipDetails.distance = Ships.distanceToMe(shipMarker.shipLocation, myShip.location);
            $scope.shipDetails.speedOverGround = Math.round($scope.shipDetails.speedOverGround * 1.852);
            $scope.openModal();
        }

        /*
         * Center the map back on the user
         */
        $scope.centerOnMe = function () {
            map.panTo(myShipLocation);
            $scope.centerChanged = false;
        }

        /*
         * Update all ships in current view
         *
         * @param   forced  set true if it is by user request to show toast messages
         * @param   overwrite   if set to true will overwrite the last update timer.
         */
        $scope.updateShips = function (forced, overwrite) {
            var d = new Date();
            var diff = d.getTime() - lastUpdate;
            diff = diff / 1000;

            if(diff >= 60 || overwrite){
                window.plugins.toast.showShortBottom("Kaart wordt geupdate.");
                lastUpdate = d.getTime();
                Ships
                    .getInBounds($scope.map.getBounds())
                    .then(filterShips);
            }
            else
            {
                if(forced)
                {
                    var seconds = Math.round(60 - diff);
                    window.plugins.toast.showShortBottom("Er kan pas over "+seconds+" seconden weer geupdate worden.");
                }
            }
        }
    });
