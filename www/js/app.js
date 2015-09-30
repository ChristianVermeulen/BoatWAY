// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('boatway', ['ionic', 'boatway.services', 'ngCordova'])

    .run(function ($ionicPlatform, UserProfile) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

            // Settings for location
            var watchOptions = {
                frequency: 5000,
                timeout: 5000,
                enableHighAccuracy: true // may cause errors if true
            };

            // Connect the watchPosition
            navigator.geolocation.watchPosition(newPosition, errPosition, watchOptions);

            // On new position save it to the service
            function newPosition(pos) {
                UserProfile.setLocation(pos);
            }

            // Oops, no position!
            function errPosition(err) {
                console.log(err);
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {

        $stateProvider

            .state('legal', {
                url: "/legal",
                templateUrl: "templates/legal.html",
                controller: 'LegalCtrl'
            })

            .state('about', {
                url: "/about",
                templateUrl: "templates/about.html",
                controller: 'AboutCtrl'
            })

            .state('destination', {
                url: "/destination",
                templateUrl: "templates/first-run/destination.html",
                controller: 'DestinationCtrl'
            })

            .state('boatDetails', {
                url: "/boat-details",
                templateUrl: "templates/first-run/boat-details.html",
                controller: 'BoatDetailsCtrl'
            })

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })

            .state('app.mapView', {
                url: "/map-view",
                views: {
                    'menuContent': {
                        templateUrl: "templates/mapview.html",
                        controller: 'MapViewCtrl'
                    }
                }
            })

            .state('app.listView', {
                url: "/list-view",
                views: {
                    'menuContent': {
                        templateUrl: "templates/listview.html",
                        controller: 'ListViewCtrl'
                    }
                }
            })

            .state('app.alerts', {
                url: "/alerts",
                views: {
                    'menuContent': {
                        templateUrl: "templates/alerts.html"
                    }
                }
            })

            .state('app.profile', {
                url: "/profile",
                views: {
                    'menuContent': {
                        templateUrl: "templates/profile.html",
                        controller: 'ProfileCtrl'
                    }
                }
            })

            .state('app.playlists', {
                url: "/playlists",
                views: {
                    'menuContent': {
                        templateUrl: "templates/playlists.html",
                        controller: 'PlaylistsCtrl'
                    }
                }
            })

            .state('app.single', {
                url: "/playlists/:playlistId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/playlist.html",
                        controller: 'PlaylistCtrl'
                    }
                }
            })

            .state('resources', {
                url: "/resources",
                templateUrl: "templates/resources.html",
                controller: "ResourcesCtrl"
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/legal');
    });
