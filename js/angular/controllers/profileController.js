// Customer Profile Controller
app.controller('ProfileController', ['$scope', '$rootScope', '$location', 'BookstoreService', 'AuthService',
    function($scope, $rootScope, $location, BookstoreService, AuthService) {
        // Redirect to login if not authenticated
        if (!AuthService.isAuthenticated() || !AuthService.isCustomer()) {
            $location.path('/login');
            return;
        }

        $scope.title = 'Thông tin cá nhân';
        $scope.loading = true;
        $scope.saving = false;
        $scope.errorMessage = '';
        $scope.successMessage = '';
        $scope.showError = false;
        $scope.showSuccess = false;

        $scope.genderOptions = [
            { value: 'Male', text: 'Nam' },
            { value: 'Female', text: 'Nữ' },
            { value: 'Other', text: 'Khác' }
        ];

        $scope.profile = {
            firstName: '',
            lastName: '',
            gender: 'Other',
            dateOfBirth: null,
            address: '',
            phone: '',
            email: ''
        };

        function updateUserFullName(firstName, lastName) {
            try {
                var userStr = localStorage.getItem('user');
                if (!userStr) return;
                var user = JSON.parse(userStr);
                user.fullName = (firstName || '') + ' ' + (lastName || '');
                localStorage.setItem('user', JSON.stringify(user));
                $rootScope.currentUser = user;
            } catch (e) {
                console.warn('Cannot update user fullName:', e);
            }
        }

        $scope.loadProfile = function() {
            $scope.loading = true;
            BookstoreService.getMyProfile()
                .then(function(response) {
                    var payload = response && response.data ? response.data : null;
                    var data = payload && payload.data ? payload.data : null;
                    if (!data) {
                        $scope.loading = false;
                        return;
                    }

                    $scope.profile.firstName = data.firstName || '';
                    $scope.profile.lastName = data.lastName || '';
                    $scope.profile.gender = data.gender || 'Other';
                    $scope.profile.address = data.address || '';
                    $scope.profile.phone = data.phone || '';
                    $scope.profile.email = data.email || '';

                    // Convert date string to Date object for input[type=date]
                    if (data.dateOfBirth) {
                        var d = new Date(data.dateOfBirth);
                        if (!isNaN(d.getTime())) {
                            $scope.profile.dateOfBirth = d;
                        }
                    }

                    updateUserFullName($scope.profile.firstName, $scope.profile.lastName);
                    $scope.loading = false;
                })
                .catch(function(error) {
                    console.error('Error loading profile:', error);
                    $scope.loading = false;
                    $scope.showError = true;
                    $scope.errorMessage = (error && error.data && error.data.message) || 'Không thể tải thông tin cá nhân';
                });
        };

        $scope.saveProfile = function() {
            if ($scope.profileForm && $scope.profileForm.$invalid) {
                $scope.showError = true;
                $scope.errorMessage = 'Vui lòng kiểm tra lại các trường bắt buộc';
                return;
            }

            $scope.saving = true;
            $scope.showError = false;
            $scope.showSuccess = false;

            var payload = {
                firstName: $scope.profile.firstName,
                lastName: $scope.profile.lastName,
                gender: $scope.profile.gender,
                dateOfBirth: $scope.profile.dateOfBirth,
                address: $scope.profile.address,
                phone: $scope.profile.phone,
                email: $scope.profile.email
            };

            BookstoreService.updateMyProfile(payload)
                .then(function(response) {
                    $scope.saving = false;
                    $scope.showSuccess = true;
                    var msg = response && response.data && response.data.message
                        ? response.data.message
                        : 'Cập nhật thông tin thành công';
                    $scope.successMessage = msg;

                    updateUserFullName($scope.profile.firstName, $scope.profile.lastName);
                })
                .catch(function(error) {
                    console.error('Error updating profile:', error);
                    $scope.saving = false;
                    $scope.showError = true;
                    $scope.errorMessage = (error && error.data && error.data.message) || 'Không thể cập nhật thông tin cá nhân';
                });
        };

        // Init
        $scope.loadProfile();
    }
]);


