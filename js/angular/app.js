// AngularJS Application Module
var app = angular.module('myApp', ['ngRoute', 'ngAnimate']);

// Global controller for navbar visibility
app.controller('AppController', ['$scope', '$location', 'CartService', 'AuthService', function($scope, $location, CartService, AuthService) {
    $scope.isAdminPage = false;
    $scope.isAuthPage = false; // login/register
    $scope.searchQuery = '';
    $scope.cartCount = 0;
    $scope.isAuthenticated = AuthService.isAuthenticated();

    $scope.goSearch = function() {
        var q = ($scope.searchQuery || '').trim();
        $location.path('/search').search({ q: q, page: 1, pageSize: 12 });
    };

    // Load cart count from API
    $scope.loadCartCount = function() {
        if (!$scope.isAuthenticated) {
            $scope.cartCount = 0;
            return;
        }

        CartService.getCartSummary()
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    $scope.cartCount = response.data.data.totalItems || 0;
                } else {
                    $scope.cartCount = 0;
                }
            })
            .catch(function(error) {
                console.error('Error loading cart count:', error);
                // Fallback to local storage
                $scope.cartCount = CartService.getTotalQuantity();
            });
    };

    $scope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        $scope.isAdminPage = path.indexOf('/admin') === 0;
        $scope.isAuthPage = (path === '/login' || path === '/register');
        
        // Update authentication status
        $scope.isAuthenticated = AuthService.isAuthenticated();
        
        // Load cart count if authenticated
        if ($scope.isAuthenticated) {
            $scope.loadCartCount();
        } else {
            $scope.cartCount = 0;
        }
    });

    $scope.$on('cart:changed', function() {
        $scope.loadCartCount();
    });

    // Initial load
    if ($scope.isAuthenticated) {
        $scope.loadCartCount();
    }
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
        .when('/success', {
            templateUrl: 'app/views/success.html',
            controller: 'SuccessController'
        })
        .when('/cancel', {
            templateUrl: 'app/views/cancel.html',
            controller: 'CancelController'
        })
        .when('/orders', {
            templateUrl: 'app/views/customer-orders.html',
            controller: 'CustomerOrdersController'
        })
        .when('/search', {
            templateUrl: 'app/views/search.html',
            controller: 'SearchController'
        })
        .when('/book/:isbn', {
            templateUrl: 'app/views/book-detail.html',
            controller: 'BookDetailController'
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
        .when('/admin/promotions', {
            templateUrl: 'app/views/admin-promotions.html',
            controller: 'AdminPromotionsController',
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
        .when('/admin/orders', {
            templateUrl: 'app/views/admin-orders.html',
            controller: 'AdminOrdersController',
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
        .when('/admin/returns', {
            templateUrl: 'app/views/admin-returns.html',
            controller: 'AdminReturnsController',
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
        .when('/admin/roles', {
            templateUrl: 'app/views/admin-roles.html',
            controller: 'AdminRolesController',
            resolve: {
                checkAuth: ['AuthService', '$location', function(AuthService, $location) {
                    if (!AuthService.isAdmin()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/admin/reports/revenue', {
            templateUrl: 'app/views/admin-report-revenue.html',
            controller: 'AdminRevenueReportController',
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
