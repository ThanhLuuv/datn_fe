// Contact Controller
app.controller('ContactController', ['$scope', '$http', function($scope, $http) {
    $scope.title = 'Liên hệ';
    $scope.contactForm = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };
    $scope.submitted = false;
    $scope.sending = false;

    // Contact information
    $scope.contactInfo = {
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        phone: '+84 123 456 789',
        email: 'contact@example.com',
        hours: 'Thứ 2 - Thứ 6: 8:00 - 17:00'
    };

    // Submit contact form
    $scope.submitForm = function() {
        if ($scope.contactForm.$valid) {
            $scope.sending = true;
            
            // Simulate API call
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.sending = false;
                    $scope.submitted = true;
                    $scope.contactForm = {
                        name: '',
                        email: '',
                        subject: '',
                        message: ''
                    };
                });
            }, 2000);
        }
    };

    // Reset form
    $scope.resetForm = function() {
        $scope.contactForm = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
        $scope.submitted = false;
    };
}]);
