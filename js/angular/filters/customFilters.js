// Custom Filters
console.log('Loading Custom Filters...');

// Ensure app module exists
var app = angular.module('myApp');

app.filter('formatDate', function() {
    return function(input) {
        if (input) {
            var date = new Date(input);
            return date.toLocaleDateString('vi-VN');
        }
        return input;
    };
});
