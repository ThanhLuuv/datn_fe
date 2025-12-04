// Orders Text-to-SQL AI Chatbot Controller - độc lập, chỉ dùng cho trang admin-orders
app.controller('OrdersTextToSqlAiController', [
    '$scope',
    'BookstoreService',
    '$sce',
    function($scope, BookstoreService, $sce) {
        $scope.aiChatOpen = false;
        $scope.sqlAi = {
            question: '',
            history: [],
            loading: false,
            error: null
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

        $scope.renderSqlAiAnswerText = function(text) {
            if (!text) {
                return $sce.trustAsHtml('<em>Chưa có câu trả lời</em>');
            }

            var html = String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Headings: "### Tiêu đề" -> block strong (như heading nhỏ)
            html = html.replace(/^###\s*(.+)$/gm, '<strong style="display:block;margin:0.35rem 0 0.15rem;">$1</strong>');

            // Bold **text**
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            // Line breaks
            html = html.replace(/\n/g, '<br>');

            return $sce.trustAsHtml(html);
        };

        $scope.handleAiChatSubmit = function(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            $scope.runSqlAi();
            return false;
        };

        // Build recent messages context (3-5 message gần nhất) để gửi lên backend
        function buildRecentMessages(questionText) {
            var history = $scope.sqlAi.history || [];
            var msgs = [];

            // Lấy tối đa 2 phiên gần nhất (mỗi phiên có question/answer) -> khoảng 3–4 message
            var maxPairs = 2;
            var start = Math.max(0, history.length - maxPairs);
            for (var i = start; i < history.length; i++) {
                var h = history[i];
                if (!h) continue;
                if (h.question) {
                    msgs.push({ role: 'user', content: String(h.question) });
                }
                if (h.answer) {
                    msgs.push({ role: 'assistant', content: String(h.answer) });
                }
            }

            // Thêm câu hỏi hiện tại vào cuối context
            if (questionText) {
                msgs.push({ role: 'user', content: String(questionText) });
            }

            // Chỉ giữ tối đa 5 message gần nhất
            var maxMessages = 5;
            if (msgs.length > maxMessages) {
                msgs = msgs.slice(msgs.length - maxMessages);
            }

            return msgs;
        }

        $scope.runSqlAi = function() {
            var question = ($scope.sqlAi.question || '').trim();
            if (!question || $scope.sqlAi.loading) {
                return;
            }

            if (!$scope.aiChatOpen) {
                $scope.aiChatOpen = true;
            }

            var questionToSave = question;
            $scope.sqlAi.question = '';

            var messageItem = {
                question: questionToSave,
                answer: '',
                sqlQuery: '',
                dataPreview: '',
                ts: new Date().toISOString(),
                loading: true
            };
            $scope.sqlAi.history.push(messageItem);
            if ($scope.sqlAi.history.length > 20) {
                $scope.sqlAi.history = $scope.sqlAi.history.slice(-20);
            }
            $scope.scrollChatToBottom();

            $scope.sqlAi.loading = true;
            $scope.sqlAi.error = null;

            var recentMessages = buildRecentMessages(questionToSave);

            BookstoreService.aiTextToSql({
                question: questionToSave,
                maxRows: 50,
                recentMessages: recentMessages
            })
                .then(function(res) {
                    var data = res && res.data && res.data.data;
                    if (!data) {
                        throw new Error((res && res.data && res.data.message) || 'AI không trả về dữ liệu');
                    }

                    messageItem.answer = data.answer || '';
                    messageItem.sqlQuery = data.sqlQuery || '';
                    messageItem.dataPreview = data.dataPreview || '';
                    messageItem.loading = false;

                    $scope.scrollChatToBottom();
                })
                .catch(function(err) {
                    console.error('AI text-to-sql failed', err);
                    var message =
                        (err && err.data && err.data.message) ||
                        err.message ||
                        'Không thể gọi API AI Text-to-SQL.';

                    messageItem.answer = '❌ ' + message;
                    messageItem.loading = false;
                    $scope.sqlAi.error = message;
                    $scope.scrollChatToBottom();
                })
                .finally(function() {
                    $scope.sqlAi.loading = false;
                    try { $scope.$applyAsync(); } catch (e) {}
                });
        };
    }
]);


