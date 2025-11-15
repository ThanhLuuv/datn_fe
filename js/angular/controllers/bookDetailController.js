app.controller('BookDetailController', ['$scope', '$routeParams', '$location', 'BookstoreService', 'CartService', 'AuthService', function($scope, $routeParams, $location, BookstoreService, CartService, AuthService) {
    $scope.isbn = $routeParams.isbn;
    $scope.book = null;
    $scope.loading = true;
    $scope.error = '';
    $scope.addingToCart = false;
    $scope.ratings = [];
    $scope.ratingsLoading = false;
    $scope.ratingsTotal = 0;
    $scope.ratingsPage = 1;
    $scope.ratingsPageSize = 10;
    $scope.ratingsStats = null;

    $scope.getFinalPrice = function() {
        if (!$scope.book) return 0;
        if ($scope.book.effectivePrice != null) return Math.round($scope.book.effectivePrice);
        var base = ($scope.book.discountedPrice != null && !isNaN($scope.book.discountedPrice))
            ? $scope.book.discountedPrice
            : ($scope.book.currentPrice || 0);
        return Math.round(base);
    };

    $scope.getAuthorNames = function() {
        if (!$scope.book || !Array.isArray($scope.book.authors)) return '';
        return $scope.book.authors.map(function(a){ return a.fullName || a.name || (a.firstName && a.lastName ? (a.firstName + ' ' + a.lastName) : ''); }).filter(Boolean).join(', ');
    };

    $scope.addToCart = function() {
        // Check authentication first
        if (!AuthService.isAuthenticated()) {
            $location.path('/login');
            if (window.showNotification) {
                window.showNotification('Vui lòng đăng nhập để thêm sách vào giỏ hàng', 'warning');
            }
            return;
        }

        if (!$scope.book || !$scope.book.isbn) {
            if (window.showNotification) {
                window.showNotification('Thông tin sách không hợp lệ', 'danger');
            }
            return;
        }

        $scope.addingToCart = true;
        CartService.addToCart($scope.book.isbn, 1)
            .then(function(response) {
                if (response && response.data && response.data.success) {
                    if (window.showNotification) {
                        window.showNotification('Đã thêm "' + $scope.book.title + '" vào giỏ hàng', 'success');
                    }
                    // Update cart count
                    $scope.$emit('cart:changed');
                } else {
                    if (window.showNotification) {
                        window.showNotification('Không thể thêm vào giỏ hàng', 'warning');
                    }
                }
            })
            .catch(function(error) {
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
            })
            .finally(function() {
                $scope.addingToCart = false;
            });
    };

    function load() {
        BookstoreService.getBookByIsbn($scope.isbn)
            .then(function(res) { $scope.book = (res.data && (res.data.data || res.data)) || null; })
            .catch(function() { $scope.error = 'Không tải được thông tin sách'; })
            .finally(function() {
                if ($scope.book) {
                    // Optional effective price endpoint; ignore failure if not available
                    BookstoreService.getEffectivePrice($scope.book.isbn).then(function(r){
                        var d = r.data && (r.data.data || r.data);
                        if (d && typeof d.effectivePrice !== 'undefined') $scope.book.effectivePrice = d.effectivePrice;
                    }).catch(function(){ /* ignore */ }).finally(function(){ $scope.loading = false; $scope.$applyAsync(); });
                    // Load ratings after book is ready
                    $scope.loadRatings(1);
                    BookstoreService.getRatingsStats($scope.book.isbn).then(function(rs){
                        var s = rs.data && (rs.data.data || rs.data);
                        $scope.ratingsStats = s;
                    });
                } else {
                    $scope.loading = false; $scope.$applyAsync();
                }
            });
    }

    $scope.loadRatings = function(page){
        if (!$scope.isbn) return;
        $scope.ratingsLoading = true;
        $scope.ratingsPage = page || 1;
        BookstoreService.getRatings($scope.isbn, $scope.ratingsPage, $scope.ratingsPageSize)
            .then(function(res){
                var payload = res.data || {};
                $scope.ratings = payload.data || [];
                $scope.ratingsTotal = payload.total || 0;
                $scope.ratingsPage = payload.page || $scope.ratingsPage;
                $scope.ratingsPageSize = payload.pageSize || $scope.ratingsPageSize;
            })
            .finally(function(){ $scope.ratingsLoading = false; $scope.$applyAsync(); });
    };

    $scope.changeRatingsPage = function(p){ if (p>=1) { $scope.loadRatings(p); } };

    load();
}]);


