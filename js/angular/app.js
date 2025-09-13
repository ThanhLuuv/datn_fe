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
        .when('/login', {
            templateUrl: 'app/views/login.html',
            controller: 'LoginController'
        })
        .when('/register', {
            templateUrl: 'app/views/register.html',
            controller: 'RegisterController'
        })
        .when('/logout', {
            templateUrl: 'app/views/login.html',
            controller: 'LogoutController'
        })
        .when('/admin', {
            templateUrl: 'app/views/admin.html',
            controller: 'AdminController',
            resolve: {
                auth: ['AuthService', function(AuthService) {
                    if (!AuthService.isAdmin()) {
                        window.location.href = '#!/login';
                    }
                }]
            }
        })
        .when('/employee', {
            templateUrl: 'app/views/employee.html',
            controller: 'EmployeeController',
            resolve: {
                auth: ['AuthService', function(AuthService) {
                    if (!AuthService.isStaff()) {
                        window.location.href = '#!/login';
                    }
                }]
            }
        })
        .when('/about', {
            templateUrl: 'app/views/about.html',
            controller: 'AboutController'
        })
        .when('/contact', {
            templateUrl: 'app/views/contact.html',
            controller: 'ContactController'
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
    // Use hash routing for better compatibility
    $locationProvider.html5Mode(false);
}]);

// Run Block
app.run(['$rootScope', 'AuthService', function($rootScope, AuthService) {
    $rootScope.appName = 'BookStore';
    $rootScope.version = '1.0.0';
    
    // Global loading state
    $rootScope.loading = false;
    
    // Authentication state
    $rootScope.isAuthenticated = AuthService.isAuthenticated();
    $rootScope.currentUser = AuthService.getCurrentUser();
    
    // Update auth state when user logs in/out
    $rootScope.$on('auth:login', function() {
        $rootScope.isAuthenticated = true;
        $rootScope.currentUser = AuthService.getCurrentUser();
    });
    
    $rootScope.$on('auth:logout', function() {
        $rootScope.isAuthenticated = false;
        $rootScope.currentUser = null;
    });
    
    // Global error handler
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
        console.error('Route change error:', rejection);
    });
    
    // Logout function
    $rootScope.logout = function() {
        AuthService.logout();
        $rootScope.$broadcast('auth:logout');
        window.location.href = '#!/login';
    };
}]);
