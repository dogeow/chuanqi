import './bootstrap';
import axios from 'axios';

// 配置Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 获取CSRF令牌
const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
} else {
    console.error('CSRF token not found');
}

// Echo配置已移至echo.js

// 引入游戏文件
import './game';
