import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';

function MessageList() {
    const { messages } = useGame();
    const messagesEndRef = useRef(null);
    
    // 自动滚动到最新消息
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    
    return (
        <div className="message-list">
            {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                    {message.text}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default MessageList; 