// AngularJS Application Module
var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

// Global controller for navbar visibility
app.controller('AppController', ['$scope', '$location', 'CartService', function($scope, $location, CartService) {
    $scope.isAdminPage = false;
    $scope.searchQuery = '';
    $scope.cartCount = CartService && CartService.getTotalQuantity ? CartService.getTotalQuantity() : 0;

    $scope.goSearch = function() {
        if ($scope.searchQuery && $scope.searchQuery.trim().length > 0) {
            $location.path('/search').search({ q: $scope.searchQuery.trim(), page: 1, pageSize: 12 });
        }
    };

    $scope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        $scope.isAdminPage = path.indexOf('/admin') === 0;
    });

    $scope.$on('cart:changed', function() {
        $scope.cartCount = CartService.getTotalQuantity();
        $scope.$applyAsync();
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
        .when('/logout', {
            templateUrl: 'app/views/login.html',
            controller: 'LogoutController'
        })
        .when('/admin', {
            templateUrl: 'app/views/admin.html',
            controller: 'AdminController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/employee', {
            templateUrl: 'app/views/employee.html',
            controller: 'EmployeeController'
        })
        .when('/about', {
            templateUrl: 'app/views/about.html',
            controller: 'AboutController'
        })
        .when('/contact', {
            templateUrl: 'app/views/contact.html',
            controller: 'ContactController'
        })
        .when('/cart', {
            templateUrl: 'app/views/cart.html',
            controller: 'CartController'
        })
        .when('/checkout', {
            templateUrl: 'app/views/checkout.html',
            controller: 'CheckoutController'
        })
        .when('/search', {
            templateUrl: 'app/views/search.html',
            controller: 'SearchController'
        })
        .when('/api-test', {
            templateUrl: 'app/views/api-test.html',
            controller: 'ApiTestController'
        })
        .when('/categories', {
            templateUrl: 'app/views/categories.html',
            controller: 'CategoriesController'
        })
        .when('/admin/categories', {
            templateUrl: 'app/views/admin-categories.html',
            controller: 'AdminCategoriesController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/books', {
            templateUrl: 'app/views/books.html',
            controller: 'BooksController'
        })
        .when('/admin/books', {
            templateUrl: 'app/views/admin-books.html',
            controller: 'AdminBooksController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/admin/purchase-orders', {
            templateUrl: 'app/views/admin-purchase-orders.html',
            controller: 'AdminPurchaseOrdersController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/admin/goods-receipts', {
            templateUrl: 'app/views/admin-goods-receipts.html',
            controller: 'AdminGoodsReceiptsController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
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
