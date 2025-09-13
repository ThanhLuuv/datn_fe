// Authentication Controllers

// Login Controller
app.controller('LoginController', ['$scope', '$location', 'AuthService', 'APP_CONFIG', function($scope, $location, AuthService, APP_CONFIG) {
    $scope.title = 'Đăng nhập';
    $scope.loginData = {
        email: '',
        password: '',
        rememberMe: false
    };
    $scope.isLoading = false;
    $scope.showError = false;
    $scope.showSuccess = false;
    $scope.errorMessage = '';
    $scope.successMessage = '';
    $scope.showPassword = false;

    // Toggle password visibility
    $scope.togglePassword = function() {
        $scope.showPassword = !$scope.showPassword;
    };

    // Login function
    $scope.login = function() {
        if ($scope.loginForm.$valid) {
            $scope.isLoading = true;
            $scope.showError = false;
            $scope.showSuccess = false;

            AuthService.login($scope.loginData)
                .then(function(response) {
                    $scope.isLoading = false;
                    $scope.showSuccess = true;
                    $scope.successMessage = 'Đăng nhập thành công!';
                    
                    // Store token and user info
                    if (response.data && response.data.token) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        
                        // Redirect based on role
                        setTimeout(function() {
                            var user = response.data.user;
                            if (user.roleId === 3) {
                                $location.path('/admin');
                            } else if (user.roleId === 2) {
                                $location.path('/employee');
                            } else {
                                $location.path('/home');
                            }
                        }, 1500);
                    }
                })
                .catch(function(error) {
                    $scope.isLoading = false;
                    $scope.showError = true;
                    
                    if (error.data && error.data.message) {
                        $scope.errorMessage = error.data.message;
                    } else if (error.status === 401) {
                        $scope.errorMessage = 'Email hoặc mật khẩu không đúng!';
                    } else if (error.status === 0) {
                        $scope.errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau!';
                    } else {
                        $scope.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!';
                    }
                });
        }
    };

    // Demo login functions
    $scope.demoLogin = function(role) {
        var demoAccounts = {
            admin: { email: 'admin@bookstore.com', password: '123456' },
            employee: { email: 'staff@bookstore.com', password: '123456' },
            customer: { email: 'user@bookstore.com', password: '123456' }
        };
        
        $scope.loginData = demoAccounts[role];
        $scope.login();
    };
}]);

// Register Controller
app.controller('RegisterController', ['$scope', '$location', 'AuthService', 'APP_CONFIG', function($scope, $location, AuthService, APP_CONFIG) {
    $scope.title = 'Đăng ký';
    $scope.registerData = {
        email: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        agreeTerms: false
    };
    $scope.isLoading = false;
    $scope.showError = false;
    $scope.showSuccess = false;
    $scope.errorMessage = '';
    $scope.successMessage = '';
    $scope.showPassword = false;
    $scope.showConfirmPassword = false;

    // Toggle password visibility
    $scope.togglePassword = function() {
        $scope.showPassword = !$scope.showPassword;
    };

    // Toggle confirm password visibility
    $scope.toggleConfirmPassword = function() {
        $scope.showConfirmPassword = !$scope.showConfirmPassword;
    };

    // Custom validation for password match
    $scope.$watch('registerData.confirmPassword', function() {
        if ($scope.registerData.password && $scope.registerData.confirmPassword) {
            if ($scope.registerData.password !== $scope.registerData.confirmPassword) {
                $scope.registerForm.confirmPassword.$setValidity('passwordMatch', false);
            } else {
                $scope.registerForm.confirmPassword.$setValidity('passwordMatch', true);
            }
        }
    });

    // Register function
    $scope.register = function() {
        if ($scope.registerForm.$valid && $scope.registerData.password === $scope.registerData.confirmPassword) {
            $scope.isLoading = true;
            $scope.showError = false;
            $scope.showSuccess = false;

            // Prepare data for API
            var registerPayload = {
                email: $scope.registerData.email,
                password: $scope.registerData.password,
                confirmPassword: $scope.registerData.confirmPassword,
                roleId: parseInt($scope.registerData.roleId)
            };

            AuthService.register(registerPayload)
                .then(function(response) {
                    $scope.isLoading = false;
                    $scope.showSuccess = true;
                    $scope.successMessage = 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.';
                    
                    // Clear form
                    $scope.registerData = {
                        email: '',
                        password: '',
                        confirmPassword: '',
                        roleId: '',
                        agreeTerms: false
                    };
                    $scope.registerForm.$setPristine();
                    $scope.registerForm.$setUntouched();
                    
                    // Redirect to login after 3 seconds
                    setTimeout(function() {
                        $location.path('/login');
                    }, 3000);
                })
                .catch(function(error) {
                    $scope.isLoading = false;
                    $scope.showError = true;
                    
                    if (error.data && error.data.message) {
                        $scope.errorMessage = error.data.message;
                    } else if (error.status === 400) {
                        $scope.errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!';
                    } else if (error.status === 409) {
                        $scope.errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác!';
                    } else if (error.status === 0) {
                        $scope.errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau!';
                    } else {
                        $scope.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!';
                    }
                });
        }
    };

    // Reset form
    $scope.resetForm = function() {
        $scope.registerData = {
            email: '',
            password: '',
            confirmPassword: '',
            roleId: '',
            agreeTerms: false
        };
        $scope.registerForm.$setPristine();
        $scope.registerForm.$setUntouched();
        $scope.showError = false;
        $scope.showSuccess = false;
    };
}]);

// Logout Controller
app.controller('LogoutController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
    // Clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    $location.path('/login');
}]);

