app.controller('CartController', ['$scope', 'CartService', function($scope, CartService) {
    function compute() {
        $scope.cart = CartService.getCart();
        $scope.tax = Math.round($scope.cart.subtotal * 0.08);
        // default shipping for cart page (estimate): 30k inner HCMC else 50k
        $scope.shippingFee = 30000;
        $scope.grandTotal = $scope.cart.subtotal + $scope.tax + $scope.shippingFee;
    }

    $scope.updateQty = function(it) {
        CartService.updateQty(it.isbn, it.unitPrice, it.qty);
        compute();
    };

    $scope.remove = function(it) {
        CartService.removeItem(it.isbn, it.unitPrice);
        compute();
    };

    // init
    $scope.cart = { items: [] };
    compute();
}]);

