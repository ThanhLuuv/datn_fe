// AI Chat Widget Controller - Floating chat widget for admin (chỉ ở trang đơn hàng)
app.controller('AiChatWidgetController', ['$scope', 'AuthService', '$sce', 'BookstoreService', '$location', function($scope, AuthService, $sce, BookstoreService, $location) {
    $scope.aiChatOpen = false;
    $scope.aiSearch = {
        question: '',
        answer: '',
        history: [],
        loading: false,
        indexing: false,
        error: null,
        lastIndexedAt: null
    };

    // Chỉ hiển thị chat widget ở trang đơn hàng admin
    $scope.shouldShowChat = function() {
        var isAdmin = AuthService.isAdminOrTeacher();
        if (!isAdmin) {
            return false;
        }
        
        // Check nhiều cách để đảm bảo detect được route
        var path = $location.path() || '';
        var hash = window.location.hash || '';
        var url = window.location.href || '';
        var absUrl = window.location.pathname || '';
        
        // Normalize
        var checkStr = (path + ' ' + hash + ' ' + url + ' ' + absUrl).toLowerCase();
        
        // Check xem có chứa 'admin/orders' không
        var isOrdersPage = checkStr.indexOf('admin/orders') !== -1;
        
        // Debug log
        console.log('AI Chat Widget Check:', {
            path: path,
            hash: hash,
            url: url,
            absUrl: absUrl,
            isAdmin: isAdmin,
            isOrdersPage: isOrdersPage,
            shouldShow: isAdmin && isOrdersPage
        });
        
        return isAdmin && isOrdersPage;
    };
    
    // Initialize và watch changes
    $scope.$on('$routeChangeSuccess', function() {
        $scope.$applyAsync(function() {
            // Force update
        });
    });
    
    // Watch location
    $scope.$watch(function() {
        return $location.path();
    }, function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.$applyAsync();
        }
    });
    
    // Watch hash
    $scope.$watch(function() {
        return window.location.hash;
    }, function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.$applyAsync();
        }
    });

    $scope.toggleAiChat = function() {
        $scope.aiChatOpen = !$scope.aiChatOpen;
        if ($scope.aiChatOpen) {
            setTimeout(function() {
                $scope.scrollChatToBottom();
            }, 100);
        }
    };

    $scope.scrollChatToBottom = function() {
        setTimeout(function() {
            var messagesEl = document.getElementById('aiChatMessages');
            if (messagesEl) {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        }, 50);
    };

    $scope.renderAiSearchAnswerText = function(text) {
        if (!text) {
            return $sce.trustAsHtml('<em>Chưa có câu trả lời</em>');
        }
        
        // Escape HTML trước
        var html = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Format markdown - thứ tự quan trọng!
        // 1. Bold: **text** -> <strong>text</strong> (xử lý trước để không conflict)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // 2. Bullet points: - item hoặc • item -> <li>item</li>
        var lines = html.split('\n');
        var inList = false;
        var result = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            
            // Check if line is a bullet point
            var bulletMatch = trimmed.match(/^[-•]\s+(.+)$/);
            var numberMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            
            if (bulletMatch || numberMatch) {
                var content = bulletMatch ? bulletMatch[1] : numberMatch[1];
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                result.push('<li>' + content + '</li>');
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                if (trimmed) {
                    result.push(line);
                } else {
                    result.push('<br>');
                }
            }
        }
        
        if (inList) {
            result.push('</ul>');
        }
        
        html = result.join('\n');
        
        // 3. Line breaks (sau khi đã xử lý lists)
        html = html.replace(/\n/g, '<br>');
        
        // Clean up: remove empty <ul></ul>
        html = html.replace(/<ul>\s*<\/ul>/g, '');
        
        return $sce.trustAsHtml(html);
    };

    $scope.handleAiChatSubmit = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        $scope.runAiSearch();
        $scope.scrollChatToBottom();
        return false;
    };

    $scope.runAiSearch = function() {
        var question = ($scope.aiSearch.question || '').trim();
        if (!question) {
            return;
        }
        
        // Mở chat nếu chưa mở
        if (!$scope.aiChatOpen) {
            $scope.aiChatOpen = true;
        }
        
        // Lưu question và clear input ngay lập tức
        var questionToSave = question;
        $scope.aiSearch.question = '';
        
        // Thêm question vào history ngay lập tức (với answer rỗng, sẽ update sau)
        var messageItem = {
            question: questionToSave,
            answer: '', // Sẽ update khi có kết quả
            ts: new Date().toISOString(),
            loading: true // Flag để hiển thị loading
        };
        $scope.aiSearch.history.push(messageItem);
        if ($scope.aiSearch.history.length > 20) {
            // Giữ 20 tin mới nhất (xóa tin cũ nhất)
            $scope.aiSearch.history = $scope.aiSearch.history.slice(-20);
        }
        
        // Scroll xuống để thấy message mới
        $scope.scrollChatToBottom();
        
        // Gọi API
        var payload = {
            query: questionToSave,
            topK: 5,
            language: 'vi',
            refTypes: null,
            includeDebug: false
        };
        $scope.aiSearch.loading = true;
        $scope.aiSearch.error = null;
        
        BookstoreService.adminAiSearch(payload)
            .then(function(res){
                var data = res && res.data && res.data.data;
                if (!data) {
                    throw new Error((res && res.data && res.data.message) || 'AI không trả về dữ liệu');
                }
                
                // Update answer cho message vừa thêm
                messageItem.answer = data.answer || '';
                messageItem.loading = false;
                $scope.aiSearch.answer = data.answer || '';
                
                $scope.scrollChatToBottom();
            })
            .catch(function(err){
                console.error('AI search failed', err);
                var message = (err && err.data && err.data.message) || err.message || 'Không thể chạy AI search.';
                
                // Update message với error
                messageItem.answer = '❌ ' + message;
                messageItem.loading = false;
                $scope.aiSearch.error = message;
                
                $scope.scrollChatToBottom();
            })
            .finally(function(){
                $scope.aiSearch.loading = false;
                $scope.$applyAsync();
            });
    };

    $scope.reindexAiSearch = function() {
        // Chỉ index order, order_line, invoice, book, customer
        var payload = {
            refTypes: ['order', 'order_line', 'invoice', 'book', 'customer'],
            truncateBeforeInsert: true,
            maxBooks: 1000,      // Tăng để có đủ context về sách
            maxCustomers: 500,   // Tăng để có đủ context về khách hàng
            maxOrders: 1000,     // Tăng để có nhiều đơn hàng hơn
            historyDays: 180
        };
        $scope.aiSearch.indexing = true;
        BookstoreService.adminAiReindexSearch(payload)
            .then(function(res){
                var data = res && res.data && res.data.data;
                var indexed = data ? Number(data.indexedDocuments || 0) : 0;
                $scope.aiSearch.lastIndexedAt = data && data.indexedAt ? data.indexedAt : new Date().toISOString();
            })
            .catch(function(err){
                console.error('AI reindex failed', err);
            })
            .finally(function(){
                $scope.aiSearch.indexing = false;
                $scope.$applyAsync();
            });
    };
}]);

