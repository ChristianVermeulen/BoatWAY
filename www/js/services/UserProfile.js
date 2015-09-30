angular.module('boatway')
    .factory('UserProfile', function ($rootScope) {

        // Set a shipholder and version number
        var ship = false;
        var currentVersion = 7;

        // In case there is no profile, start a clean one
        var cleanShip = {
            lastAppVersion: 6,
            positionOfTransponder: {
                distanceToBow: '',
                distanceToStern: '',
                distanceToPort: '',
                distanceToStarboard: ''
            },
            location: {
                latitude: 0,
                longitude: 0
            },
            maxDraught: 0,
            destination: "",
            mmsi: "0",
            name: "",
            speedOverGround: 0,
            courseOverGround: 0,
            timeLastUpdate: 0,
            markersAsArrow: true
        };

        // See if er can get a ship from memory
        if (localStorage.getItem("myShip")) {
            ship = JSON.parse(localStorage.getItem("myShip"));
        }

        // In case we have a new version of the app, clear the user profile.
        if(!ship || ship.lastAppVersion < currentVersion || ship.lastAppVersion == undefined) {
            ship = cleanShip;
            ship.lastAppVersion = currentVersion;
            localStorage.setItem("myShip", JSON.stringify(ship));
        }

        return {
            /**
             * Get the user ship
             * @returns {ship}
             */
            getShip: function () {
                return ship
            },

            /**
             * Set the user location and heading
             * @param loc
             */
            setLocation: function (loc) {
                ship.location.latitude = loc.coords.latitude;
                ship.location.longitude = loc.coords.longitude;
                ship.timeLastUpdate = loc.timestamp;

                // Check if we have a speed from GPS
                if (loc.coords.speed != null) {
                    ship.speedOverGround = loc.coords.speed * 3.6; // km/h
                    ship.speedOverGround = parseFloat(ship.speedOverGround.toFixed(2));
                }

                // Check if we have a heading from GPS
                if (loc.coords.heading != null) {
                    ship.courseOverGround = loc.coords.heading;
                }

                this.saveUser();

                // Trigger a rootscope update
                $rootScope.$apply();
            },

            /**
             * Save the user to the local storage
             */
            saveUser: function () {
                localStorage.setItem("myShip", JSON.stringify(ship));
            }
        };
    })
