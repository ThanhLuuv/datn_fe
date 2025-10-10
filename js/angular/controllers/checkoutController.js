app.controller('CheckoutController', ['$scope', '$location', 'CartService', 'BookstoreService', 'AuthService', function($scope, $location, CartService, BookstoreService, AuthService) {
    $scope.form = {
        fullName: '',
        phone: '',
        city: 'hcm_inner',
        address: '',
        payment: 'payos'
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

    $scope.loading = false;

    $scope.placeOrder = function() {
        if ($scope.cart.items.length === 0) return;
        $scope.loading = true;
        var payload = {
            receiverName: $scope.form.fullName,
            receiverPhone: $scope.form.phone,
            shippingAddress: $scope.form.address,
            lines: $scope.cart.items.map(function(it){ return { isbn: it.isbn, qty: it.qty }; })
        };
        BookstoreService.createOrder(payload)
            .then(function(res){
                var data = res && res.data ? res.data : {};
                var order = data.data || data;
                if ($scope.form.payment === 'payos') {
                    // Use paymentUrl from order creation response
                    var paymentUrl = order.paymentUrl || (data && data.paymentUrl);
                    if (paymentUrl) {
                        window.location.href = paymentUrl;
                    } else {
                        if (window.showNotification) window.showNotification('Không tạo được link thanh toán, đơn đã lưu', 'warning');
                        CartService.clear();
                        $location.path('/home');
                    }
                } else {
                    // Store order info for success page
                    localStorage.setItem('lastOrderId', order.orderId || order.id);
                    localStorage.setItem('lastOrderTotal', $scope.grandTotal);
                    CartService.clear();
                    $location.path('/success');
                }
            })
            .catch(function(err){
                if (window.showNotification) window.showNotification('Đặt hàng thất bại', 'danger');
            })
            .finally(function(){ $scope.loading = false; });
    };

    // init
    compute();
}]);

