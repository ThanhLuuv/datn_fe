// AngularJS Application Module
var app = angular.module('myApp', ['ngRoute', 'ngAnimate', 'ngSanitize']);

// Add numberFormatted filter directly to app.js to ensure it's available
app.filter('numberFormatted', function () {
    return function (amount) {
        if (amount == null || amount === '') return '';
        var num = parseFloat(amount);
        if (isNaN(num)) return '';
        return num.toLocaleString('vi-VN');
    };
});

// Global controller for navbar visibility
app.controller('AppController', ['$scope', '$location', '$injector', 'AuthService', function ($scope, $location, $injector, AuthService) {
    var CartService = null;
    try { CartService = $injector.get('CartService'); } catch (e) { console.warn('CartService not available yet:', e && e.message ? e.message : e); }
    $scope.isAdminPage = false;
    $scope.isAuthPage = false; // login/register
    $scope.searchQuery = '';
    $scope.cartCount = 0;
    $scope.isAuthenticated = AuthService.isAuthenticated();

    $scope.goSearch = function () {
        var q = ($scope.searchQuery || '').trim();
        $location.path('/search').search({ q: q, page: 1, pageSize: 12 });
    };

    // Handle smooth scroll for menu items
    $scope.scrollToSection = function (sectionId, event) {
        if (event) {
            event.preventDefault();
        }

        // If not on home page, navigate to home first
        if ($location.path() !== '/home' && $location.path() !== '/') {
            $location.path('/home').search({});
            // Wait for route to load, then scroll
            setTimeout(function () {
                scrollToSectionId(sectionId);
            }, 500);
        } else {
            // Already on home page, just scroll
            if (sectionId === 'home') {
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                scrollToSectionId(sectionId);
            }
        }
    };

    function scrollToSectionId(sectionId) {
        setTimeout(function () {
            var element = document.getElementById(sectionId);
            if (element) {
                var headerOffset = 250; // Account for sticky header
                var elementPosition = element.getBoundingClientRect().top;
                var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 200);
    }

    // Load cart count from API
    $scope.loadCartCount = function () {
        if (!$scope.isAuthenticated) {
            $scope.cartCount = 0;
            return;
        }

        if (!CartService || !CartService.getCartSummary) { $scope.cartCount = 0; return; }
        CartService.getCartSummary()
            .then(function (response) {
                if (response && response.data && response.data.success) {
                    $scope.cartCount = response.data.data.totalItems || 0;
                } else {
                    $scope.cartCount = 0;
                }
            })
            .catch(function (error) {
                console.error('Error loading cart count:', error);
                // Fallback to local storage
                try { $scope.cartCount = CartService.getTotalQuantity ? CartService.getTotalQuantity() : 0; } catch (_) { $scope.cartCount = 0; }
            });
    };

    $scope.$on('$routeChangeSuccess', function () {
        var path = $location.path();
        $scope.isAdminPage = path.indexOf('/admin') === 0;
        $scope.isAuthPage = (path === '/login' || path === '/register');
        $scope.isEmployeePage = (path === '/employee' || path.indexOf('/delivery') === 0);

        // Update authentication status
        $scope.isAuthenticated = AuthService.isAuthenticated();

        // Load cart count if authenticated
        if ($scope.isAuthenticated) {
            $scope.loadCartCount();
        } else {
            $scope.cartCount = 0;
        }

        // Handle hash in URL for smooth scroll
        var hash = $location.hash();
        if (hash && (path === '/home' || path === '/')) {
            setTimeout(function () {
                scrollToSectionId(hash);
            }, 500);
        }
    });

    $scope.$on('cart:changed', function () {
        $scope.loadCartCount();
    });

    // Initial load
    if ($scope.isAuthenticated) {
        $scope.loadCartCount();
    }
}]);

// Route Configuration
app.config(['$routeProvider', function ($routeProvider) {
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
        .when('/forgot-password', {
            templateUrl: 'app/views/forgot-password.html',
            controller: 'ForgotPasswordController'
        })
        .when('/reset-password', {
            templateUrl: 'app/views/reset-password.html',
            controller: 'ResetPasswordController'
        })
        .when('/logout', {
            templateUrl: 'app/views/login.html',
            controller: 'LogoutController'
        })
        .when('/admin', {
            templateUrl: 'app/views/admin.html',
            controller: 'AdminController',
            resolve: {
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
        .when('/profile', {
            templateUrl: 'app/views/profile.html',
            controller: 'ProfileController',
            resolve: {
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAuthenticated() || !AuthService.isCustomer()) {
                        $location.path('/login');
                        return false;
                    }
                    return true;
                }]
            }
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/delivery/orders', {
            templateUrl: 'app/views/delivery-orders.html',
            controller: 'DeliveryOrdersController',
            resolve: {
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isDeliveryEmployee() && !AuthService.isAdmin()) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
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
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/admin/reports/inventory', {
            templateUrl: 'app/views/admin-inventory-report.html',
            controller: 'AdminInventoryReportController',
            resolve: {
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAdminOrTeacher()) {
                        $location.path('/home');
                        return false;
                    }
                    return true;
                }]
            }
        })
        .when('/admin/employees', {
            templateUrl: 'app/views/admin-employees.html',
            controller: 'AdminEmployeesController',
            resolve: {
                checkAuth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAdmin()) {
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
app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.hashPrefix('!');
    // Use hash routing for better compatibility
    $locationProvider.html5Mode(false);
}]);

// Run Block
app.run(['$rootScope', 'AuthService', function ($rootScope, AuthService) {
    $rootScope.appName = 'BookStore';
    $rootScope.version = '1.0.0';

    // Global loading state
    $rootScope.loading = false;

    // Authentication state
    $rootScope.isAuthenticated = AuthService.isAuthenticated();
    $rootScope.currentUser = AuthService.getCurrentUser();

    // Update auth state when user logs in/out
    $rootScope.$on('auth:login', function () {
        $rootScope.isAuthenticated = true;
        $rootScope.currentUser = AuthService.getCurrentUser();
    });

    $rootScope.$on('auth:logout', function () {
        $rootScope.isAuthenticated = false;
        $rootScope.currentUser = null;
    });

    // Global error handler
    $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
        console.error('Route change error:', rejection);
    });

    // Logout function
    $rootScope.logout = function () {
        AuthService.logout();
        $rootScope.$broadcast('auth:logout');
        window.location.href = '#!/login';
    };
}]);
