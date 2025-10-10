// Authentication Controllers

// Login Controller
app.controller('LoginController', ['$scope', '$location', '$window', '$rootScope', '$timeout', 'AuthService', 'APP_CONFIG', function($scope, $location, $window, $rootScope, $timeout, AuthService, APP_CONFIG) {
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
        try {
            console.log('LOGIN FUNCTION CALLED!');
            console.log('Form valid:', $scope.loginForm.$valid);
            if ($scope.loginForm.$valid) {
                $scope.isLoading = true;
                $scope.showError = false;
                $scope.showSuccess = false;

                AuthService.login($scope.loginData)
                    .then(function(response) {
                        console.log('LOGIN SUCCESS RESPONSE:', response);
                        $scope.isLoading = false;
                        $scope.showSuccess = true;
                        $scope.successMessage = 'Đăng nhập thành công!';
                        
                        // Store token and user info
                        if (response.data && response.data.data && response.data.data.token) {
                            localStorage.setItem('token', response.data.data.token);
                            
                            // Create user object with correct structure
                            var user = {
                                email: response.data.data.email,
                                roleId: response.data.data.role === 'ADMIN' ? 3 : 
                                       response.data.data.role === 'SALES_EMPLOYEE' ? 2 :
                                       response.data.data.role === 'DELIVERY_EMPLOYEE' ? 4 : 1,
                                role: response.data.data.role
                            };
                            localStorage.setItem('user', JSON.stringify(user));
                            
                            console.log('Login successful, user created:', user);
                            
                            // Update global auth state
                            $rootScope.isAuthenticated = true;
                            $rootScope.currentUser = user;
                            
                            console.log('Redirecting immediately...');
                            
                            // Redirect based on role with timeout
                            try {
                                $timeout(function() {
                                    if (user.roleId === 3) {
                                        console.log('Redirecting to admin page');
                                        console.log('Current location before:', $location.path());
                                        $location.path('/admin');
                                        console.log('Current location after:', $location.path());
                                        console.log('Full URL:', $location.url());
                                    } else if (user.roleId === 2 || user.roleId === 4) {
                                        console.log('Redirecting to employee page');
                                        $location.path('/employee');
                                    } else {
                                        console.log('Redirecting to home page');
                                        $location.path('/home');
                                    }
                                }, 0);
                            } catch (error) {
                                console.error('REDIRECT ERROR:', error);
                            }
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
        } catch (error) {
            console.error('LOGIN FUNCTION ERROR:', error);
            $scope.isLoading = false;
            $scope.showError = true;
            $scope.errorMessage = 'Có lỗi xảy ra: ' + error.message;
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
        roleId: 1, // CUSTOMER mặc định
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
                roleId: 1
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
                        roleId: 1,
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
            roleId: 1,
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

