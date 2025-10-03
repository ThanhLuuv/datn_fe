// Custom Directives
app.directive('alertMessage', function() {
    return {
        restrict: 'E',
        template: '<div class="alert alert-{{type}} alert-dismissible fade show" ng-show="show">' +
                  '{{message}}' +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                  '</div>',
        scope: {
            message: '=',
            type: '=',
            show: '='
        }
    };
});

app.directive('cardComponent', function() {
    return {
        restrict: 'E',
        templateUrl: 'app/components/card.html',
        scope: {
            title: '=',
            content: '=',
            icon: '=',
            buttonText: '=',
            onButtonClick: '&'
        }
    };
});

// Async validator: unique ISBN
app.directive('uniqueIsbn', ['BookstoreService', '$q', function(BookstoreService, $q) {
    return {
        require: 'ngModel',
        scope: {
            // Pass original ISBN when editing so same value is allowed
            originalIsbn: '='
        },
        link: function(scope, element, attrs, ngModel) {
            ngModel.$asyncValidators.uniqueIsbn = function(modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (!value) {
                    return $q.when();
                }
                var normalized = String(value).trim();
                var original = String(scope.originalIsbn || '').trim();
                if (original && normalized === original) {
                    // Unchanged in edit mode -> valid
                    return $q.when();
                }
                // Check existence: if book exists -> reject (duplicate), if 404 -> resolve
                return BookstoreService.getBookByIsbn(encodeURIComponent(normalized))
                    .then(function success() {
                        // Exists -> duplicate
                        return $q.reject('duplicate');
                    })
                    .catch(function(err) {
                        if (err && (err.status === 404 || err.status === 400)) {
                            // Not found -> unique
                            return true;
                        }
                        // On other errors, do not block user
                        return true;
                    });
            };
        }
    };
}]);

// File validation directive
app.directive('fileValidation', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$validators.fileSize = function(modelValue, viewValue) {
                var file = modelValue || viewValue;
                if (!file) return true;
                return file.size <= 5 * 1024 * 1024; // 5MB
            };
            
            ngModel.$validators.fileType = function(modelValue, viewValue) {
                var file = modelValue || viewValue;
                if (!file) return true;
                var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                return allowedTypes.indexOf(file.type) !== -1;
            };
        }
    };
});
