app.controller('SearchController', ['$scope', '$location', 'BookstoreService', 'CartService', function($scope, $location, BookstoreService, CartService) {
    $scope.query = ($location.search().q || '').trim();
    $scope.page = parseInt($location.search().page || '1');
    $scope.pageSize = parseInt($location.search().pageSize || '12');
    $scope.results = [];
    $scope.filteredResults = [];
    $scope.total = 0;
    $scope.loaded = false;
    $scope.loading = false;
    $scope.Math = window.Math;

    $scope.getFinalPrice = function(book) {
        if (!book) return 0;
        var base = book.unitPrice || 0;
        var percent = book.promoPercent || book.discountPercent || null;
        var amount = book.promoAmount || book.discountAmount || null;
        var priceByPercent = (percent && percent > 0) ? Math.round(base * (1 - percent / 100)) : null;
        var priceByAmount = (amount && amount > 0) ? Math.max(0, Math.round(base - amount)) : null;
        var candidates = [base];
        if (priceByPercent !== null) candidates.push(priceByPercent);
        if (priceByAmount !== null) candidates.push(priceByAmount);
        return Math.min.apply(null, candidates);
    };
    $scope.hasPromo = function(book) { return $scope.getFinalPrice(book) < (book.unitPrice || 0); };

    // Filter results to only show books with status: true
    $scope.filterActiveBooks = function() {
        $scope.filteredResults = ($scope.results || []).filter(function(book) {
            return book.status === true;
        });
    };

    $scope.addToCart = function(book) {
        if (!book) return;
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

    $scope.doSearch = function() {
        $scope.loading = true;
        if (!$scope.query) {
            // Empty query => fetch all books (pageable)
            BookstoreService.getBooks({ pageNumber: $scope.page, pageSize: $scope.pageSize, searchTerm: '' })
                .then(function(res){
                    var resp = res.data || {};
                    if (resp.success && resp.data && Array.isArray(resp.data.books)) {
                        $scope.results = resp.data.books;
                        $scope.total = resp.data.totalCount || 0;
                    } else if (Array.isArray(resp.data)) {
                        $scope.results = resp.data;
                        $scope.total = resp.totalCount || 0;
                    } else {
                        $scope.results = [];
                        $scope.total = 0;
                    }
                    $scope.loaded = true;
                    $scope.loading = false;
                    $scope.filterActiveBooks();
                })
                .catch(function(){
                    $scope.results = [];
                    $scope.total = 0;
                    $scope.loaded = true;
                    $scope.loading = false;
                    $scope.filterActiveBooks();
                });
            return;
        }
        BookstoreService.searchBooksByTitle($scope.query, $scope.page, $scope.pageSize)
            .then(function(res) {
                var data = res.data || {};
                $scope.results = data.items || data.data || [];
                $scope.total = data.total || 0;
                // best-effort fetch effective prices
                $scope.results.forEach(function(b){
                    BookstoreService.getEffectivePrice(b.isbn).then(function(r){
                        var d = r.data && (r.data.data || r.data);
                        if (d && typeof d.effectivePrice !== 'undefined') b.effectivePrice = d.effectivePrice;
                    }).catch(function(){});
                });
                $scope.loaded = true;
                $scope.loading = false;
                $scope.filterActiveBooks();
                setTimeout(function() { if (typeof initializeTooltips === 'function') initializeTooltips(); }, 100);
            })
            .catch(function() {
                $scope.results = [];
                $scope.total = 0;
                $scope.loaded = true;
                $scope.loading = false;
                $scope.filterActiveBooks();
            });
    };

    $scope.goPage = function(p) {
        if (p < 1) return;
        $scope.page = p;
        $location.search({ q: $scope.query, page: $scope.page, pageSize: $scope.pageSize });
        $scope.doSearch();
    };

    // initial load
    $scope.doSearch();
}]);

