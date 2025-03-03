import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [type, setType] = useState('world');
    const [receiverId, setReceiverId] = useState(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // 首次加载消息
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
                setMessages(prevMessages => [...prevMessages, event.message]);
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

        // 清理函数
        return () => {
            channel.stopListening('.MessageSent');
            // 移除连接状态监听
            if (window.Echo.connector.pusher.connection) {
                window.Echo.connector.pusher.connection.unbind('connected');
                window.Echo.connector.pusher.connection.unbind('error');
            }
        };
    }, [type]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`/api/chat/messages?type=${type}`);
            setMessages(response.data.data);
        } catch (error) {
            console.error('获取消息失败:', error);
            alert('获取消息失败');
        }
    };

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
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('发送消息失败');
        } finally {
            setLoading(false);
        }
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
            </div>
            
            <div className="chat-messages">
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