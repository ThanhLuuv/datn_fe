// Check myApp module exists (sanity check)
(function () {
    function check() {
        if (!window.angular) { 
            console.error('⛔ AngularJS chưa tải'); 
            return; 
        }
        try {
            angular.module('myApp');
            console.log('✅ myApp FOUND (đã load sau AngularJS)');
        } catch (e) {
            console.error('⛔ myApp NOT FOUND. Kiểm tra app.js', e);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', check);
    } else { 
        check(); 
    }
})();
