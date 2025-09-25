// Common Directives - Các directive chung cho UI
console.log('Loading Common Directives...');

// Directive cho loading spinner
app.directive('loadingSpinner', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        template: '<div class="d-flex justify-content-center align-items-center" ng-show="loading">' +
                  '<div class="spinner-border text-primary" role="status">' +
                  '<span class="visually-hidden">Đang tải...</span>' +
                  '</div>' +
                  '<span class="ms-2">Đang tải...</span>' +
                  '</div>',
        scope: {
            loading: '='
        },
        link: function(scope, element, attrs) {
            // Ensure proper initialization
            scope.loading = scope.loading || false;
        }
    };
}]);

// Directive cho empty state
app.directive('emptyState', function() {
    return {
        restrict: 'E',
        template: '<div class="text-center py-5" ng-if="show">' +
                  '<i class="bi bi-inbox display-1 text-muted"></i>' +
                  '<h4 class="mt-3 text-muted">{{title || "Không có dữ liệu"}}</h4>' +
                  '<p class="text-muted">{{message || "Chưa có dữ liệu để hiển thị"}}</p>' +
                  '<button class="btn btn-primary" ng-if="actionText" ng-click="action()">' +
                  '{{actionText}}' +
                  '</button>' +
                  '</div>',
        scope: {
            show: '=',
            title: '@',
            message: '@',
            actionText: '@',
            action: '&'
        }
    };
});

// Directive cho error state
app.directive('errorState', function() {
    return {
        restrict: 'E',
        template: '<div class="alert alert-danger" ng-if="show">' +
                  '<i class="bi bi-exclamation-triangle me-2"></i>' +
                  '<strong>Lỗi:</strong> {{message || "Có lỗi xảy ra"}}' +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert" ng-if="dismissible"></button>' +
                  '</div>',
        scope: {
            show: '=',
            message: '@',
            dismissible: '='
        }
    };
});

// Directive cho success message - REMOVED to avoid conflict with alertMessage

// Directive cho pagination
app.directive('pagination', function() {
    return {
        restrict: 'E',
        template: '<nav aria-label="Phân trang" ng-if="totalPages > 1">' +
                  '<ul class="pagination justify-content-center">' +
                  '<li class="page-item" ng-class="{\'disabled\': currentPage === 1}">' +
                  '<a class="page-link" href="#" ng-click="goToPage(1)">Đầu</a>' +
                  '</li>' +
                  '<li class="page-item" ng-class="{\'disabled\': currentPage === 1}">' +
                  '<a class="page-link" href="#" ng-click="goToPage(currentPage - 1)">Trước</a>' +
                  '</li>' +
                  '<li class="page-item" ng-repeat="page in pages" ng-class="{\'active\': page === currentPage}">' +
                  '<a class="page-link" href="#" ng-click="goToPage(page)">{{page}}</a>' +
                  '</li>' +
                  '<li class="page-item" ng-class="{\'disabled\': currentPage === totalPages}">' +
                  '<a class="page-link" href="#" ng-click="goToPage(currentPage + 1)">Sau</a>' +
                  '</li>' +
                  '<li class="page-item" ng-class="{\'disabled\': currentPage === totalPages}">' +
                  '<a class="page-link" href="#" ng-click="goToPage(totalPages)">Cuối</a>' +
                  '</li>' +
                  '</ul>' +
                  '</nav>',
        scope: {
            currentPage: '=',
            totalPages: '=',
            onPageChange: '&'
        },
        link: function(scope) {
            scope.pages = [];
            
            scope.$watch('totalPages', function() {
                scope.pages = [];
                var start = Math.max(1, scope.currentPage - 2);
                var end = Math.min(scope.totalPages, scope.currentPage + 2);
                
                for (var i = start; i <= end; i++) {
                    scope.pages.push(i);
                }
            });
            
            scope.goToPage = function(page) {
                if (page >= 1 && page <= scope.totalPages && page !== scope.currentPage) {
                    scope.onPageChange({page: page});
                }
            };
        }
    };
});

// Directive cho search box
app.directive('searchBox', function() {
    return {
        restrict: 'E',
        template: '<div class="input-group mb-3">' +
                  '<input type="text" class="form-control" placeholder="{{placeholder}}" ng-model="searchTerm" ng-keyup="$event.keyCode === 13 && onSearch()">' +
                  '<button class="btn btn-outline-secondary" type="button" ng-click="onSearch()">' +
                  '<i class="bi bi-search"></i>' +
                  '</button>' +
                  '<button class="btn btn-outline-secondary" type="button" ng-if="searchTerm" ng-click="clearSearch()">' +
                  '<i class="bi bi-x"></i>' +
                  '</button>' +
                  '</div>',
        scope: {
            placeholder: '@',
            searchTerm: '=',
            onSearch: '&',
            onClear: '&'
        },
        link: function(scope) {
            scope.clearSearch = function() {
                scope.searchTerm = '';
                scope.onClear();
            };
        }
    };
});

// Directive cho confirm dialog
app.directive('confirmDialog', function() {
    return {
        restrict: 'E',
        template: '<div class="modal fade" tabindex="-1" ng-if="show">' +
                  '<div class="modal-dialog">' +
                  '<div class="modal-content">' +
                  '<div class="modal-header">' +
                  '<h5 class="modal-title">{{title || "Xác nhận"}}</h5>' +
                  '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
                  '</div>' +
                  '<div class="modal-body">' +
                  '<p>{{message || "Bạn có chắc chắn muốn thực hiện hành động này?"}}</p>' +
                  '</div>' +
                  '<div class="modal-footer">' +
                  '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>' +
                  '<button type="button" class="btn btn-danger" ng-click="confirm()">Xác nhận</button>' +
                  '</div>' +
                  '</div>' +
                  '</div>' +
                  '</div>',
        scope: {
            show: '=',
            title: '@',
            message: '@',
            onConfirm: '&'
        },
        link: function(scope, element) {
            var modalInstance = null;

            function openModal() {
                var modalEl = element[0].querySelector('.modal');
                if (!modalEl) return;
                modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                modalInstance.show();
                modalEl.addEventListener('hidden.bs.modal', function() {
                    scope.$applyAsync(function(){ scope.show = false; });
                }, { once: true });
            }

            function closeModal() {
                if (modalInstance) {
                    modalInstance.hide();
                }
            }

            scope.$watch('show', function(val) {
                if (val) {
                    // Wait next tick for DOM render
                    setTimeout(openModal, 0);
                } else {
                    closeModal();
                }
            });

            scope.confirm = function() {
                scope.onConfirm();
                scope.show = false;
                closeModal();
            };
        }
    };
});

// Directive cho currency input
app.directive('currencyInput', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            element.on('blur', function() {
                var value = ngModel.$viewValue;
                if (value && !isNaN(value)) {
                    ngModel.$setViewValue(parseFloat(value).toFixed(2));
                    ngModel.$render();
                }
            });
        }
    };
});

// Directive cho number input
app.directive('numberInput', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            element.on('keypress', function(event) {
                var char = String.fromCharCode(event.which);
                if (!/[0-9]/.test(char)) {
                    event.preventDefault();
                }
            });
        }
    };
});

// Directive cho auto-resize textarea
app.directive('autoResize', function() {
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.on('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        }
    };
});
