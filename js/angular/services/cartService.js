app.factory('CartService', [function() {
    var STORAGE_KEY = 'bookstore_cart_v1';

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
        getCart: function() {
            return computeTotals(readCart());
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
        removeItem: function(isbn, unitPrice) {
            var cart = readCart();
            cart.items = cart.items.filter(function(x) { return !(x.isbn === isbn && x.unitPrice === unitPrice); });
            writeCart(computeTotals(cart));
            return cart;
        }
    };
}]);


