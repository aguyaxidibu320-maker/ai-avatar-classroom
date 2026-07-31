/* ========================================
   AI 课堂 - 自定义脚本
   同步对话记录到主页面的对话面板
   ======================================== */

// 对话记录数组
let chatMessages = [];
// 正在流式更新的消息ID
let streamingMessageId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 AI 课堂已加载');
    
    // 延迟一点时间等待 embed.js 加载完成
    setTimeout(setupMessageListener, 1000);
});

/**
 * 设置消息监听器
 * 监听虚拟人组件发出的对话事件
 */
function setupMessageListener() {
    // 使用 window.AvatarWidget.on() 监听消息事件
    if (window.AvatarWidget) {
        // 监听消息事件
        window.AvatarWidget.on('message', function(data) {
            console.log('收到消息事件:', data);
            if (data && data.role && data.text) {
                handleMessageEvent(data);
            }
        });
        
        console.log('✅ AvatarWidget 消息监听器已启动');
    } else {
        // 如果 AvatarWidget 还没加载，继续等待
        console.log('⏳ 等待 AvatarWidget 加载...');
        setTimeout(setupMessageListener, 500);
    }
}

/**
 * 处理消息事件
 * @param {object} data - 消息数据
 */
function handleMessageEvent(data) {
    const role = data.role === 'user' ? 'user' : 'ai';
    const text = data.text;
    const source = data.source || 'conversation';
    const isStreaming = data.streaming === true;
    
    // 如果是更新事件，并且有正在流式更新的消息
    if (source === 'update' && streamingMessageId) {
        updateMessageInPanel(streamingMessageId, text, isStreaming);
        return;
    }
    
    // 新消息
    const messageId = addMessageToPanel(role, text, isStreaming);
    
    // 如果是流式消息，保存ID以便后续更新
    if (isStreaming) {
        streamingMessageId = messageId;
    } else {
        streamingMessageId = null;
    }
    
    // 保存到本地记录
    chatMessages.push({ role, text, source, time: new Date().toISOString() });
}

/**
 * 添加消息到对话面板
 * @param {string} role - 'user' 或 'ai'
 * @param {string} text - 消息内容
 * @param {boolean} isStreaming - 是否正在流式生成
 * @returns {string} 消息ID
 */
function addMessageToPanel(role, text, isStreaming) {
    const chatLog = document.getElementById('chatLog');
    if (!chatLog) return null;

    // 移除欢迎消息（如果存在）
    const welcomeMsg = chatLog.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // 生成唯一ID
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.id = messageId;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble';
    bubbleDiv.textContent = text;
    
    // 如果是流式消息，添加动画效果
    if (isStreaming) {
        bubbleDiv.classList.add('streaming');
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.textContent = '▋';
        bubbleDiv.appendChild(cursor);
    }

    messageDiv.appendChild(bubbleDiv);
    chatLog.appendChild(messageDiv);

    // 滚动到底部
    chatLog.scrollTop = chatLog.scrollHeight;

    return messageId;
}

/**
 * 更新面板中的消息
 * @param {string} messageId - 消息ID
 * @param {string} newText - 新文本
 * @param {boolean} isStreaming - 是否正在流式生成
 */
function updateMessageInPanel(messageId, newText, isStreaming) {
    const messageDiv = document.getElementById(messageId);
    if (!messageDiv) return;
    
    const bubbleDiv = messageDiv.querySelector('.bubble');
    if (!bubbleDiv) return;
    
    // 更新文本
    bubbleDiv.textContent = newText;
    
    // 添加或移除流式光标
    if (isStreaming) {
        bubbleDiv.classList.add('streaming');
        if (!bubbleDiv.querySelector('.cursor')) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            cursor.textContent = '▋';
            bubbleDiv.appendChild(cursor);
        }
    } else {
        bubbleDiv.classList.remove('streaming');
        const cursor = bubbleDiv.querySelector('.cursor');
        if (cursor) cursor.remove();
        streamingMessageId = null;
    }
    
    // 滚动到底部
    const chatLog = document.getElementById('chatLog');
    if (chatLog) {
        chatLog.scrollTop = chatLog.scrollHeight;
    }
}

/**
 * 清除对话记录
 */
function clearChatLog() {
    const chatLog = document.getElementById('chatLog');
    if (!chatLog) return;

    // 清空并显示欢迎消息
    chatLog.innerHTML = `
        <div class="welcome-message">
            <p>👋 对话记录已清除！</p>
            <p>继续与<strong>乌鸡汤老师</strong>对话吧！</p>
        </div>
    `;

    // 清空本地记录
    chatMessages = [];
    streamingMessageId = null;

    console.log('对话记录已清除');
}

/**
 * 快速提问（从主页面的建议按钮点击）
 * @param {string} question - 问题内容
 */
function askQuestion(question) {
    // 确保虚拟人组件已展开
    if (window.AvatarWidget) {
        window.AvatarWidget.open();
        
        // 稍微延迟后发送问题
        setTimeout(function() {
            window.AvatarWidget.ask(question);
        }, 300);
    } else {
        alert('虚拟人组件还在加载中，请稍候...');
    }
}

/**
 * 获取对话历史
 * @returns {Array} 对话记录数组
 */
function getChatHistory() {
    return chatMessages;
}

/**
 * 导出对话记录为JSON
 */
function exportChatHistory() {
    const dataStr = JSON.stringify(chatMessages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-chat-history-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 暴露到全局供 HTML 调用
window.askQuestion = askQuestion;
window.clearChatLog = clearChatLog;
window.getChatHistory = getChatHistory;
window.exportChatHistory = exportChatHistory;