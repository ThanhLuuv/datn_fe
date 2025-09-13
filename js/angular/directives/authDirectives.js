// Authentication Directives

// Password strength indicator
app.directive('passwordStrength', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var strengthBar = angular.element('<div class="password-strength"><div class="password-strength-bar"></div></div>');
            element.after(strengthBar);
            
            scope.$watch(attrs.passwordStrength, function(password) {
                if (!password) {
                    strengthBar.find('.password-strength-bar').removeClass().addClass('password-strength-bar');
                    return;
                }
                
                var strength = calculatePasswordStrength(password);
                var bar = strengthBar.find('.password-strength-bar');
                
                bar.removeClass().addClass('password-strength-bar');
                
                if (strength < 25) {
                    bar.addClass('password-strength-weak');
                } else if (strength < 50) {
                    bar.addClass('password-strength-medium');
                } else if (strength < 75) {
                    bar.addClass('password-strength-strong');
                } else {
                    bar.addClass('password-strength-very-strong');
                }
            });
            
            function calculatePasswordStrength(password) {
                var strength = 0;
                
                // Length check
                if (password.length >= 6) strength += 20;
                if (password.length >= 8) strength += 10;
                if (password.length >= 12) strength += 10;
                
                // Character variety
                if (/[a-z]/.test(password)) strength += 10;
                if (/[A-Z]/.test(password)) strength += 10;
                if (/[0-9]/.test(password)) strength += 10;
                if (/[^A-Za-z0-9]/.test(password)) strength += 20;
                
                // Common patterns
                if (!/(.)\1{2,}/.test(password)) strength += 10; // No repeated characters
                
                return Math.min(strength, 100);
            }
        }
    };
});

// Email validation directive
app.directive('emailValidator', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$validators.emailFormat = function(modelValue) {
                if (!modelValue) return true;
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(modelValue);
            };
        }
    };
});

// Password match validator
app.directive('passwordMatch', function() {
    return {
        require: 'ngModel',
        scope: {
            passwordMatch: '='
        },
        link: function(scope, element, attrs, ngModel) {
            ngModel.$validators.passwordMatch = function(modelValue) {
                return modelValue === scope.passwordMatch;
            };
            
            scope.$watch('passwordMatch', function() {
                ngModel.$validate();
            });
        }
    };
});

// Role-based access directive
app.directive('roleAccess', function() {
    return {
        restrict: 'A',
        scope: {
            roleAccess: '@'
        },
        link: function(scope, element, attrs) {
            scope.$watch('roleAccess', function(role) {
                if (role) {
                    var user = JSON.parse(localStorage.getItem('user') || '{}');
                    var hasAccess = false;
                    
                    switch(role) {
                        case 'admin':
                            hasAccess = user.roleId === 3;
                            break;
                        case 'employee':
                            hasAccess = user.roleId === 2;
                            break;
                        case 'staff':
                            hasAccess = user.roleId === 2 || user.roleId === 3;
                            break;
                        case 'customer':
                            hasAccess = user.roleId === 1;
                            break;
                    }
                    
                    if (!hasAccess) {
                        element.hide();
                    } else {
                        element.show();
                    }
                }
            });
        }
    };
});

// Auto-focus directive
app.directive('autoFocus', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $timeout(function() {
                element[0].focus();
            }, 100);
        }
    };
});

// Form validation helper
app.directive('formValidator', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var form = element;
            
            // Add validation classes on blur
            form.find('input, select, textarea').on('blur', function() {
                var field = angular.element(this);
                var ngModel = field.controller('ngModel');
                
                if (ngModel) {
                    if (ngModel.$invalid && ngModel.$touched) {
                        field.addClass('is-invalid');
                        field.removeClass('is-valid');
                    } else if (ngModel.$valid && ngModel.$touched) {
                        field.addClass('is-valid');
                        field.removeClass('is-invalid');
                    }
                }
            });
            
            // Clear validation on input
            form.find('input, select, textarea').on('input', function() {
                var field = angular.element(this);
                field.removeClass('is-invalid is-valid');
            });
        }
    };
});

// Loading button directive
app.directive('loadingButton', function() {
    return {
        restrict: 'A',
        scope: {
            loading: '=',
            loadingText: '@',
            normalText: '@'
        },
        link: function(scope, element, attrs) {
            var originalText = element.text();
            var loadingText = scope.loadingText || 'Đang xử lý...';
            
            scope.$watch('loading', function(isLoading) {
                if (isLoading) {
                    element.prop('disabled', true);
                    element.html('<span class="spinner-border spinner-border-sm me-2"></span>' + loadingText);
                } else {
                    element.prop('disabled', false);
                    element.html(scope.normalText || originalText);
                }
            });
        }
    };
});

// Alert auto-dismiss directive
app.directive('autoDismiss', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            autoDismiss: '=',
            dismissTime: '@'
        },
        link: function(scope, element, attrs) {
            var dismissTime = parseInt(scope.dismissTime) || 5000;
            
            scope.$watch('autoDismiss', function(shouldDismiss) {
                if (shouldDismiss) {
                    $timeout(function() {
                        element.alert('close');
                    }, dismissTime);
                }
            });
        }
    };
});

