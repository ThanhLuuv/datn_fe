// Permission Directives - Các directive để kiểm soát quyền truy cập
console.log('Loading Permission Directives...');

// Directive kiểm tra quyền admin
app.directive('adminOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.isAdmin()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền admin hoặc giáo viên
app.directive('adminOrTeacherOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.isAdminOrTeacher()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền sales employee
app.directive('salesOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.isSalesEmployee() && !AuthService.isAdmin()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền delivery employee
app.directive('deliveryOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.isDeliveryEmployee() && !AuthService.isAdmin()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền staff (sales + delivery + admin)
app.directive('staffOnly', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.isStaff()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền quản lý danh mục
app.directive('canManageCategories', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.canManageCategories()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền quản lý sản phẩm
app.directive('canManageProducts', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.canManageProducts()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền quản lý đơn đặt hàng
app.directive('canManagePurchaseOrders', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.canManagePurchaseOrders()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền quản lý phiếu nhập
app.directive('canManageGoodsReceipts', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.canManageGoodsReceipts()) {
                element.remove();
            }
        }
    };
}]);

// Directive kiểm tra quyền xem sách
app.directive('canViewBooks', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (!AuthService.canViewBooks()) {
                element.remove();
            }
        }
    };
}]);

// Directive hiển thị dựa trên role ID
app.directive('showForRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var allowedRoles = attrs.showForRole.split(',').map(function(role) {
                return parseInt(role.trim());
            });
            
            var currentUser = AuthService.getCurrentUser();
            if (!currentUser || allowedRoles.indexOf(currentUser.roleId) === -1) {
                element.remove();
            }
        }
    };
}]);

// Directive ẩn dựa trên role ID
app.directive('hideForRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var hiddenRoles = attrs.hideForRole.split(',').map(function(role) {
                return parseInt(role.trim());
            });
            
            var currentUser = AuthService.getCurrentUser();
            if (currentUser && hiddenRoles.indexOf(currentUser.roleId) !== -1) {
                element.remove();
            }
        }
    };
}]);
