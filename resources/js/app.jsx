import './bootstrap';
import axios from 'axios';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './components/Game.jsx';

// 配置Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 获取CSRF令牌
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
} else {
    console.error('CSRF token not found');
}

// 设置认证令牌
const authToken = localStorage.getItem('game_token');
if (authToken) {
    window.axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
} else {
    console.error('认证令牌未找到，API请求可能会失败');
}

// 添加响应拦截器，处理401错误
window.axios.interceptors.response.use(
    response => response,
    error => {
        // 如果响应状态码是401（未授权），跳转到登录页面
        if (error.response && error.response.status === 401) {
            console.log('用户未授权，正在跳转到登录页面...');
            // 清除本地存储的认证令牌
            localStorage.removeItem('game_token');
            // 跳转到登录页面
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 渲染React应用
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
    createRoot(gameContainer).render(
        <React.StrictMode>
            <Game />
        </React.StrictMode>
    );
} 