app.controller('CartController', ['$scope', 'CartService', '$location', function($scope, CartService, $location) {
    $scope.loading = false;
    $scope.cart = { items: [] };

    function compute() {
        // Không cần tính toán gì thêm, chỉ giữ cart.subtotal
    }

    // Load cart from API
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
                            qty: item.quantity, // Map quantity to qty
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
                    console.log('CartController - Cart loaded from API:');
                    console.log('Items count:', items.length);
                    console.log('Items:', items);
                    console.log('Subtotal:', cartData.totalAmount);
                } else {
                    $scope.cart = { items: [], subtotal: 0 };
                    console.log('CartController - Empty cart from API');
                }
                compute();
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading cart:', error);
                // Fallback to local storage
                $scope.cart = CartService.getCart();
                compute();
                $scope.loading = false;
            });
    };

    function recomputeSubtotal() {
        var sum = 0;
        if ($scope.cart && Array.isArray($scope.cart.items)) {
            for (var i = 0; i < $scope.cart.items.length; i++) {
                var it = $scope.cart.items[i];
                var unit = (it.discountedPrice || it.currentPrice || it.unitPrice) || 0;
                var lineTotal = it.totalPrice != null ? it.totalPrice : unit * (it.qty || 0);
                sum += Number(lineTotal) || 0;
            }
        }
        $scope.cart.subtotal = sum;
    }

    $scope.updateQty = function(item) {
        if (!item.cartItemId) {
            // Fallback to local storage method
            CartService.updateQty(item.isbn, item.unitPrice, item.qty);
            recomputeSubtotal();
            return;
        }

        item._updating = true;
        CartService.updateCartItem(item.cartItemId, item.qty)
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    // Update local item data
                    var updatedItem = response.data.data;
                    item.totalPrice = updatedItem.totalPrice;
                    item.stock = updatedItem.stock;
                    item.hasPromotion = updatedItem.hasPromotion;
                    item.qty = updatedItem.quantity; // Update qty from API response
                    // Recompute subtotal locally to avoid full re-render
                    recomputeSubtotal();
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể cập nhật số lượng', 'warning');
                    }
                }
            })
            .catch(function(error) {
                console.error('Update quantity error:', error);
                if (window.showNotification) {
                    window.showNotification('Không thể cập nhật số lượng', 'danger');
                }
            })
            .finally(function() {
                item._updating = false;
                $scope.$emit('cart:changed');
            });
    };

    $scope.validateQuantity = function(item) {
        if (!item.qty || item.qty < 1) {
            item.qty = 1;
            item.qtyError = 'Số lượng tối thiểu là 1';
        } else if (item.qty > 99) {
            item.qty = 99;
            item.qtyError = 'Số lượng tối đa là 99';
        } else if (item.stock && item.qty > item.stock) {
            item.qty = item.stock;
            item.qtyError = 'Chỉ còn ' + item.stock + ' cuốn trong kho';
        } else {
            item.qtyError = null;
        }
        $scope.updateQty(item);
    };

    $scope.remove = function(item) {
        if (!item.cartItemId) {
            // Fallback to local storage method
            CartService.removeItem(item.isbn, item.unitPrice);
            // Remove from local list
            var idx = $scope.cart.items.indexOf(item);
            if (idx >= 0) { $scope.cart.items.splice(idx, 1); }
            recomputeSubtotal();
            $scope.$emit('cart:changed');
            return;
        }

        item._removing = true;
        CartService.removeCartItem(item.cartItemId)
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    if (window.showNotification) {
                        window.showNotification('Đã xóa "' + item.bookTitle + '" khỏi giỏ hàng', 'success');
                    }
                    // Remove from list without reloading entire cart
                    var idx = $scope.cart.items.indexOf(item);
                    if (idx >= 0) { $scope.cart.items.splice(idx, 1); }
                    recomputeSubtotal();
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể xóa sản phẩm', 'warning');
                    }
                }
            })
            .catch(function(error) {
                console.error('Remove item error:', error);
                if (window.showNotification) {
                    window.showNotification('Không thể xóa sản phẩm', 'danger');
                }
            })
            .finally(function() {
                item._removing = false;
                $scope.$emit('cart:changed');
            });
    };

    $scope.increment = function(item) {
        if (item.stock && item.qty >= item.stock) {
            if (window.showNotification) {
                window.showNotification('Không đủ tồn kho', 'warning');
            }
            return;
        }
        item.qty = (item.qty || 1) + 1;
        item.qtyError = null;
        $scope.updateQty(item);
    };

    $scope.decrement = function(item) {
        if (item.qty > 1) {
            item.qty = item.qty - 1;
            item.qtyError = null;
            $scope.updateQty(item);
        }
    };

    // Validation for checkout
    $scope.canProceedToCheckout = function() {
        if (!$scope.cart || !$scope.cart.items || $scope.cart.items.length === 0) {
            return false;
        }
        
        // Check if any item has quantity error
        for (var i = 0; i < $scope.cart.items.length; i++) {
            if ($scope.cart.items[i].qtyError) {
                return false;
            }
        }
        
        return true;
    };

    $scope.getCheckoutErrorMessage = function() {
        if (!$scope.cart || !$scope.cart.items || $scope.cart.items.length === 0) {
            return 'Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.';
        }
        
        // Check for quantity errors
        for (var i = 0; i < $scope.cart.items.length; i++) {
            if ($scope.cart.items[i].qtyError) {
                return 'Vui lòng kiểm tra lại số lượng sản phẩm.';
            }
        }
        
        return '';
    };

    $scope.proceedToCheckout = function() {
        if ($scope.canProceedToCheckout()) {
            $location.path('/checkout');
        }
    };

    // Initialize
    $scope.loadCartFromAPI();
}]);

