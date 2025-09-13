// Custom Filters
app.filter('capitalize', function() {
    return function(input) {
        if (input && typeof input === 'string') {
            return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
        }
        return input;
    };
});

app.filter('truncate', function() {
    return function(input, length) {
        if (input && input.length > length) {
            return input.substring(0, length) + '...';
        }
        return input;
    };
});

app.filter('formatDate', function() {
    return function(input) {
        if (input) {
            var date = new Date(input);
            return date.toLocaleDateString('vi-VN');
        }
        return input;
    };
});

app.filter('highlight', function() {
    return function(input, search) {
        if (!search) return input;
        var regex = new RegExp('(' + search + ')', 'gi');
        return input.replace(regex, '<mark>$1</mark>');
    };
});
