app.controller('CheckoutController', ['$scope', '$location', 'CartService', 'BookstoreService', 'AuthService', function($scope, $location, CartService, BookstoreService, AuthService) {
    $scope.form = {
        fullName: '',
        phone: '',
        areaType: '',
        areaId: '',
        address: '',
        payment: 'payos'
    };

    $scope.cart = { items: [] };
    $scope.loading = false;
    $scope.pageLoading = true;
    $scope.areas = [];
    $scope.areasLoading = false;

    function compute() {
        // Tính lại subtotal để đảm bảo tính toán chính xác
        recomputeSubtotal();
    }

    function recomputeSubtotal() {
        var sum = 0;
        if ($scope.cart && Array.isArray($scope.cart.items)) {
            for (var i = 0; i < $scope.cart.items.length; i++) {
                var it = $scope.cart.items[i];
                var unit = (it.discountedPrice || it.currentPrice || it.unitPrice) || 0;
                var lineTotal = unit * (it.qty || 0);
                sum += Number(lineTotal) || 0;
            }
        }
        $scope.cart.subtotal = sum;
    }

    // Load cart from API to ensure data consistency
    $scope.loadCartFromAPI = function() {
        $scope.loading = true;
        CartService.getCartFromAPI()
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    var cartData = response.data.data;
                    var items = cartData.items || [];
                    
                    // Map API response to expected format
                    items = items.map(function(item) {
                        return {
                            cartItemId: item.cartItemId,
                            isbn: item.isbn,
                            title: item.bookTitle,
                            bookTitle: item.bookTitle,
                            unitPrice: item.unitPrice,
                            currentPrice: item.currentPrice,
                            discountedPrice: item.discountedPrice,
                            qty: item.quantity,
                            quantity: item.quantity,
                            totalPrice: item.totalPrice,
                            imageUrl: item.imageUrl,
                            stock: item.stock,
                            hasPromotion: item.hasPromotion,
                            activePromotions: item.activePromotions,
                            addedAt: item.addedAt
                        };
                    });
                    
                    $scope.cart = {
                        items: items,
                        subtotal: cartData.totalAmount || 0
                    };
                    
                    // Debug logging
                    console.log('CheckoutController - Cart loaded from API:');
                    console.log('Items count:', items.length);
                    console.log('Items:', items);
                    console.log('Subtotal:', cartData.totalAmount);
                } else {
                    $scope.cart = { items: [], subtotal: 0 };
                    console.log('CheckoutController - Empty cart from API');
                }
                compute();
                $scope.loading = false;
                $scope.pageLoading = false;
            })
            .catch(function(error) {
                console.error('Error loading cart:', error);
                // Fallback to local storage
                $scope.cart = CartService.getCart();
                compute();
                $scope.loading = false;
                $scope.pageLoading = false;
            });
    };

    // Load areas from API
    $scope.loadAreas = function() {
        $scope.areasLoading = true;
        BookstoreService.getAreas()
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    $scope.areas = response.data.data.areas || [];
                    console.log('Areas loaded:', $scope.areas);
                } else {
                    $scope.areas = [];
                    console.log('No areas found');
                }
            })
            .catch(function(error) {
                console.error('Error loading areas:', error);
                $scope.areas = [];
            })
            .finally(function() {
                $scope.areasLoading = false;
            });
    };

    // Handle area type change
    $scope.onAreaTypeChange = function() {
        $scope.form.areaId = ''; // Reset area selection
        if ($scope.form.areaType === 'inner') {
            $scope.loadAreas();
        }
    };

    $scope.placeOrder = function() {
        if ($scope.cart.items.length === 0) return;
        $scope.loading = true;
        
        // Build shipping address with area information
        var shippingAddress = $scope.form.address;
        if ($scope.form.areaType === 'inner' && $scope.form.areaId) {
            var selectedArea = $scope.areas.find(function(area) {
                return area.areaId == $scope.form.areaId;
            });
            if (selectedArea) {
                shippingAddress = selectedArea.name + ', ' + shippingAddress;
            }
        }
        shippingAddress = ($scope.form.areaType === 'inner' ? 'Nội thành' : 'Ngoại thành') + ', ' + shippingAddress;
        
        var payload = {
            receiverName: $scope.form.fullName,
            receiverPhone: $scope.form.phone,
            shippingAddress: shippingAddress,
            lines: $scope.cart.items.map(function(it){ return { isbn: it.isbn, qty: it.qty }; })
        };
        
        // Debug logging
        console.log('CheckoutController - Order payload:');
        console.log('Payload:', payload);
        
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
                    localStorage.setItem('lastOrderTotal', $scope.cart.subtotal);
                    CartService.clear();
                    $location.path('/success');
                }
            })
            .catch(function(err){
                if (window.showNotification) window.showNotification('Đặt hàng thất bại', 'danger');
            })
            .finally(function(){ $scope.loading = false; });
    };

    // Initialize cart from API
    $scope.loadCartFromAPI();
}]);

