// AngularJS Application Module - Simplified for Vercel
console.log('Loading AngularJS app...');

var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

console.log('AngularJS app module created');

// Global controller for navbar visibility
app.controller('AppController', ['$scope', '$location', function($scope, $location) {
    console.log('AppController loaded');
    $scope.isAdminPage = false;
    $scope.isAuthPage = false;
    $scope.searchQuery = '';
    $scope.cartCount = 0;
    $scope.isAuthenticated = false;

    $scope.goSearch = function() {
        var q = ($scope.searchQuery || '').trim();
        $location.path('/search').search({ q: q, page: 1, pageSize: 12 });
    };

    $scope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        $scope.isAdminPage = path.indexOf('/admin') === 0;
        $scope.isAuthPage = (path === '/login' || path === '/register');
    });
}]);

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
        .when('/login', {
            templateUrl: 'app/views/login.html',
            controller: 'LoginController'
        })
        .when('/register', {
            templateUrl: 'app/views/register.html',
            controller: 'RegisterController'
        })
        .when('/about', {
            templateUrl: 'app/views/about.html',
            controller: 'AboutController'
        })
        .when('/contact', {
            templateUrl: 'app/views/contact.html',
            controller: 'ContactController'
        })
        .when('/search', {
            templateUrl: 'app/views/search.html',
            controller: 'SearchController'
        })
        .when('/api-test', {
            templateUrl: 'app/views/api-test.html',
            controller: 'ApiTestController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

// Global Configuration
app.config(['$locationProvider', function($locationProvider) {
    $locationProvider.hashPrefix('!');
    $locationProvider.html5Mode(false);
}]);

// Run Block
app.run(['$rootScope', function($rootScope) {
    console.log('AngularJS app running');
    $rootScope.appName = 'BookStore';
    $rootScope.version = '1.0.0';
    $rootScope.loading = false;
    $rootScope.isAuthenticated = false;
    $rootScope.currentUser = null;
}]);

console.log('AngularJS app setup complete');
