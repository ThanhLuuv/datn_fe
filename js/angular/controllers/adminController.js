// Admin Controller
app.controller('AdminController', ['$scope', 'AuthService', 'APP_CONFIG', '$location', '$rootScope', 'BookstoreService', function($scope, AuthService, APP_CONFIG, $location, $rootScope, BookstoreService) {
    // Check if user has admin or teacher access
    if (!AuthService.isAdminOrTeacher()) {
        console.log('Access denied: User does not have admin or teacher role');
        $location.path('/home');
        return;
    }

    $scope.title = 'Admin Dashboard';
    $scope.isEmployeesPage = ($location.path() === '/admin/employees');
    $rootScope.$on('$routeChangeSuccess', function(){
        $scope.isEmployeesPage = ($location.path() === '/admin/employees');
    });
    $scope.isDeliveryOnly = AuthService.isDeliveryEmployee() && !AuthService.isAdmin();
    $scope.stats = {
        totalUsers: 0,
        totalBooks: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        newUsers: 0,
        soldBooks: 0
    };
    
    $scope.recentActivities = [];
    $scope.latestBooks = [];
    $scope.toasts = [];
    $scope.addToast = function(variant, message) {
        var id = Date.now() + Math.random();
        $scope.toasts.push({ id: id, variant: variant, message: message });
        setTimeout(function(){
            $scope.$applyAsync(function(){
                $scope.toasts = $scope.toasts.filter(function(t){ return t.id !== id; });
            });
        }, 3000);
    };

    function formatYMD(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    }

    function sumRevenueFromReportPayload(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var sum = 0;
        for (var i = 0; i < items.length; i++) {
            var val = Number(items[i].revenue || items[i].totalRevenue || 0);
            if (!isNaN(val)) sum += val;
        }
        return sum;
    }

    function toIsoDateTime(value) {
        if (!value) return null;
        try {
            if (value instanceof Date) {
                return new Date(value.getTime()).toISOString();
            }
            var parsed = new Date(value);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
        } catch (e) {
            console.warn('toIsoDateTime failed', e);
        }
        return null;
    }

    // Bổ sung biến và hàm cho dashboard báo cáo
    $scope.revenueFilter = { type:'monthly', fromDate:'', toDate:'' };
    $scope.inventoryFilter = { toDate:'' };
    $scope.profitFilter = { fromDate:'', toDate:'' };
    $scope.loadingRevenue = false;
    $scope.loadingInventory = false;
    $scope.revenueChart = null;
    $scope.inventoryChart = null;
    $scope.categoryShare = { total: 0, items: [] };
    $scope.categoryPie = { gradient: '', items: [] };
    $scope.profitReportData = null;
    $scope.revenueReportData = null;
    $scope.inventoryReportData = null;
    $scope.revenueReportTotal = 0;
    $scope.inventoryReportTotal = 0;
    $scope.revenueSummary = null;
    $scope.inventorySummary = null;
    $scope.profitSummary = null;
    $scope.currentUser = AuthService.getCurrentUser ? (AuthService.getCurrentUser()||{}) : {};
    $scope.now = new Date();
    // modal flags for custom dashboard modals
    $scope.showingDashboardReport = false;
    $scope.showingDashboardInventory = false;
    $scope.showingDashboardProfit = false;

    // AI assistant state
    $scope.aiAssistantLoading = false;
    $scope.aiAssistantError = null;
    $scope.aiAssistant = {
        overview: '',
        recommendedCategories: [],
        bookSuggestions: [],
        customerFeedbackSummary: ''
    };

    // Live AI chat widget state
    $scope.aiChatOpen = false;
    $scope.aiChatInput = '';
    $scope.aiChatLoadingLive = false;
    $scope.aiChatMessages = [];
    $scope.aiChatMetadata = {
        sources: [],
        lastUpdated: null
    };

    $scope.aiVoice = {
        supported: !!(navigator.mediaDevices && window.MediaRecorder),
        status: 'idle',
        error: null
    };
    var mediaRecorder = null;
    var voiceStream = null;
    var recordedChunks = [];
    var voicePlayer = null;

    $scope.aiImportModal = {
        visible: false,
        form: {},
        submitting: false,
        suggestion: null
    };

    function scrollAiChatToBottom() {
        setTimeout(function() {
            try {
                var body = document.querySelector('.ai-chat-panel .ai-chat-body');
                if (body) {
                    body.scrollTop = body.scrollHeight;
                }
            } catch (e) { /* ignore */ }
        }, 30);
    }

    function buildChatPayloadMessages(messages) {
        return (messages || [])
            .map(function(m) {
                var normalizedRole = (m.role || 'user').toLowerCase() === 'assistant' ? 'assistant' : 'user';
                return {
                    role: normalizedRole,
                    content: (m.text || m.content || '').trim()
                };
            })
            .filter(function(m) { return m.content.length > 0; });
    }

    function setAiVoiceStatus(status, errorMessage) {
        $scope.aiVoice.status = status;
        $scope.aiVoice.error = errorMessage || null;
    }

    function cleanupRecording() {
        if (mediaRecorder) {
            try {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            } catch (e) {}
            mediaRecorder.ondataavailable = null;
            mediaRecorder.onstop = null;
            mediaRecorder = null;
        }
        if (voiceStream) {
            try {
                voiceStream.getTracks().forEach(function(track) { track.stop(); });
            } catch (err) {}
            voiceStream = null;
        }
        recordedChunks = [];
    }

    function stopVoicePlayback() {
        if (voicePlayer) {
            try { voicePlayer.pause(); } catch (e) {}
            voicePlayer = null;
        }
    }

    function updateVoiceDraft(role, text, isFinal) {
        if (!text) {
            return;
        }
        $scope.$applyAsync(function() {
            var normalizedRole = role === 'assistant' ? 'assistant' : 'user';
            if (!isFinal) {
                voiceDrafts[normalizedRole] = text;
                var draftIndex = $scope.aiChatMessages.findIndex(function(m) { return m._voiceDraft && m._voiceRole === normalizedRole; });
                if (draftIndex >= 0) {
                    $scope.aiChatMessages[draftIndex].text = text;
                } else {
                    $scope.aiChatMessages.push({
                        role: normalizedRole,
                        text: text,
                        _voiceDraft: true,
                        _voiceRole: normalizedRole
                    });
                }
            } else {
                var idx = $scope.aiChatMessages.findIndex(function(m) { return m._voiceDraft && m._voiceRole === normalizedRole; });
                if (idx >= 0) {
                    $scope.aiChatMessages[idx].text = text;
                    delete $scope.aiChatMessages[idx]._voiceDraft;
                    delete $scope.aiChatMessages[idx]._voiceRole;
                } else {
                    $scope.aiChatMessages.push({
                        role: normalizedRole,
                        text: text
                    });
                }
                voiceDrafts[normalizedRole] = null;
            }
            scrollAiChatToBottom();
        });
    }

    function getVoiceSystemPrompt() {
        return [
            'Bạn là trợ lý AI realtime cho quản trị viên BookStore.',
            'Trả lời bằng tiếng Việt tự nhiên, giọng thân thiện, súc tích.',
            'Nếu người dùng hỏi về số liệu, hãy nhắc họ có thể mở báo cáo để xem chi tiết.',
            'Luôn xác nhận hành động quan trọng và gợi ý bước tiếp theo.'
        ].join('\n');
    }

    async function startVoiceSession() {
        if (!$scope.aiVoice.supported) {
            $scope.addToast('danger', 'Trình duyệt không hỗ trợ voice chat.');
            return;
        }
        var apiKey = (GOOGLE_AI_CONFIG && GOOGLE_AI_CONFIG.API_KEY) || APP_CONFIG.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            $scope.addToast('danger', 'Chưa cấu hình GOOGLE_AI.API_KEY trong env/*.js để dùng voice.');
            return;
        }
        if (aiVoiceSession.sessionPromise) {
            return;
        }
        setAiVoiceStatus('connecting');
        try {
            var module = await ensureGoogleGenAiModule();
            var GoogleGenAI = module.GoogleGenAI;
            var Modality = module.Modality;
            aiVoiceSession.SpeakerEnum = module.Speaker;
            var ai = new GoogleGenAI({ apiKey: apiKey });
            var modelName = (GOOGLE_AI_CONFIG && GOOGLE_AI_CONFIG.MODEL) || 'gemini-2.5-flash-native-audio-preview-09-2025';
            var voiceName = (GOOGLE_AI_CONFIG && GOOGLE_AI_CONFIG.VOICE_NAME) || 'Zephyr';

            aiVoiceSession.sessionPromise = ai.live.connect({
                model: modelName,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
                    },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: getVoiceSystemPrompt()
                },
                callbacks: {
                    onopen: async function() {
                        try {
                            var AudioContextImpl = window.AudioContext || window.webkitAudioContext;
                            aiVoiceSession.inputAudioContext = new AudioContextImpl({ sampleRate: 16000 });
                            aiVoiceSession.outputAudioContext = new AudioContextImpl({ sampleRate: 24000 });

                            aiVoiceSession.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            var source = aiVoiceSession.inputAudioContext.createMediaStreamSource(aiVoiceSession.stream);
                            aiVoiceSession.scriptProcessor = aiVoiceSession.inputAudioContext.createScriptProcessor(4096, 1, 1);

                            aiVoiceSession.scriptProcessor.onaudioprocess = function(event) {
                                var inputData = event.inputBuffer.getChannelData(0);
                                var int16 = new Int16Array(inputData.length);
                                for (var i = 0; i < inputData.length; i++) {
                                    var s = Math.max(-1, Math.min(1, inputData[i]));
                                    int16[i] = s * 32767;
                                }
                                var pcmBlob = {
                                    data: encodePcm(int16),
                                    mimeType: 'audio/pcm;rate=16000'
                                };
                                aiVoiceSession.sessionPromise && aiVoiceSession.sessionPromise.then(function(session) {
                                    if (session && typeof session.sendRealtimeInput === 'function') {
                                        session.sendRealtimeInput({ media: pcmBlob });
                                    }
                                });
                            };

                            source.connect(aiVoiceSession.scriptProcessor);
                            aiVoiceSession.scriptProcessor.connect(aiVoiceSession.inputAudioContext.destination);
                            setAiVoiceStatus('listening');
                            $scope.$applyAsync();
                        } catch (micErr) {
                            console.error('Voice mic error', micErr);
                            cleanupVoiceSession('error');
                            $scope.addToast('danger', 'Không truy cập được micro: ' + (micErr && micErr.message ? micErr.message : 'Unknown error'));
                        }
                    },
                    onmessage: async function(message) {
                        var speakerEnum = aiVoiceSession.SpeakerEnum || {};
                        try {
                            var inputTrans = message.serverContent && message.serverContent.inputTranscription;
                            if (inputTrans && inputTrans.text) {
                                updateVoiceDraft('user', inputTrans.text, inputTrans.isFinal);
                            }
                            var outputTrans = message.serverContent && message.serverContent.outputTranscription;
                            if (outputTrans && outputTrans.text) {
                                updateVoiceDraft('assistant', outputTrans.text, outputTrans.isFinal);
                                if (outputTrans.isFinal) {
                                    setAiVoiceStatus('speaking');
                                }
                            }
                            if (message.serverContent && message.serverContent.turnComplete) {
                                voiceDrafts.user = null;
                                voiceDrafts.assistant = null;
                                setAiVoiceStatus('listening');
                            }
                            var audioData = message.serverContent &&
                                message.serverContent.modelTurn &&
                                message.serverContent.modelTurn.parts &&
                                message.serverContent.modelTurn.parts[0] &&
                                message.serverContent.modelTurn.parts[0].inlineData &&
                                message.serverContent.modelTurn.parts[0].inlineData.data;
                            if (audioData && aiVoiceSession.outputAudioContext) {
                                aiVoiceSession.nextStartTime = Math.max(aiVoiceSession.nextStartTime, aiVoiceSession.outputAudioContext.currentTime);
                                var audioBuffer = await decodeOutputAudio(decodeBase64(audioData), aiVoiceSession.outputAudioContext, 24000, 1);
                                var playbackSource = aiVoiceSession.outputAudioContext.createBufferSource();
                                playbackSource.buffer = audioBuffer;
                                playbackSource.connect(aiVoiceSession.outputAudioContext.destination);
                                playbackSource.addEventListener('ended', function() {
                                    aiVoiceSession.sources.delete(playbackSource);
                                    if (aiVoiceSession.sources.size === 0 && $scope.aiVoice.status === 'speaking') {
                                        setAiVoiceStatus('listening');
                                        $scope.$applyAsync();
                                    }
                                });
                                playbackSource.start(aiVoiceSession.nextStartTime);
                                aiVoiceSession.nextStartTime += audioBuffer.duration;
                                aiVoiceSession.sources.add(playbackSource);
                                setAiVoiceStatus('speaking');
                                $scope.$applyAsync();
                            }
                            if (message.serverContent && message.serverContent.interrupted) {
                                aiVoiceSession.sources.forEach(function(source) {
                                    try { source.stop(); } catch (e) {}
                                });
                                aiVoiceSession.sources.clear();
                                aiVoiceSession.nextStartTime = 0;
                            }
                        } catch (msgErr) {
                            console.error('Voice onmessage error', msgErr);
                        }
                    },
                    onerror: function(err) {
                        console.error('Voice session error', err);
                        cleanupVoiceSession('error');
                        $scope.$applyAsync(function() {
                            $scope.addToast('danger', 'Voice AI lỗi: ' + (err && err.message ? err.message : 'Unknown error'));
                        });
                    },
                    onclose: function() {
                        cleanupVoiceSession('idle');
                        $scope.$applyAsync();
                    }
                }
            });
            aiVoiceSession.sessionPromise.then(function(session) {
                aiVoiceSession.session = session;
                return session;
            });
        } catch (err) {
            console.error('Voice session init error', err);
            cleanupVoiceSession('error');
            $scope.addToast('danger', 'Không thể khởi tạo phiên voice: ' + (err && err.message ? err.message : 'Unknown error'));
        }
    }

    function stopVoiceSession() {
        if (!aiVoiceSession.sessionPromise) {
            setAiVoiceStatus('idle');
            return;
        }
        aiVoiceSession.sessionPromise.then(function(session) {
            try {
                if (session && typeof session.close === 'function') {
                    session.close();
                } else if (session && typeof session.end === 'function') {
                    session.end();
                }
            } catch (err) {
                console.warn('Voice session close err', err);
            }
        }).finally(function() {
            cleanupVoiceSession('idle');
            $scope.$applyAsync();
        });
    }

    $scope.toggleVoiceSession = function() {
        if ($scope.aiVoice.status === 'connecting' || $scope.aiVoice.status === 'listening' || $scope.aiVoice.status === 'speaking') {
            stopVoiceSession();
        } else {
            startVoiceSession();
        }
    };

    $scope.getVoiceStatusText = function() {
        switch ($scope.aiVoice.status) {
            case 'connecting': return 'Đang kết nối...';
            case 'listening': return 'Đang lắng nghe';
            case 'speaking': return 'Trợ lý đang trả lời';
            case 'error': return $scope.aiVoice.error || 'Lỗi voice';
            default: return 'Voice AI đang tắt';
        }
    };

    $scope.getVoiceIconClass = function() {
        if ($scope.aiVoice.status === 'speaking') return 'bi-volume-up';
        if ($scope.aiVoice.status === 'listening' || $scope.aiVoice.status === 'connecting') return 'bi-mic-fill';
        if ($scope.aiVoice.status === 'error') return 'bi-exclamation-triangle';
        return 'bi-mic';
    };

    function parsePriceToNumber(value) {
        if (value == null || value === '') return null;
        var cleaned = String(value).replace(/[^\d]/g, '');
        if (!cleaned) return null;
        var num = Number(cleaned);
        return isNaN(num) ? null : num;
    }

    function buildImportFormFromSuggestion(suggestion) {
        var now = new Date();
        suggestion = suggestion || {};
        var categoryId = suggestion.suggestedCategoryId ? Number(suggestion.suggestedCategoryId) : '';
        return {
            title: suggestion.title || '',
            isbn: suggestion.suggestedIsbn || '',
            categoryId: categoryId || '',
            categoryName: suggestion.category || '',
            publisherName: suggestion.publisherName || '',
            authorName: suggestion.authorName || '',
            pageCount: suggestion.pageCount || 220,
            publishYear: suggestion.publishYear || now.getFullYear(),
            suggestedPrice: suggestion.suggestedPrice || parsePriceToNumber(suggestion.marketPrice) || null,
            stock: suggestion.suggestedStock || 0,
            coverImageUrl: suggestion.coverImageUrl || '',
            description: suggestion.description || suggestion.reason || ''
        };
    }

    $scope.openAiImportModal = function(suggestion) {
        if (suggestion && suggestion.isbn) {
            $scope.addToast('warning', 'Sách này đã có trong hệ thống, không thể tạo mới.');
            return;
        }
        $scope.aiImportModal.suggestion = suggestion;
        $scope.aiImportModal.form = buildImportFormFromSuggestion(suggestion);
        $scope.aiImportModal.visible = true;
        $scope.aiImportModal.submitting = false;
    };

    $scope.closeAiImportModal = function() {
        $scope.aiImportModal.visible = false;
        $scope.aiImportModal.suggestion = null;
        $scope.aiImportModal.form = {};
        $scope.aiImportModal.submitting = false;
    };

    $scope.submitAiImport = function() {
        if ($scope.aiImportModal.submitting) return;
        var form = angular.copy($scope.aiImportModal.form || {});
        if (!form.title || !form.title.trim()) {
            $scope.addToast('danger', 'Tiêu đề sách không được để trống.');
            return;
        }

        form.categoryId = form.categoryId ? Number(form.categoryId) : null;
        form.pageCount = form.pageCount ? Number(form.pageCount) : null;
        form.publishYear = form.publishYear ? Number(form.publishYear) : null;
        form.suggestedPrice = form.suggestedPrice ? Number(form.suggestedPrice) : null;
        form.stock = form.stock ? Number(form.stock) : 0;

        $scope.aiImportModal.submitting = true;
        BookstoreService.adminAiImportBook(form)
            .then(function(res) {
                var book = res && res.data && res.data.data && res.data.data.book;
                if (book) {
                    $scope.addToast('success', 'Đã tạo sách ' + (book.title || '') + ' (ISBN: ' + (book.isbn || '') + ').');
                    if ($scope.aiImportModal.suggestion) {
                        $scope.aiImportModal.suggestion._importedIsbn = book.isbn;
                    }
                } else {
                    $scope.addToast('success', 'Đã tạo sách mới.');
                }
                $scope.closeAiImportModal();
            })
            .catch(function(err) {
                console.error('adminAiImportBook error', err);
                var message = (err && err.data && err.data.message) || 'Không thể tạo sách.';
                $scope.addToast('danger', message);
            })
            .finally(function() {
                $scope.aiImportModal.submitting = false;
            });
    };

    $scope.toggleAiChat = function($event) {
        if ($event) { $event.stopPropagation(); }
        $scope.aiChatOpen = !$scope.aiChatOpen;
        if ($scope.aiChatOpen) {
            scrollAiChatToBottom();
        }
    };

    $scope.handleAiChatKey = function($event) {
        if ($event.key === 'Enter' && !$event.shiftKey) {
            $event.preventDefault();
            $scope.sendAiChat();
        }
    };

    $scope.sendAiChat = function() {
        var text = ($scope.aiChatInput || '').trim();
        if (!text || $scope.aiChatLoadingLive) {
            return;
        }

        $scope.aiChatMessages.push({ role: 'user', text: text });
        $scope.aiChatInput = '';
        $scope.aiChatLoadingLive = true;
        scrollAiChatToBottom();

        var history = buildChatPayloadMessages($scope.aiChatMessages).slice(-12);
        var from = $scope.profitFilter.fromDate || $scope.revenueFilter.fromDate;
        var to = $scope.profitFilter.toDate || $scope.revenueFilter.toDate || new Date();
        var payload = {
            messages: history,
            fromDate: toIsoDateTime(from),
            toDate: toIsoDateTime(to),
            language: 'vi',
            includeInventorySnapshot: true,
            includeCategoryShare: true
        };

        BookstoreService.adminAiChat(payload)
            .then(function(res) {
                var data = res && res.data && res.data.data;
                if (data && Array.isArray(data.messages)) {
                    $scope.aiChatMessages = data.messages.map(function(m) {
                        return {
                            role: (m.role || 'assistant').toLowerCase(),
                            text: m.content || ''
                        };
                    });
                } else if (data && data.plainTextAnswer) {
                    $scope.aiChatMessages.push({
                        role: 'assistant',
                        text: data.plainTextAnswer
                    });
                }

                if (data && Array.isArray(data.dataSources)) {
                    $scope.aiChatMetadata.sources = data.dataSources;
                    $scope.aiChatMetadata.lastUpdated = new Date();
                }

                scrollAiChatToBottom();
            })
            .catch(function(err) {
                console.error('Admin AI chat error:', err);
                $scope.addToast('danger', 'Không thể gửi câu hỏi tới trợ lý AI.');
                $scope.aiChatMessages.push({
                    role: 'assistant',
                    text: 'Xin lỗi, tôi không thể truy cập dữ liệu ngay lúc này.'
                });
            })
            .finally(function() {
                $scope.aiChatLoadingLive = false;
                $scope.$applyAsync(scrollAiChatToBottom);
            });
    };

    // Resolve reporter display name robustly
    $scope.getReporterName = function(user) {
        var u = user || $scope.currentUser || {};
        var combined = (u.firstName && u.lastName) ? (u.firstName + ' ' + u.lastName) : (u.firstName || u.lastName);
        return (
            u.fullName || u.displayName || u.name || combined || u.email || u.username || '—'
        );
    };

    // Header label for revenue report table based on type
    $scope.getRevenueHeader = function() {
        var t = ($scope.revenueFilter && $scope.revenueFilter.type) ? String($scope.revenueFilter.type).toLowerCase() : 'daily';
        if (t === 'quarterly') return 'Quý/Năm';
        if (t === 'monthly') return 'Tháng/Năm';
        return 'Ngày';
    };

    // Convert number to Vietnamese words for currency display
    (function registerVietnameseMoneyHelper(){
      var DIGITS = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
      var SCALES = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ', ' tỷ tỷ'];

      function readBlock(number, isFirstBlock) {
        if (!number) return '';
        var hundred = Math.floor(number / 100);
        var ten = Math.floor((number % 100) / 10);
        var unit = number % 10;
        var parts = [];

        if (hundred !== 0) {
          parts.push(DIGITS[hundred] + ' trăm');
        } else if (!isFirstBlock && (ten !== 0 || unit !== 0)) {
          parts.push('không trăm');
        }

        if (ten > 1) {
          parts.push(DIGITS[ten] + ' mươi');
          if (unit === 1) parts.push('mốt');
          else if (unit === 4) parts.push('tư');
          else if (unit === 5) parts.push('lăm');
          else if (unit !== 0) parts.push(DIGITS[unit]);
        } else if (ten === 1) {
          parts.push('mười');
          if (unit === 1) parts.push('một');
          else if (unit === 4) parts.push('bốn');
          else if (unit === 5) parts.push('lăm');
          else if (unit !== 0) parts.push(DIGITS[unit]);
        } else if (unit !== 0) {
          if (hundred !== 0 || (!isFirstBlock && ten === 0)) {
            parts.push('linh');
          }
          if (unit === 5 && (hundred !== 0 || ten !== 0)) parts.push('năm');
          else parts.push(DIGITS[unit]);
        }

        return parts.join(' ').replace(/\s+/g, ' ').trim();
      }

      function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      }

      function numberToVietnameseCurrency(amount) {
        if (amount == null || amount === '') return '';
        var num = Number(amount);
        if (!isFinite(num)) return '';
        var negative = num < 0;
        var absolute = Math.round(Math.abs(num));
        if (absolute === 0) return 'Không đồng';

        var blocks = [];
        while (absolute > 0) {
          blocks.push(absolute % 1000);
          absolute = Math.floor(absolute / 1000);
        }

        var words = [];
        for (var i = blocks.length - 1; i >= 0; i--) {
          var blockWords = readBlock(blocks[i], i === blocks.length - 1);
          if (blockWords) {
            words.push(blockWords + SCALES[i]);
          } else if (i === 0 && words.length === 0) {
            words.push('không');
          }
        }

        var sentence = words.join(' ').replace(/\s+/g, ' ').trim();
        if (!sentence) sentence = 'không';
        var result = capitalize(sentence) + ' đồng';
        if (negative) result = 'Âm ' + result.charAt(0).toLowerCase() + result.slice(1);
        return result;
      }

      $scope.moneyInWords = function(amount) {
        return numberToVietnameseCurrency(amount);
      };
    })();

    // Helper: giữ chỉ 1 backdrop khi mở modal
    function ensureSingleBackdrop() {
      try {
        var backs = document.querySelectorAll('.modal-backdrop');
        if (backs && backs.length > 1) {
          // Giữ lại backdrop cuối (mới nhất)
          for (var i = 0; i < backs.length - 1; i++) {
            var el = backs[i];
            if (el && el.parentNode) el.parentNode.removeChild(el);
          }
        }
      } catch(e) { /* no-op */ }
    }

    // Xem báo cáo doanh thu
    $scope.viewRevenueReport = function(openModal) {
      $scope.loadingRevenue = true;
      $scope.revenueReportData = null;
      $scope.revenueChart = null;
      $scope.revenueReportTotal = 0;
      // Chuẩn hóa ngày
      var from = $scope.revenueFilter.fromDate;
      var to = $scope.revenueFilter.toDate;
      if (!from || !to) { $scope.loadingRevenue = false; $scope.addToast('danger','Vui lòng chọn đủ khoảng ngày!'); return; }
      var type = ($scope.revenueFilter.type || 'daily').toLowerCase();
      var apiPromise;
      // Helpers to avoid timezone shift and align to month boundaries
      function toYMDLocal(d){
        if (!(d instanceof Date)) d = new Date(d);
        var y = d.getFullYear();
        var m = ('0'+(d.getMonth()+1)).slice(-2);
        var day = ('0'+d.getDate()).slice(-2);
        return y + '-' + m + '-' + day;
      }
      function monthStart(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
      function monthEnd(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

      var fromObj = (from instanceof Date) ? new Date(from.getTime()) : new Date(from);
      var toObj = (to instanceof Date) ? new Date(to.getTime()) : new Date(to);
      if (type === 'monthly' || type === 'quarterly') {
        fromObj = monthStart(fromObj);
        toObj = monthEnd(toObj);
      }
      var fromStr = toYMDLocal(fromObj);
      var toStr = toYMDLocal(toObj);

      if (type === 'monthly') {
        apiPromise = BookstoreService.getRevenueReportMonthly({ fromDate: fromStr, toDate: toStr });
      } else if (type === 'quarterly') {
        apiPromise = BookstoreService.getRevenueReportQuarterly({ fromDate: fromStr, toDate: toStr });
      } else {
        apiPromise = BookstoreService.getRevenueReport({ fromDate: fromStr, toDate: toStr });
      }

      apiPromise.then(function(res){
        var data = res && res.data && res.data.data;
        // capture generatedBy if provided by API
        if (data && data.generatedBy) {
          $scope.reportGeneratedBy = data.generatedBy;
        } else {
          $scope.reportGeneratedBy = null;
        }
        // Mapping dữ liệu chart
        function buildRevenueLabel(it){
          if (it.label) return it.label;
          if (it.quarter != null && it.year != null) {
            return  String(it.quarter) + ' / ' + String(it.year);
          }
          if (it.month != null && it.year != null) {
            return String(it.month) + ' / ' + String(it.year);
          }
          if (it.monthYear) return it.monthYear; // e.g. '2025-10'
          if (it.day) {
            try { return toYMDLocal(new Date(it.day)); } catch(e) { return String(it.day); }
          }
          if (it.name) return it.name;
          return '';
        }
        var items = Array.isArray(data.items) ? data.items : data;
        $scope.revenueReportData = items.map(function(it){
          return { label: buildRevenueLabel(it), value: Number(it.revenue || it.totalRevenue || it.value || 0) };
        });
        $scope.revenueReportTotal = $scope.revenueReportData.reduce(function(a,b){return a+Number(b.value||0)},0);
        $scope.revenueSummary = {
          total: $scope.revenueReportTotal,
          count: ($scope.revenueReportData || []).length,
          fromDate: fromStr,
          toDate: toStr,
          type: $scope.revenueFilter.type
        };
        // (Nếu dùng Chart.js thực sẽ attach chart data ở đây)
        $scope.revenueChart = true;
        // Mở modal preview khi người dùng yêu cầu (custom modal)
        if (openModal) {
          $scope.showingDashboardInventory = false;
          $scope.showingDashboardProfit = false;
          $scope.showingDashboardReport = true;
        }
      }).catch(function(e){
        $scope.addToast('danger','Không thể tải báo cáo doanh thu');
      }).finally(function(){ $scope.loadingRevenue = false; $scope.$applyAsync(); });
    };

    // Xem báo cáo tồn kho
    $scope.viewInventoryReport = function(openModal) {
      $scope.loadingInventory = true;
      $scope.inventoryReportData = null;
      $scope.inventoryChart = null;
      $scope.inventoryReportTotal = 0;
      var to = $scope.inventoryFilter.toDate;
      if (!to) { $scope.loadingInventory = false; $scope.addToast('danger','Vui lòng chọn ngày!'); return; }
      // chuẩn hóa yyyy-MM-dd
      if (typeof to === 'string' && to.length > 10) to = to.slice(0,10);
      if (to instanceof Date) {
        var d = to; to = d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
      }
      BookstoreService.getInventoryReport(to).then(function(res){
        var data = res && res.data && res.data.data;
        if (data && data.generatedBy) {
          $scope.reportGeneratedByInventory = data.generatedBy;
        } else {
          $scope.reportGeneratedByInventory = null;
        }
        var items = Array.isArray(data && data.items) ? data.items : [];
        $scope.inventoryReportData = items.map(function(it){
          var qty = Number(it.quantityOnHand != null ? it.quantityOnHand : (it.quantity || it.stock || 0));
          var price = Number(it.averagePrice != null ? it.averagePrice : (it.unitPrice || 0));
          var value = qty * price;
          return {
            isbn: it.isbn || '',
            title: it.title || it.bookTitle || it.name || '',
            category: it.category || '',
            quantityOnHand: qty,
            averagePrice: price,
            value: value
          };
        });
        $scope.inventoryReportTotal = $scope.inventoryReportData.reduce(function(a,b){return a+Number(b.value||0)},0);
        var totalQty = $scope.inventoryReportData.reduce(function(a,b){return a+Number(b.quantityOnHand||0)},0);
        var byCat = {};
        $scope.inventoryReportData.forEach(function(it){
          var key = it.category || 'Khác';
          byCat[key] = (byCat[key]||0) + Number(it.value||0);
        });
        var catArr = Object.keys(byCat).map(function(k){ return { category: k, value: byCat[k] }; }).sort(function(a,b){ return b.value - a.value; });
        var totalVal = $scope.inventoryReportTotal || 1;
        var catPercents = catArr.slice(0,5).map(function(x){ return { category: x.category, percent: Math.round((x.value/totalVal)*1000)/10, value: x.value }; });
        // Build groups for UI rendering
        var groupsMap = {};
        $scope.inventoryReportData.forEach(function(it){
          var cat = it.category || 'Khác';
          if (!groupsMap[cat]) groupsMap[cat] = { category: cat, items: [], subtotal: 0 };
          groupsMap[cat].items.push(it);
          groupsMap[cat].subtotal += Number(it.value||0);
        });
        $scope.inventoryGroups = Object.keys(groupsMap).sort().map(function(k){ return groupsMap[k]; });
        $scope.inventorySummary = {
          totalValue: $scope.inventoryReportTotal,
          totalQuantity: totalQty,
          categories: catPercents
        };
        $scope.inventoryChart = true;
        if (openModal) {
          $scope.showingDashboardReport = false;
          $scope.showingDashboardProfit = false;
          $scope.showingDashboardInventory = true;
        }
      }).catch(function(e){
        $scope.addToast('danger','Không thể tải báo cáo tồn kho');
      }).finally(function(){ $scope.loadingInventory = false; $scope.$applyAsync(); });
    };

    // Xem báo cáo lợi nhuận
    $scope.viewProfitReport = function(openModal) {
      $scope.loadingProfit = true;
      $scope.profitReportData = null;
      $scope.profitSummary = null;
      var f = $scope.profitFilter.fromDate;
      var t = $scope.profitFilter.toDate;
      if (!f || !t) { $scope.loadingProfit = false; $scope.addToast('danger','Vui lòng chọn đủ khoảng ngày!'); return; }
      function toYMD(d){ if (typeof d === 'string') return d.slice(0,10); var dt = (d instanceof Date)? d : new Date(d); return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2); }
      var fromStr = toYMD(f), toStr = toYMD(t);
      if (openModal) {
        $scope.showingDashboardReport = false;
        $scope.showingDashboardInventory = false;
        $scope.showingDashboardProfit = true;
      }
      BookstoreService.getProfitReport({ fromDate: fromStr, toDate: toStr })
        .then(function(res){
          var data = res && res.data && res.data.data;
          if (!data) { $scope.addToast('warning','Không có dữ liệu lợi nhuận'); return; }
          // capture generatedBy if provided by API
          if (data && data.generatedBy) {
            $scope.reportGeneratedByProfit = data.generatedBy;
          } else {
            $scope.reportGeneratedByProfit = null;
          }
          $scope.profitReportData = {
            ordersCount: Number(data.ordersCount||0),
            revenue: Number(data.revenue||0),
            cogs: Number(data.costOfGoods||0),
            opex: Number(data.operatingExpenses||0),
            profit: Number(data.profit||0),
            topSoldItems: data.topSoldItems || [],
            topMarginItems: data.topMarginItems || []
          };
          // Always display exactly the user-selected range to avoid timezone shifts
          $scope.profitSummary = {
            fromDate: fromStr,
            toDate: toStr,
            profit: $scope.profitReportData.profit
          };
          // modal đã mở ở trên; chỉ cập nhật dữ liệu
        })
        .catch(function(){ $scope.addToast('danger','Không thể tải báo cáo lợi nhuận'); })
        .finally(function(){ $scope.loadingProfit = false; $scope.$applyAsync(); });
    };

    // ===== AI Assistant (Admin) =====
    $scope.runAdminAiAssistant = function() {
      // Dùng khoảng ngày của báo cáo lợi nhuận nếu có, nếu không fallback về tháng hiện tại
      var from = $scope.profitFilter.fromDate || $scope.revenueFilter.fromDate;
      var to = $scope.profitFilter.toDate || $scope.revenueFilter.toDate;

      if (!from || !to) {
        $scope.addToast('danger', 'Vui lòng chọn khoảng ngày cho báo cáo lợi nhuận trước khi dùng trợ lý AI.');
        return;
      }

      $scope.aiAssistantLoading = true;
      $scope.aiAssistantError = null;

      function toIso(d) {
        if (!d) return null;
        if (typeof d === 'string') return d;
        try {
          return d.toISOString();
        } catch (e) {
          return null;
        }
      }

      var payload = {
        fromDate: toIso(from),
        toDate: toIso(to),
        language: 'vi'
      };

      BookstoreService.adminAiAssistant(payload)
        .then(function(res){
          var data = res && res.data && res.data.data ? res.data.data : null;
          if (!data) {
            $scope.aiAssistantError = 'Trợ lý AI không trả về dữ liệu.';
            $scope.addToast('danger', $scope.aiAssistantError);
            return;
          }

          $scope.aiAssistant = {
            overview: data.overview || '',
            recommendedCategories: Array.isArray(data.recommendedCategories) ? data.recommendedCategories : [],
            bookSuggestions: Array.isArray(data.bookSuggestions) ? data.bookSuggestions : [],
            customerFeedbackSummary: data.customerFeedbackSummary || ''
          };

          $scope.addToast('success', 'Đã phân tích dữ liệu bằng trợ lý AI.');
        })
        .catch(function(err){
          console.error('Admin AI assistant error:', err);
          $scope.aiAssistantError = (err && err.data && err.data.message) || 'Không thể gọi trợ lý AI. Vui lòng thử lại sau.';
          $scope.addToast('danger', $scope.aiAssistantError);
        })
        .finally(function(){
          $scope.aiAssistantLoading = false;
          $scope.$applyAsync();
        });
    };

    // Initialize controller
    $scope.init = function() {
        $scope.loadStats();
        $scope.loadLatestBooks();
        // Set default filters to current month and today, then auto-load charts (không mở modal)
        try {
            var now = new Date();
            var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            $scope.revenueFilter.type = 'monthly';
            // Với AngularJS, input type=date bind Date object để hiển thị
            $scope.revenueFilter.fromDate = monthStart;
            $scope.revenueFilter.toDate = now;
            $scope.inventoryFilter.toDate = now;
            $scope.profitFilter.fromDate = monthStart;
            $scope.profitFilter.toDate = now;
            // Defer to next digest to make sure bindings are ready
            setTimeout(function(){
                $scope.viewRevenueReport(false);
                $scope.viewInventoryReport(false);
                $scope.viewProfitReport(false);
                $scope.loadBooksByCategoryShare();
            }, 0);
        } catch(e) { console.warn('Auto-load dashboard reports failed', e); }
    };

    // Load books share by category for pie chart
    $scope.loadBooksByCategoryShare = function() {
      BookstoreService.getBooksByCategoryShare()
        .then(function(res){
          var data = res && res.data && res.data.data;
          if (!data || !Array.isArray(data.items)) { $scope.categoryShare = { total:0, items: [] }; return; }
          var total = Number(data.total || 0);
          var items = data.items.map(function(it){
            return {
              category: it.category || 'Khác',
              count: Number(it.count || 0),
              percent: Number(it.percent || (total ? (it.count*100/total) : 0))
            };
          }).filter(function(x){ return x.count > 0; });
          // sort desc by percent and keep top 8, group the rest as 'Khác'
          items.sort(function(a,b){ return b.percent - a.percent; });
          var top = items.slice(0,8);
          var rest = items.slice(8);
          if (rest.length > 0) {
            var restCount = rest.reduce(function(a,b){ return a + b.count; }, 0);
            var restPercent = rest.reduce(function(a,b){ return a + b.percent; }, 0);
            top.push({ category: 'Khác', count: restCount, percent: Math.round(restPercent*100)/100 });
          }
          // normalize percentages to 100
          var sumPct = top.reduce(function(a,b){ return a + b.percent; }, 0) || 1;
          top = top.map(function(x){ return { category: x.category, count: x.count, percent: Math.round((x.percent*100/sumPct)*100)/100 }; });

          $scope.categoryShare = { total: total, items: top };
          // Build conic-gradient string
          var palette = ['#4f46e5','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#84cc16','#f97316','#3b82f6','#14b8a6'];
          var accum = 0;
          var segments = [];
          var legend = [];
          for (var i=0;i<top.length;i++) {
            var color = palette[i % palette.length];
            var start = accum;
            var pct = Math.max(0, Math.min(100, Number(top[i].percent)));
            accum = Math.min(100, start + pct);
            segments.push(color + ' ' + start + '% ' + accum + '%');
            legend.push({ color: color, label: top[i].category, percent: pct });
          }
          // fill leftover with transparent if any gap
          if (accum < 100) segments.push('transparent ' + accum + '% 100%');
          $scope.categoryPie = { gradient: segments.join(', '), items: legend };
        })
        .catch(function(){ $scope.categoryShare = { total:0, items: [] }; });
    };

    // ===== Export report to PDF =====
    function ensureHtml2PdfLoaded() {
      return new Promise(function(resolve, reject){
        if (window.html2pdf) return resolve();
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function(){ resolve(); };
        script.onerror = function(){ reject(new Error('Failed to load html2pdf.js')); };
        document.head.appendChild(script);
      });
    }

    function exportElementToPdf(el, filename){
      return ensureHtml2PdfLoaded().then(function(){
        // Clone element to avoid modifying original
        var clone = el.cloneNode(true);
        // Add inline styles to prevent page breaks
        var tables = clone.querySelectorAll('.profit-table, .table');
        for (var i = 0; i < tables.length; i++) {
          tables[i].style.pageBreakInside = 'avoid';
          tables[i].style.breakInside = 'avoid';
        }
        var rows = clone.querySelectorAll('.profit-table tr, .table tr');
        for (var j = 0; j < rows.length; j++) {
          rows[j].style.pageBreakInside = 'avoid';
          rows[j].style.breakInside = 'avoid';
        }
        var sections = clone.querySelectorAll('.profit-table-section');
        for (var k = 0; k < sections.length; k++) {
          sections[k].style.pageBreakInside = 'avoid';
          sections[k].style.breakInside = 'avoid';
        }
        var opt = {
          margin:       10,
          filename:     filename || 'report.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        return window.html2pdf().set(opt).from(clone).save();
      });
    }

    // Fallback (print -> user chooses Save as PDF manually)
    function openPrintWindowWithHtml(html, title) {
      var win = window.open('', '_blank');
      if (!win) { $scope.addToast('danger','Trình duyệt chặn cửa sổ mới'); return; }
      win.document.open();
      win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+ (title||'Report') +'</title>');
      // clone styles from current document
      try {
        var nodes = document.querySelectorAll('link[rel="stylesheet"], style');
        for (var i=0;i<nodes.length;i++) {
          win.document.write(nodes[i].outerHTML);
        }
      } catch(e) {}
      // add print styles
      win.document.write('<style>@page{size:auto;margin:16mm;} body{padding:0 8mm;font-family:inherit;-webkit-print-color-adjust:exact;print-color-adjust:exact;} .modal-header .btn-close,.modal-header .btn{display:none!important;} .dashboard-report-modal,.inventory-report-modal,.profit-report-modal{position:static;transform:none;width:auto;max-width:none;box-shadow:none;} .modal-body{max-height:none;overflow:visible;} .profit-table-section{page-break-inside:avoid!important;break-inside:avoid!important;} .profit-table{page-break-inside:avoid!important;break-inside:avoid!important;} .table{width:100%;page-break-inside:avoid!important;break-inside:avoid!important;} .table thead{display:table-header-group!important;} .table tbody{display:table-row-group!important;page-break-inside:avoid!important;break-inside:avoid!important;} .table tr{page-break-inside:avoid!important;page-break-after:auto!important;break-inside:avoid!important;} .table td,.table th{page-break-inside:avoid!important;break-inside:avoid!important;} .table-responsive{page-break-inside:avoid!important;break-inside:avoid!important;} h4{page-break-after:avoid!important;break-after:avoid!important;}</style>');
      win.document.write('</head><body>');
      win.document.write('<div class="print-container">' + html + '</div>');
      win.document.write('</body></html>');
      win.document.close();
      // ensure print after load
      var doPrint = function(){ try { win.focus(); win.print(); } catch(e) {} };
      if (win.document.readyState === 'complete') {
        setTimeout(doPrint, 150);
      } else {
        win.onload = function(){ setTimeout(doPrint, 150); };
      }
    }

    function exportReport(selector, title){
      try {
        var el = document.querySelector(selector);
        if (!el) { $scope.addToast('danger','Không tìm thấy nội dung báo cáo'); return; }
        // Try html2pdf first for auto-download; fallback to print
        exportElementToPdf(el, (title||'report') + '.pdf')
          .catch(function(){ openPrintWindowWithHtml(el.innerHTML, title); });
      } catch(e) {
        $scope.addToast('danger','Không thể xuất PDF');
      }
    }

    $scope.exportRevenuePdf = function(){ exportReport('#revenueReportModal .modal-body', 'Báo cáo doanh thu'); };
    $scope.exportInventoryPdf = function(){ exportReport('#inventoryReportModal .modal-body', 'Báo cáo tồn kho'); };
    $scope.exportProfitPdf = function(){ exportReport('#profitReportModal .modal-body', 'Báo cáo lợi nhuận'); };

    // Load statistics
    $scope.loadStats = function() {
        BookstoreService.getAdminDashboardSummary()
            .then(function(res){
                var data = res && res.data && res.data.data;
                if (data) {
                    var src = (data && data.summary) ? data.summary : data;
                    var totalUsers = src.totalUsers != null ? src.totalUsers : (src.users != null ? src.users : 0);
                    var totalBooks = src.totalBooks != null ? src.totalBooks : (src.totalBook != null ? src.totalBook : (src.booksCount != null ? src.booksCount : (src.books != null ? src.books : 0)));
                    var todayOrders = src.todayOrders != null ? src.todayOrders : (src.ordersToday != null ? src.ordersToday : 0);
                    var monthlyRevenue = src.monthlyRevenue != null ? src.monthlyRevenue : (src.revenueThisMonth != null ? src.revenueThisMonth : (src.totalRevenueThisMonth != null ? src.totalRevenueThisMonth : (src.monthRevenue != null ? src.monthRevenue : 0)));
                    var growthRate = src.growthRate != null ? src.growthRate : (src.growth != null ? src.growth : 0);
                    var newUsers = src.newUsers != null ? src.newUsers : (src.newUsersThisMonth != null ? src.newUsersThisMonth : 0);
                    var soldBooks = src.soldBooks != null ? src.soldBooks : (src.soldBooksThisMonth != null ? src.soldBooksThisMonth : 0);
                    $scope.stats = {
                        totalUsers: Number(totalUsers) || 0,
                        totalBooks: Number(totalBooks) || 0,
                        todayOrders: Number(todayOrders) || 0,
                        monthlyRevenue: Number(monthlyRevenue) || 0,
                        growthRate: Number(growthRate) || 0,
                        newUsers: Number(newUsers) || 0,
                        soldBooks: Number(soldBooks) || 0
                    };
                    $scope.addToast('success', 'Đã tải thống kê tổng quan.');
                }
            })
            .catch(function(err){
                console.error('Summary error:', err);
                $scope.addToast('danger', (err && err.data && err.data.message) || 'Không thể tải thống kê.');
            })
            .finally(function(){
                // Always compute monthly revenue from report API to ensure accuracy
                try {
                    var now = new Date();
                    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    var prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    var prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

                    // Current month revenue
                    BookstoreService.getRevenueReport({ fromDate: formatYMD(monthStart), toDate: formatYMD(now) })
                        .then(function(r){
                            var payload = r && r.data && r.data.data;
                            var currentSum = sumRevenueFromReportPayload(payload);
                            $scope.stats.monthlyRevenue = currentSum;
                            return BookstoreService.getRevenueReport({ fromDate: formatYMD(prevMonthStart), toDate: formatYMD(prevMonthEnd) });
                        })
                        .then(function(prevRes){
                            var prevPayload = prevRes && prevRes.data && prevRes.data.data;
                            var prevSum = sumRevenueFromReportPayload(prevPayload);
                            var cur = Number($scope.stats.monthlyRevenue) || 0;
                            var growth = 0;
                            if (prevSum > 0) {
                                growth = ((cur - prevSum) / prevSum) * 100;
                            } else if (cur > 0) {
                                growth = 100; // from zero to positive => 100%+
                            } else {
                                growth = 0;
                            }
                            // Round to one decimal place
                            $scope.stats.growthRate = Math.round(growth * 10) / 10;
                            return BookstoreService.getAdminTotalUsers();
                        })
                        .then(function(usersRes){
                            var udata = usersRes && usersRes.data && usersRes.data.data;
                            if (udata && udata.totalUsers != null) {
                                $scope.stats.totalUsers = Number(udata.totalUsers) || $scope.stats.totalUsers;
                            }
                            return BookstoreService.getAdminOrdersToday();
                        })
                        .then(function(ordersRes){
                            var odata = ordersRes && ordersRes.data && ordersRes.data.data;
                            if (odata && (odata.totalOrdersToday != null)) {
                                $scope.stats.todayOrders = Number(odata.totalOrdersToday) || $scope.stats.todayOrders;
                            }
                        })
                        .catch(function(e){
                            console.warn('Monthly revenue via report failed', e);
                        });
                } catch(e) { console.warn(e); }
            });
    };

    // (Removed recent activities per request)

    // Load newest books via dedicated API
    $scope.loadLatestBooks = function() {
        BookstoreService.getLatestBooks(10)
            .then(function(response){
                var list = [];
                if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.books)) {
                    list = response.data.data.books;
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    list = response.data.data;
                } else if (response.data && Array.isArray(response.data)) {
                    list = response.data;
                }
                $scope.latestBooks = (list || []).slice(0,5);
            })
            .catch(function(error){
                console.error('Newest books error:', error);
                $scope.addToast('danger', 'Không thể tải sách mới nhất.');
            });
    };

    // Test API endpoints
    $scope.testPublicAPI = function() {
        AuthService.testPublic()
            .then(function(response) {
                console.log('Public API test:', response.data);
                showNotification('Public API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Public API test failed:', error);
                showNotification('Public API không hoạt động!', 'danger');
            });
    };

    $scope.testProtectedAPI = function() {
        AuthService.testProtected()
            .then(function(response) {
                console.log('Protected API test:', response.data);
                showNotification('Protected API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Protected API test failed:', error);
                showNotification('Protected API không hoạt động!', 'danger');
            });
    };

    $scope.testAdminAPI = function() {
        AuthService.testAdminOnly()
            .then(function(response) {
                console.log('Admin API test:', response.data);
                showNotification('Admin API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Admin API test failed:', error);
                showNotification('Admin API không hoạt động!', 'danger');
            });
    };

    $scope.testStaffAPI = function() {
        AuthService.testStaffOnly()
            .then(function(response) {
                console.log('Staff API test:', response.data);
                showNotification('Staff API hoạt động bình thường!', 'success');
            })
            .catch(function(error) {
                console.error('Staff API test failed:', error);
                showNotification('Staff API không hoạt động!', 'danger');
            });
    };

    // Initialize when controller loads
    $scope.init();
}]);

// Vietnamese number formatting filter (thousands separator by dot)
app.filter('vnNumber', [function() {
  return function(input, fractionSize) {
    var num = Number(input);
    if (isNaN(num)) return input;
    var digits = (typeof fractionSize === 'number') ? fractionSize : 0;
    try {
      return num.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    } catch (e) {
      // Fallback manual formatting
      var parts = num.toFixed(digits).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    }
  };
}]);

