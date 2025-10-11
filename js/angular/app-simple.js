// AngularJS App Module - Simplified for Vercel
console.log('Loading AngularJS App Module...');

// Define the main app module
var myApp = angular.module('myApp', [
    'ngRoute',
    'ngAnimate'
]);

// App Controller - Main controller for the entire app
myApp.controller('AppController', ['$scope', '$location', '$rootScope', 'AuthService', 'CartService', 'APP_CONFIG', function($scope, $location, $rootScope, AuthService, CartService, APP_CONFIG) {
    console.log('AppController loaded');
    
    // Initialize app state
    $scope.isAuthenticated = false;
    $scope.currentUser = null;
    $scope.cartCount = 0;
    $scope.searchQuery = '';
    
    // Check if current page is admin page
    $scope.isAdminPage = false;
    $scope.isAuthPage = false;
    
    // Watch for route changes
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        var path = $location.path();
        $scope.isAdminPage = path.indexOf('/admin') === 0;
        $scope.isAuthPage = path === '/login' || path === '/register';
        
        console.log('Route changed to:', path);
        console.log('Is admin page:', $scope.isAdminPage);
        console.log('Is auth page:', $scope.isAuthPage);
    });
    
    // Initialize authentication
    $scope.initAuth = function() {
        AuthService.checkAuth().then(function(user) {
            $scope.isAuthenticated = true;
            $scope.currentUser = user;
            console.log('User authenticated:', user);
        }).catch(function() {
            $scope.isAuthenticated = false;
            $scope.currentUser = null;
            console.log('User not authenticated');
        });
    };
    
    // Initialize cart
    $scope.initCart = function() {
        CartService.getCartCount().then(function(count) {
            $scope.cartCount = count;
            console.log('Cart count:', count);
        });
    };
    
    // Search functionality
    $scope.goSearch = function() {
        if ($scope.searchQuery && $scope.searchQuery.trim()) {
            $location.path('/search').search('q', $scope.searchQuery.trim());
        }
    };
    
    // Logout functionality
    $scope.logout = function() {
        AuthService.logout().then(function() {
            $scope.isAuthenticated = false;
            $scope.currentUser = null;
            $scope.cartCount = 0;
            $location.path('/home');
            console.log('User logged out');
        });
    };
    
    // Initialize app
    $scope.initAuth();
    $scope.initCart();
    
    // Watch for cart changes
    $rootScope.$on('cartUpdated', function() {
        $scope.initCart();
    });
    
    // Watch for auth changes
    $rootScope.$on('authChanged', function() {
        $scope.initAuth();
    });
}]);

// App Configuration - Routes
myApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    console.log('Configuring routes...');
    
    // Enable HTML5 mode for clean URLs
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');
    
    // Define routes
    $routeProvider
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
        .when('/login', {
            templateUrl: 'app/views/login.html',
            controller: 'AuthController'
        })
        .when('/register', {
            templateUrl: 'app/views/register.html',
            controller: 'AuthController'
        })
        .when('/books', {
            templateUrl: 'app/views/books.html',
            controller: 'BookController'
        })
        .when('/book/:id', {
            templateUrl: 'app/views/book-detail.html',
            controller: 'BookDetailController'
        })
        .when('/categories', {
            templateUrl: 'app/views/categories.html',
            controller: 'CategoryController'
        })
        .when('/search', {
            templateUrl: 'app/views/search.html',
            controller: 'SearchController'
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
        .when('/orders', {
            templateUrl: 'app/views/customer-orders.html',
            controller: 'CustomerOrdersController'
        })
        .when('/admin', {
            templateUrl: 'app/views/admin.html',
            controller: 'AdminController'
        })
        .when('/admin/books', {
            templateUrl: 'app/views/admin-books.html',
            controller: 'BookController'
        })
        .when('/admin/categories', {
            templateUrl: 'app/views/admin-categories.html',
            controller: 'CategoryController'
        })
        .when('/admin/orders', {
            templateUrl: 'app/views/admin-orders.html',
            controller: 'OrderController'
        })
        .when('/admin/purchase-orders', {
            templateUrl: 'app/views/admin-purchase-orders.html',
            controller: 'PurchaseOrderController'
        })
        .when('/admin/goods-receipts', {
            templateUrl: 'app/views/admin-goods-receipts.html',
            controller: 'GoodsReceiptController'
        })
        .when('/admin/returns', {
            templateUrl: 'app/views/admin-returns.html',
            controller: 'ReturnController'
        })
        .when('/admin/promotions', {
            templateUrl: 'app/views/admin-promotions.html',
            controller: 'PromotionController'
        })
        .when('/admin/roles', {
            templateUrl: 'app/views/admin-roles.html',
            controller: 'RolesController'
        })
        .when('/admin/report-revenue', {
            templateUrl: 'app/views/admin-report-revenue.html',
            controller: 'ReportController'
        })
        .when('/employee', {
            templateUrl: 'app/views/employee.html',
            controller: 'EmployeeController'
        })
        .when('/api-test', {
            templateUrl: 'app/views/api-test.html',
            controller: 'ApiTestController'
        })
        .otherwise({
            redirectTo: '/home'
        });
    
    console.log('Routes configured successfully');
}]);

console.log('AngularJS App Module loaded successfully');