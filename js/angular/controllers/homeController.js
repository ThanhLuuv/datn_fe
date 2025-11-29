// Home Controller
app.controller('HomeController', ['$scope', '$http', '$location', 'DataService', 'BookstoreService', 'CartService', 'AuthService', function ($scope, $http, $location, DataService, BookstoreService, CartService, AuthService) {
    $scope.title = 'BookStore - Khám phá thế giới qua những trang sách';
    $scope.message = 'Hệ thống quản lý hiệu sách hiện đại';
    $scope.categories = [];
    $scope.loading = true;
    $scope.loadingGlobal = false;
    var pendingLoads = 0;

    function beginLoading() {
        pendingLoads++;
        $scope.loadingGlobal = true;
    }

    function endLoading() {
        pendingLoads = Math.max(0, pendingLoads - 1);
        if (pendingLoads === 0) $scope.loadingGlobal = false;
    }
    $scope.bestSellers = [];
    $scope.newBooks = [];
    $scope.promotionBooks = [];
    $scope.error = '';

    // Compute promotional price per rules: prefer percent, show lowest
    $scope.getFinalPrice = function (book) {
        if (!book) return 0;

        // Use discountedPrice if available (from new API)
        if (book.discountedPrice != null) return Math.round(book.discountedPrice);

        // Use currentPrice as fallback
        if (book.currentPrice != null) return Math.round(book.currentPrice);

        // Legacy support for old API structure
        if (book.effectivePrice != null) return Math.round(book.effectivePrice);

        var base = book.unitPrice || book.averagePrice || 0;
        var percent = book.promoPercent || book.discountPercent || null;
        var amount = book.promoAmount || book.discountAmount || null;
        var priceByPercent = (percent && percent > 0) ? Math.round(base * (1 - percent / 100)) : null;
        var priceByAmount = (amount && amount > 0) ? Math.max(0, Math.round(base - amount)) : null;
        var candidates = [base];
        if (priceByPercent !== null) candidates.push(priceByPercent);
        if (priceByAmount !== null) candidates.push(priceByAmount);
        return Math.min.apply(null, candidates);
    };

    $scope.hasPromo = function (book) {
        if (!book) return false;
        var finalPrice = $scope.getFinalPrice(book);
        var originalPrice = book.currentPrice || book.unitPrice || book.averagePrice || 0;
        return finalPrice < originalPrice || book.hasPromotion === true;
    };

    // Calculate discount percentage
    $scope.calculateDiscountPercent = function (book) {
        if (book) {
            var finalPrice = $scope.getFinalPrice(book);
            var originalPrice = book.currentPrice || book.unitPrice || book.averagePrice || 0;
            if (originalPrice > 0) {
                var discount = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
                return discount;
            }
        }
        return 0;
    };

    // Rating functions
    $scope.getStarArray = function (rating) {
        if (!rating) return [];
        var filledStars = Math.floor(parseFloat(rating));
        var stars = [];
        for (var i = 0; i < filledStars; i++) {
            stars.push(i);
        }
        return stars;
    };

    $scope.getEmptyStarArray = function (rating) {
        if (!rating) {
            var emptyStars = [];
            for (var i = 0; i < 5; i++) {
                emptyStars.push(i);
            }
            return emptyStars;
        }
        var filledStars = Math.floor(parseFloat(rating));
        var emptyStars = [];
        for (var i = 0; i < (5 - filledStars); i++) {
            emptyStars.push(i);
        }
        return emptyStars;
    };

    $scope.addToCart = function (book) {
        if (!book) return;
        if (!AuthService.isAuthenticated()) {
            $location.path('/login');
            if (window.showNotification) {
                window.showNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning');
            }
            return;
        }
        var finalPrice = $scope.getFinalPrice(book);
        CartService.addItem({
            isbn: book.isbn,
            title: book.title,
            unitPrice: finalPrice,
            imageUrl: book.imageUrl,
            qty: 1
        });
        if (window.showNotification) {
            window.showNotification('Đã thêm "' + book.title + '" vào giỏ', 'success');
        }
    };

    // Initialize controller
    $scope.init = function () {
        $scope.loadCategories();
        $scope.loadPromotionBooks();
        $scope.loadBestSellers();
        $scope.loadNewBooks();
    };

    // Removed features section per simplified home requirements

    // Load bestsellers using new API
    $scope.loadBestSellers = function () {
        beginLoading();
        BookstoreService.getBestsellerBooks(8)
            .then(function (res) {
                $scope.bestSellers = (res.data && res.data.data) ? res.data.data : [];

                // Filter to only show active books with stock > 1
                $scope.bestSellers = $scope.bestSellers.filter(function (book) {
                    return book.status === true && (book.stock || 0) > 1;
                });

                // Initialize tooltips after data is loaded
                setTimeout(function () {
                    if (typeof initializeTooltips === 'function') {
                        initializeTooltips();
                    }
                }, 100);
            })
            .catch(function () {
                $scope.bestSellers = [];
                $scope.error = 'Không tải được danh sách bán chạy';
            })
            .finally(function () { $scope.loading = false; endLoading(); });
    };

    // Load new books using new API
    $scope.loadNewBooks = function () {
        beginLoading();
        BookstoreService.getLatestBooks(8)
            .then(function (res) {
                $scope.newBooks = (res.data && res.data.data) ? res.data.data : [];

                // Filter to only show active books with stock > 1
                $scope.newBooks = $scope.newBooks.filter(function (book) {
                    return book.status === true && (book.stock || 0) > 1;
                });

                // Initialize tooltips after data is loaded
                setTimeout(function () {
                    if (typeof initializeTooltips === 'function') {
                        initializeTooltips();
                    }
                }, 100);
            })
            .catch(function () {
                $scope.newBooks = [];
                $scope.error = 'Không tải được sách mới';
            })
            .finally(function () { $scope.loading = false; endLoading(); });
    };

    // Load promotion books using new API
    $scope.loadPromotionBooks = function () {
        beginLoading();
        BookstoreService.getPromotionBooks(8)
            .then(function (res) {
                $scope.promotionBooks = (res.data && res.data.data) ? res.data.data : [];

                // Filter to only show active books with stock > 1
                $scope.promotionBooks = $scope.promotionBooks.filter(function (book) {
                    return book.status === true && (book.stock || 0) > 1;
                });

                // Initialize tooltips after data is loaded
                setTimeout(function () {
                    if (typeof initializeTooltips === 'function') {
                        initializeTooltips();
                    }
                }, 100);
            })
            .catch(function () {
                $scope.promotionBooks = [];
                $scope.error = 'Không tải được sách khuyến mãi';
            })
            .finally(function () { $scope.loading = false; endLoading(); });
    };

    // Open category: navigate to search page with category filter
    $scope.openCategory = function (category, keyword) {
        if (!category) return;
        var id = category.categoryId || category.id;
        $location.path('/search').search({
            categoryId: id,
            q: (keyword || '').trim(),
            page: 1,
            pageSize: 12
        });
    };

    // Load categories data from API
    $scope.loadCategories = function () {
        BookstoreService.getCategories({ pageNumber: 1, pageSize: 12, searchTerm: '' })
            .then(function (response) {
                if (response && response.data) {
                    if (response.data.success && response.data.data && Array.isArray(response.data.data.categories)) {
                        $scope.categories = response.data.data.categories;
                    } else if (Array.isArray(response.data.data)) {
                        $scope.categories = response.data.data;
                    } else if (Array.isArray(response.data)) {
                        $scope.categories = response.data;
                    } else {
                        $scope.categories = [];
                    }
                } else {
                    $scope.categories = [];
                }
            })
            .catch(function () {
                $scope.categories = [];
            });
    };

    // Add to cart function
    $scope.addToCart = function (book) {
        // Check authentication first
        if (!AuthService.isAuthenticated()) {
            $location.path('/login');
            if (window.showNotification) {
                window.showNotification('Vui lòng đăng nhập để thêm sách vào giỏ hàng', 'warning');
            }
            return;
        }

        if (!book || !book.isbn) {
            if (window.showNotification) {
                window.showNotification('Thông tin sách không hợp lệ', 'danger');
            }
            return;
        }

        CartService.addToCart(book.isbn, 1)
            .then(function (response) {
                if (response && response.data && response.data.success) {
                    if (window.showNotification) {
                        window.showNotification('Đã thêm "' + book.title + '" vào giỏ hàng', 'success');
                    }
                    // Update cart count
                    $scope.$emit('cart:changed');
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể thêm vào giỏ hàng', 'warning');
                    }
                }
            })
            .catch(function (error) {
                console.error('Add to cart error:', error);
                if (error.data && error.data.message) {
                    if (window.showNotification) {
                        window.showNotification(error.data.message, 'danger');
                    }
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể thêm vào giỏ hàng', 'danger');
                    }
                }
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);
