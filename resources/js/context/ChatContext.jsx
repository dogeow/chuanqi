import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建聊天上下文
const ChatContext = createContext();

// 聊天上下文提供者组件
export const ChatProvider = ({ children }) => {
    // 聊天相关状态
    const [scrollPosition, setScrollPosition] = useState(0);
    const [messages, setMessages] = useState([]);
    const [chatType, setChatType] = useState('world');
    
    // 提供给子组件的值
    const value = {
        scrollPosition,
        setScrollPosition,
        messages,
        setMessages,
        chatType,
        setChatType
    };
    
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

// 自定义钩子，方便使用聊天上下文
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

export default ChatContext; 