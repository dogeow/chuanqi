import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// 创建全局变量来存储聊天状态
const chatState = {
    messages: [],
    scrollPosition: 0,
    lastFetchTime: 0,
    initialized: false,
    previousMessageCount: 0 // 添加一个变量来跟踪上一次的消息数量
};

const Chat = () => {
    const [messages, setMessages] = useState(chatState.messages);
    const [content, setContent] = useState('');
    const [type, setType] = useState('world');
    const [receiverId, setReceiverId] = useState(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    // 保存滚动位置
    const saveScrollPosition = () => {
        if (chatMessagesRef.current) {
            chatState.scrollPosition = chatMessagesRef.current.scrollTop;
        }
    };
    
    // 恢复滚动位置
    const restoreScrollPosition = () => {
        if (chatMessagesRef.current && chatState.scrollPosition) {
            chatMessagesRef.current.scrollTop = chatState.scrollPosition;
        }
    };

    // 只在首次加载或超过一定时间后才请求API
    const fetchMessages = async (force = false) => {
        // 如果已经初始化且不是强制刷新，则不重新请求
        if (chatState.initialized && !force) {
            setMessages(chatState.messages);
            return;
        }
        
        // 如果距离上次请求不到5分钟，且不是强制刷新，则不重新请求
        const now = Date.now();
        if (!force && chatState.lastFetchTime && (now - chatState.lastFetchTime < 5 * 60 * 1000)) {
            setMessages(chatState.messages);
            return;
        }
        
        try {
            const response = await axios.get(`/api/chat/messages?type=${type}`);
            const newMessages = response.data.data;
            
            // 更新全局状态
            chatState.messages = newMessages;
            chatState.lastFetchTime = now;
            chatState.initialized = true;
            chatState.previousMessageCount = newMessages.length;
            
            setMessages(newMessages);
            // 首次加载完成后滚动到底部
            setShouldScrollToBottom(true);
        } catch (error) {
            console.error('获取消息失败:', error);
            alert('获取消息失败');
        }
    };

    useEffect(() => {
        // 加载消息，但避免不必要的API请求
        fetchMessages();

        // 检查 Echo 是否已初始化
        if (!window.Echo) {
            console.error('Echo 未初始化');
            return;
        }

        // 订阅 WebSocket 频道
        const channel = window.Echo.channel('chat');
        
        // 添加连接状态监听
        channel.listen('.MessageSent', (event) => {
            console.log('收到消息:', event);
            // 根据消息类型过滤
            if (event.message.type === type) {
                const newMessages = [...chatState.messages, event.message];
                chatState.messages = newMessages;
                chatState.previousMessageCount = chatState.messages.length;
                setMessages(newMessages);
                // 收到新消息时滚动到底部
                setShouldScrollToBottom(true);
            }
        });

        // 添加连接成功的回调
        window.Echo.connector.pusher.connection.bind('connected', () => {
            console.log('WebSocket 连接成功');
        });

        // 添加连接错误的回调
        window.Echo.connector.pusher.connection.bind('error', (error) => {
            console.error('WebSocket 连接错误:', error);
        });
        
        // 组件挂载后恢复滚动位置
        setTimeout(restoreScrollPosition, 100);

        // 清理函数
        return () => {
            // 组件卸载前保存滚动位置
            saveScrollPosition();
            
            channel.stopListening('.MessageSent');
            // 移除连接状态监听
            if (window.Echo.connector.pusher.connection) {
                window.Echo.connector.pusher.connection.unbind('connected');
                window.Echo.connector.pusher.connection.unbind('error');
            }
        };
    }, [type]);

    // 处理滚动到底部
    useEffect(() => {
        if (shouldScrollToBottom) {
            scrollToBottom();
            setShouldScrollToBottom(false);
        }
    }, [shouldScrollToBottom]);
    
    // 监听滚动事件，实时保存滚动位置
    useEffect(() => {
        const handleScroll = () => {
            saveScrollPosition();
        };
        
        const chatMessagesElement = chatMessagesRef.current;
        if (chatMessagesElement) {
            chatMessagesElement.addEventListener('scroll', handleScroll);
            
            return () => {
                chatMessagesElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const handleSend = async () => {
        if (!content.trim()) {
            return;
        }

        setLoading(true);
        try {
            const data = {
                content,
                type,
            };
            
            if (type === 'private') {
                data.receiver_id = receiverId;
            }
            
            await axios.post('/api/chat/send', data);
            setContent('');
            // 发送消息后滚动到底部
            setShouldScrollToBottom(true);
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('发送消息失败');
        } finally {
            setLoading(false);
        }
    };

    // 添加手动刷新功能
    const handleRefresh = () => {
        fetchMessages(true);
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="chat-type-select"
                >
                    <option value="world">世界聊天</option>
                    <option value="private">私聊（尚未开发）</option>
                </select>
                <button onClick={handleRefresh} className="refresh-button" title="刷新消息">
                    🔄
                </button>
            </div>
            
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((item) => (
                    <div key={item.id} className="chat-message">
                        <div className="message-avatar">
                            {item.sender?.name?.[0] || '?'}
                        </div>
                        <div className="message-content">
                            <div className="message-sender">
                                {item.sender?.name || '未知用户'} 
                                {item.type === 'private' && <span className="private-tag">私聊</span>}
                            </div>
                            <div className="message-text">{item.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
                <div className="input-container">
                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入消息..."
                        className="chat-input-field"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="send-button"
                    >
                        {loading ? '发送中...' : '发送'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat; 