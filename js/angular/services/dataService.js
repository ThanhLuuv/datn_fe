// Data Service
app.service('DataService', ['$http', '$q', function($http, $q) {
    var baseUrl = 'data/json/';
    
    // Get features data
    this.getFeatures = function() {
        return $http.get(baseUrl + 'features.json')
            .then(function(response) {
                return response;
            })
            .catch(function(error) {
                // Fallback data if file doesn't exist
                return $q.resolve({
                    data: [
                        {
                            id: 1,
                            title: 'Responsive Design',
                            description: 'Thiết kế đáp ứng trên mọi thiết bị',
                            icon: 'bi-phone'
                        },
                        {
                            id: 2,
                            title: 'Modern UI',
                            description: 'Giao diện người dùng hiện đại với Bootstrap',
                            icon: 'bi-palette'
                        },
                        {
                            id: 3,
                            title: 'AngularJS',
                            description: 'Framework JavaScript mạnh mẽ',
                            icon: 'bi-gear'
                        }
                    ]
                });
            });
    };

    // Get users data
    this.getUsers = function() {
        return $http.get(baseUrl + 'users.json')
            .then(function(response) {
                return response;
            })
            .catch(function(error) {
                return $q.resolve({
                    data: []
                });
            });
    };

    // Save data
    this.saveData = function(data) {
        // In a real application, this would make an API call
        return $q.resolve({ success: true, data: data });
    };
}]);
