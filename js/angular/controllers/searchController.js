app.controller('SearchController', ['$scope', '$location', 'BookstoreService', function($scope, $location, BookstoreService) {
    $scope.query = ($location.search().q || '').trim();
    $scope.page = parseInt($location.search().page || '1');
    $scope.pageSize = parseInt($location.search().pageSize || '12');
    $scope.results = [];
    $scope.total = 0;
    $scope.loaded = false;
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

    $scope.doSearch = function() {
        if (!$scope.query) {
            $scope.results = [];
            $scope.total = 0;
            $scope.loaded = true;
            return;
        }
        BookstoreService.searchBooksByTitle($scope.query, $scope.page, $scope.pageSize)
            .then(function(res) {
                var data = res.data || {};
                $scope.results = data.items || data.data || [];
                $scope.total = data.total || 0;
                $scope.loaded = true;
                setTimeout(function() { if (typeof initializeTooltips === 'function') initializeTooltips(); }, 100);
            })
            .catch(function() {
                $scope.results = [];
                $scope.total = 0;
                $scope.loaded = true;
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

