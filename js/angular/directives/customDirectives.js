// Custom Directives
app.directive('loadingSpinner', function() {
    return {
        restrict: 'E',
        template: '<div class="text-center" ng-show="loading">' +
                  '<div class="spinner-border text-primary" role="status">' +
                  '<span class="visually-hidden">Đang tải...</span>' +
                  '</div>' +
                  '</div>',
        scope: {
            loading: '='
        }
    };
});

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
