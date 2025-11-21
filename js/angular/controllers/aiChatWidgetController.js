// AI Chat Widget Controller - Floating chat widget for admin
app.controller('AiChatWidgetController', ['$scope', 'AuthService', '$sce', 'BookstoreService', function($scope, AuthService, $sce, BookstoreService) {
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

    $scope.isAdminOrTeacher = function() {
        return AuthService.isAdminOrTeacher();
    };

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
        var html = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n/g, '<br>');
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
        
        var payload = {
            query: question,
            topK: 5,
            language: 'vi',
            refTypes: null,
            includeDebug: false
        };
        $scope.aiSearch.loading = true;
        $scope.aiSearch.error = null;
        var questionToSave = question;
        $scope.aiSearch.question = '';
        
        BookstoreService.adminAiSearch(payload)
            .then(function(res){
                var data = res && res.data && res.data.data;
                if (!data) {
                    throw new Error((res && res.data && res.data.message) || 'AI không trả về dữ liệu');
                }
                $scope.aiSearch.answer = data.answer || '';
                $scope.aiSearch.history.unshift({
                    question: questionToSave,
                    answer: data.answer || '',
                    ts: new Date().toISOString()
                });
                if ($scope.aiSearch.history.length > 20) {
                    $scope.aiSearch.history = $scope.aiSearch.history.slice(0, 20);
                }
                $scope.scrollChatToBottom();
            })
            .catch(function(err){
                console.error('AI search failed', err);
                var message = (err && err.data && err.data.message) || err.message || 'Không thể chạy AI search.';
                $scope.aiSearch.error = message;
                $scope.scrollChatToBottom();
            })
            .finally(function(){
                $scope.aiSearch.loading = false;
                $scope.$applyAsync();
            });
    };

    $scope.reindexAiSearch = function() {
        var payload = {
            refTypes: null,
            truncateBeforeInsert: true,
            maxBooks: 800,
            maxCustomers: 300,
            maxOrders: 400,
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

