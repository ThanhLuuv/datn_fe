app.factory('CartService', ['$rootScope', '$http', 'APP_CONFIG', function($rootScope, $http, APP_CONFIG) {
    var baseUrl = APP_CONFIG.API_BASE_URL;
    var STORAGE_KEY = 'bookstore_cart_v1';

    function getAuthHeaders() {
        var token = localStorage.getItem('token');
        return {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }

    function readCart() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { items: [], updatedAt: new Date().toISOString() };
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.items)) return { items: [], updatedAt: new Date().toISOString() };
            return parsed;
        } catch (e) {
            return { items: [], updatedAt: new Date().toISOString() };
        }
    }

    function writeCart(cart) {
        cart.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        if ($rootScope && $rootScope.$broadcast) {
            $rootScope.$broadcast('cart:changed');
        }
    }

    function findIndex(items, isbn, unitPrice) {
        return items.findIndex(function(x) { return x.isbn === isbn && x.unitPrice === unitPrice; });
    }

    function computeTotals(cart) {
        var subtotal = 0;
        cart.items.forEach(function(it) { subtotal += (it.unitPrice || 0) * (it.qty || 0); });
        cart.subtotal = Math.round(subtotal);
        return cart;
    }

    return {
        // API-based methods
        addToCart: function(isbn, quantity) {
            return $http({
                method: 'POST',
                url: baseUrl + '/cart/add',
                data: { isbn: isbn, quantity: quantity },
                headers: getAuthHeaders()
            });
        },

        getCartFromAPI: function() {
            return $http({
                method: 'GET',
                url: baseUrl + '/cart',
                headers: getAuthHeaders()
            });
        },

        updateCartItem: function(cartItemId, quantity) {
            return $http({
                method: 'PUT',
                url: baseUrl + '/cart/' + cartItemId,
                data: { quantity: quantity },
                headers: getAuthHeaders()
            });
        },

        removeCartItem: function(cartItemId) {
            return $http({
                method: 'DELETE',
                url: baseUrl + '/cart/' + cartItemId,
                headers: getAuthHeaders()
            });
        },

        clearCartAPI: function() {
            return $http({
                method: 'DELETE',
                url: baseUrl + '/cart/clear',
                headers: getAuthHeaders()
            });
        },

        removeBookFromCart: function(isbn) {
            return $http({
                method: 'DELETE',
                url: baseUrl + '/cart/book/' + isbn,
                headers: getAuthHeaders()
            });
        },

        getCartSummary: function() {
            return $http({
                method: 'GET',
                url: baseUrl + '/cart/summary',
                headers: getAuthHeaders()
            });
        },

        // Local storage methods (fallback)
        getCart: function() {
            return computeTotals(readCart());
        },
        getTotalQuantity: function() {
            var cart = readCart();
            return cart.items.reduce(function(sum, it) { return sum + (it.qty || 0); }, 0);
        },
        clear: function() {
            writeCart({ items: [] });
        },
        addItem: function(item) {
            // item: { isbn, title, unitPrice, imageUrl, qty }
            var cart = readCart();
            var qty = item.qty && item.qty > 0 ? item.qty : 1;
            var idx = findIndex(cart.items, item.isbn, item.unitPrice);
            if (idx >= 0) {
                cart.items[idx].qty += qty;
            } else {
                cart.items.push({
                    isbn: item.isbn,
                    title: item.title,
                    unitPrice: Math.round(item.unitPrice || 0),
                    imageUrl: item.imageUrl || null,
                    qty: qty
                });
            }
            writeCart(computeTotals(cart));
            return cart;
        },
        updateQty: function(isbn, unitPrice, qty) {
            var cart = readCart();
            var idx = findIndex(cart.items, isbn, unitPrice);
            if (idx >= 0) {
                cart.items[idx].qty = Math.max(1, parseInt(qty || '1'));
                writeCart(computeTotals(cart));
            }
            return cart;
        },
        increment: function(isbn, unitPrice) {
            var cart = readCart();
            var idx = findIndex(cart.items, isbn, unitPrice);
            if (idx >= 0) {
                cart.items[idx].qty += 1;
                writeCart(computeTotals(cart));
            }
            return cart;
        },
        decrement: function(isbn, unitPrice) {
            var cart = readCart();
            var idx = findIndex(cart.items, isbn, unitPrice);
            if (idx >= 0) {
                cart.items[idx].qty = Math.max(1, (cart.items[idx].qty || 1) - 1);
                writeCart(computeTotals(cart));
            }
            return cart;
        },
        removeItem: function(isbn, unitPrice) {
            var cart = readCart();
            cart.items = cart.items.filter(function(x) { return !(x.isbn === isbn && x.unitPrice === unitPrice); });
            writeCart(computeTotals(cart));
            return cart;
        }
    };
}]);


