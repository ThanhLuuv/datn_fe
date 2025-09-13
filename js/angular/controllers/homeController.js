// Home Controller
app.controller('HomeController', ['$scope', '$http', 'DataService', function($scope, $http, DataService) {
    $scope.title = 'Trang chủ';
    $scope.message = 'Chào mừng bạn đến với ứng dụng AngularJS!';
    $scope.features = [];
    $scope.loading = true;

    // Initialize controller
    $scope.init = function() {
        $scope.loadFeatures();
    };

    // Load features data
    $scope.loadFeatures = function() {
        DataService.getFeatures()
            .then(function(response) {
                $scope.features = response.data;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading features:', error);
                $scope.loading = false;
            });
    };

    // Add new feature
    $scope.addFeature = function() {
        if ($scope.newFeature && $scope.newFeature.trim()) {
            $scope.features.push({
                id: Date.now(),
                title: $scope.newFeature,
                description: 'Mô tả tính năng mới',
                icon: 'bi-star'
            });
            $scope.newFeature = '';
        }
    };

    // Remove feature
    $scope.removeFeature = function(index) {
        $scope.features.splice(index, 1);
    };

    // Initialize when controller loads
    $scope.init();
}]);
