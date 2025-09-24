app.controller('CheckoutController', ['$scope', '$location', 'CartService', function($scope, $location, CartService) {
    $scope.form = {
        fullName: '',
        phone: '',
        city: 'hcm_inner',
        address: '',
        payment: 'cod'
    };

    function getShippingFee(city) {
        if (city === 'hcm_inner') return 30000;
        if (city === 'hcm_outer') return 50000;
        return 50000;
    }

    function compute() {
        $scope.cart = CartService.getCart();
        $scope.tax = Math.round($scope.cart.subtotal * 0.08);
        $scope.shippingFee = getShippingFee($scope.form.city);
        $scope.grandTotal = $scope.cart.subtotal + $scope.tax + $scope.shippingFee;
    }

    $scope.recompute = compute;

    $scope.placeOrder = function() {
        if ($scope.cart.items.length === 0) return;
        // For now, simulate order placement
        if (window.showNotification) {
            window.showNotification('Đặt hàng thành công! Tổng tiền: ' + $scope.grandTotal.toLocaleString('vi-VN') + ' VNĐ', 'success');
        }
        CartService.clear();
        $location.path('/home');
    };

    // init
    compute();
}]);

