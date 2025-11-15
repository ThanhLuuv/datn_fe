// Book Card Directive - Component chung cho hiển thị card sách
app.directive('bookCard', function() {
    return {
        restrict: 'E',
        templateUrl: 'app/components/book-card.html',
        scope: {
            book: '=',
            onAddToCart: '&',
            isAuthenticatedFn: '&?isAuthenticated',
            getFinalPriceFn: '&?getFinalPrice',
            hasPromoFn: '&?hasPromo',
            calculateDiscountPercentFn: '&?calculateDiscountPercent',
            showBadge: '@?', // 'new', 'hot', 'sale', or null
            showDiscountTag: '@?' // true/false
        },
        link: function(scope, element, attrs) {
            // Calculate final price
            scope.finalPrice = 0;
            scope.oldPrice = 0;
            scope.discountPercent = 0;
            scope.showOldPrice = false;
            scope.isAuthenticated = true;
            
            function updatePrice() {
                if (!scope.book) {
                    scope.finalPrice = 0;
                    scope.oldPrice = 0;
                    scope.showOldPrice = false;
                    return;
                }
                
                // Calculate final price using getFinalPrice function if provided
                if (scope.getFinalPriceFn) {
                    try {
                        scope.finalPrice = scope.getFinalPriceFn({book: scope.book}) || 0;
                    } catch(e) {
                        console.error('Error calling getFinalPrice:', e);
                        scope.finalPrice = scope.book.discountedPrice || scope.book.currentPrice || scope.book.unitPrice || 0;
                    }
                } else {
                    scope.finalPrice = scope.book.discountedPrice || scope.book.currentPrice || scope.book.unitPrice || 0;
                }
                
                // Old price - use the original/base price before any discount
                // This should be the higher of currentPrice or unitPrice (the original price)
                // Priority: use currentPrice if available, otherwise unitPrice, otherwise averagePrice
                scope.oldPrice = scope.book.currentPrice || scope.book.unitPrice || scope.book.averagePrice || 0;
                
                // If book has discountedPrice explicitly, oldPrice should be currentPrice or unitPrice
                // If finalPrice was calculated from promoPercent/promoAmount, oldPrice should be the base used
                // The key is: oldPrice should represent the original price before discount
                
                // Show old price if there's a discount (finalPrice < oldPrice)
                if (scope.hasPromoFn) {
                    try {
                        var hasPromo = scope.hasPromoFn({book: scope.book});
                        // Only show old price if there's a promotion AND oldPrice > finalPrice
                        scope.showOldPrice = hasPromo && scope.oldPrice > scope.finalPrice && scope.oldPrice > 0 && scope.finalPrice > 0;
                    } catch(e) {
                        scope.showOldPrice = scope.finalPrice < scope.oldPrice && scope.oldPrice > 0 && scope.finalPrice > 0;
                    }
                } else {
                    scope.showOldPrice = scope.finalPrice < scope.oldPrice && scope.oldPrice > 0 && scope.finalPrice > 0;
                }
                
                // Calculate discount percent
                if (scope.calculateDiscountPercentFn) {
                    try {
                        scope.discountPercent = scope.calculateDiscountPercentFn({book: scope.book}) || 0;
                    } catch(e) {
                        if (scope.showOldPrice && scope.oldPrice > 0) {
                            scope.discountPercent = Math.round(((scope.oldPrice - scope.finalPrice) / scope.oldPrice) * 100);
                        } else {
                            scope.discountPercent = 0;
                        }
                    }
                } else if (scope.showOldPrice && scope.oldPrice > 0) {
                    scope.discountPercent = Math.round(((scope.oldPrice - scope.finalPrice) / scope.oldPrice) * 100);
                } else {
                    scope.discountPercent = 0;
                }
                
                // Show discount tag if not explicitly set
                if (attrs.showDiscountTag === undefined) {
                    scope.showDiscountTag = scope.showOldPrice;
                } else {
                    scope.showDiscountTag = attrs.showDiscountTag === 'true';
                }
            }
            
            // Check authentication
            function checkAuth() {
                if (scope.isAuthenticatedFn) {
                    scope.isAuthenticated = scope.isAuthenticatedFn();
                } else {
                    scope.isAuthenticated = true; // Default to true if not provided
                }
            }
            
            // Watch for book changes
            scope.$watch('book', function(newVal) {
                if (newVal) {
                    updatePrice();
                }
            }, true);
            
            // Watch for price-related changes
            scope.$watch(function() {
                return scope.book ? (scope.book.discountedPrice || scope.book.currentPrice || scope.book.unitPrice) : 0;
            }, function() {
                updatePrice();
            });
            
            // Watch for authentication changes
            if (scope.isAuthenticatedFn) {
                scope.$watch(function() {
                    return scope.isAuthenticatedFn();
                }, function(newVal) {
                    scope.isAuthenticated = newVal;
                });
            }
            
            // Handle add to cart click
            scope.onAddToCartClick = function() {
                if (scope.onAddToCart) {
                    scope.onAddToCart({book: scope.book});
                }
            };
            
            // Initialize
            checkAuth();
            updatePrice();
        }
    };
});

