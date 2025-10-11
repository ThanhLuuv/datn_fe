// Custom jQuery and JavaScript
(function () {
    function start() {
        if (!window.jQuery) {
            console.error('jQuery not loaded');
            return;
        }
        
        // dùng $ an toàn ở đây
        $(document).ready(function() {
        // Initialize tooltips and popovers
        initializeTooltips();
        initializePopovers();

        // Smooth scrolling for anchor links
        $('a[href*="#"]').on('click', function(e) {
            var hash = this.hash;
            // Skip AngularJS hash routes and only prevent default for internal page anchors
        if (hash && hash.indexOf('#!/') === -1 && hash.length > 1) {
            e.preventDefault();
            var target = $(hash);
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 70
                }, 1000);
            }
        }
    });

    // Back to top button
    var backToTop = $('<button class="btn btn-primary position-fixed" style="bottom: 20px; right: 20px; z-index: 1000; display: none;" id="backToTop"><i class="bi bi-arrow-up"></i></button>');
    $('body').append(backToTop);

    $(window).scroll(function() {
        if ($(this).scrollTop() > 100) {
            $('#backToTop').fadeIn();
        } else {
            $('#backToTop').fadeOut();
        }
    });

    $('#backToTop').click(function() {
        $('html, body').animate({scrollTop: 0}, 1000);
    });

    // Form validation
    $('form').on('submit', function(e) {
        var form = $(this);
        if (form[0].checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
        }
        form.addClass('was-validated');
    });

    // Auto-hide alerts
    $('.alert').each(function() {
        var alert = $(this);
        setTimeout(function() {
            alert.alert('close');
        }, 5000);
    });
});

// Initialize tooltips function
function initializeTooltips() {
    // Destroy existing tooltips first
    var existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    existingTooltips.forEach(function(element) {
        var tooltip = bootstrap.Tooltip.getInstance(element);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Initialize new tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true,
            trigger: 'hover focus'
        });
    });
}

// Initialize popovers function
function initializePopovers() {
    // Destroy existing popovers first
    var existingPopovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    existingPopovers.forEach(function(element) {
        var popover = bootstrap.Popover.getInstance(element);
        if (popover) {
            popover.dispose();
        }
    });
    
    // Initialize new popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Global functions
window.showNotification = function(message, type = 'info') {
    var alertClass = 'alert-' + type;
    var alertHtml = '<div class="alert ' + alertClass + ' alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;">' +
                   message +
                   '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
                   '</div>';
    $('body').append(alertHtml);
    
    setTimeout(function() {
        $('.alert').last().alert('close');
    }, 3000);
};

    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
