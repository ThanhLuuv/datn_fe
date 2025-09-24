app.controller('BookDetailController', ['$scope', '$routeParams', 'BookstoreService', 'CartService', function($scope, $routeParams, BookstoreService, CartService) {
    $scope.isbn = $routeParams.isbn;
    $scope.book = null;
    $scope.loading = true;
    $scope.error = '';

    $scope.getFinalPrice = function() {
        if (!$scope.book) return 0;
        if ($scope.book.effectivePrice != null) return Math.round($scope.book.effectivePrice);
        var base = $scope.book.unitPrice || 0;
        return Math.round(base);
    };

    $scope.addToCart = function() {
        if (!$scope.book) return;
        CartService.addItem({
            isbn: $scope.book.isbn,
            title: $scope.book.title,
            unitPrice: $scope.getFinalPrice(),
            imageUrl: $scope.book.imageUrl,
            qty: 1
        });
        if (window.showNotification) {
            window.showNotification('Đã thêm "' + $scope.book.title + '" vào giỏ', 'success');
        }
    };

    function load() {
        BookstoreService.getBookByIsbn($scope.isbn)
            .then(function(res) { $scope.book = (res.data && (res.data.data || res.data)) || null; })
            .catch(function() { $scope.error = 'Không tải được thông tin sách'; })
            .finally(function() {
                if ($scope.book) {
                    BookstoreService.getEffectivePrice($scope.book.isbn).then(function(r){
                        var d = r.data && (r.data.data || r.data);
                        if (d && typeof d.effectivePrice !== 'undefined') $scope.book.effectivePrice = d.effectivePrice;
                    }).finally(function(){ $scope.loading = false; $scope.$applyAsync(); });
                } else {
                    $scope.loading = false; $scope.$applyAsync();
                }
            });
    }

    load();
}]);


