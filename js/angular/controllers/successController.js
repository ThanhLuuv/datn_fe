// Success Page Controller
app.controller('SuccessController', ['$scope', '$location', '$routeParams', function($scope, $location, $routeParams) {
    // Get order info from URL params or localStorage
    $scope.orderId = $routeParams.orderId || localStorage.getItem('lastOrderId') || 'N/A';
    $scope.totalAmount = $routeParams.total || localStorage.getItem('lastOrderTotal') || 0;
    
    // Clear stored order info after displaying
    localStorage.removeItem('lastOrderId');
    localStorage.removeItem('lastOrderTotal');
}]);

// Cancel Page Controller  
app.controller('CancelController', ['$scope', '$location', function($scope, $location) {
    // Simple controller for cancel page
    // Cart remains intact for user to retry payment
}]);
