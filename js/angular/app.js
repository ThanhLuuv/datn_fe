// AngularJS Application Module
var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

// Route Configuration
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'app/views/home.html',
            controller: 'HomeController'
        })
        .when('/home', {
            templateUrl: 'app/views/home.html',
            controller: 'HomeController'
        })
        .when('/about', {
            templateUrl: 'app/views/about.html',
            controller: 'AboutController'
        })
        .when('/contact', {
            templateUrl: 'app/views/contact.html',
            controller: 'ContactController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

// Global Configuration
app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('!');
}]);

// Run Block
app.run(['$rootScope', function($rootScope) {
    $rootScope.appName = 'My AngularJS App';
    $rootScope.version = '1.0.0';
    
    // Global loading state
    $rootScope.loading = false;
    
    // Global error handler
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
        console.error('Route change error:', rejection);
    });
}]);
