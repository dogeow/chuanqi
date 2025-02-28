<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>注册 - 传奇游戏</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    <style>
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            background-color: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 0;
        }
        .register-container {
            max-width: 400px;
            margin: 100px auto;
            padding: 30px;
            background-color: #2d2d2d;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        h1 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            color: #ffcc00;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
        }
        input[type="text"],
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 10px;
            background-color: #3d3d3d;
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #ffcc00;
            color: #000;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #e6b800;
        }
        .error {
            color: #ff6b6b;
            margin-top: 5px;
            font-size: 14px;
        }
        .links {
            margin-top: 20px;
            text-align: center;
        }
        .links a {
            color: #ffcc00;
            text-decoration: none;
        }
        .links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="register-container">
        <h1>传奇游戏注册</h1>
        
        <div id="error-messages" class="error" style="display: none;">
            <ul></ul>
        </div>
        
        <form id="register-form" method="POST" action="{{ route('register') }}">
            @csrf
            
            <div class="form-group">
                <label for="name">用户名</label>
                <input type="text" id="name" name="name" required autofocus>
            </div>
            
            <div class="form-group">
                <label for="email">电子邮件</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-group">
                <label for="password_confirmation">确认密码</label>
                <input type="password" id="password_confirmation" name="password_confirmation" required>
            </div>
            
            <button type="submit" class="btn" id="register-button">注册</button>
            <div id="loading-indicator" style="display: none; text-align: center; margin-top: 10px;">
                <p>正在处理，请稍候...</p>
            </div>
            
            <div class="links">
                <p>已有账号？ <a href="{{ route('login') }}">立即登录</a></p>
            </div>
        </form>
    </div>

    <script>
        document.getElementById('register-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = this;
            const errorMessages = document.getElementById('error-messages');
            const errorList = errorMessages.querySelector('ul');
            const registerButton = document.getElementById('register-button');
            const loadingIndicator = document.getElementById('loading-indicator');
            
            // 清除之前的错误信息
            errorList.innerHTML = '';
            errorMessages.style.display = 'none';
            
            // 显示加载状态
            registerButton.disabled = true;
            registerButton.textContent = '处理中...';
            loadingIndicator.style.display = 'block';
            
            console.log('开始提交注册表单...');
            
            try {
                const formData = {
                    name: form.name.value,
                    email: form.email.value,
                    password: form.password.value,
                    password_confirmation: form.password_confirmation.value
                };
                
                console.log('表单数据:', formData);
                
                const response = await axios.post(form.action, formData);
                
                console.log('注册响应:', response.data);
                
                if (response.data.success) {
                    console.log('注册成功，获取到令牌:', response.data.token.substring(0, 10) + '...');
                    
                    // 保存token到localStorage
                    localStorage.setItem('game_token', response.data.token);
                    console.log('令牌已保存到localStorage');
                    
                    // 显示成功消息
                    alert('注册成功！正在跳转到游戏页面...');
                    
                    // 跳转到游戏页面
                    window.location.href = response.data.redirect;
                } else {
                    console.error('注册响应表明失败:', response.data);
                    errorList.innerHTML = '<li>注册失败，请稍后重试</li>';
                    errorMessages.style.display = 'block';
                    
                    // 恢复按钮状态
                    registerButton.disabled = false;
                    registerButton.textContent = '注册';
                    loadingIndicator.style.display = 'none';
                }
            } catch (error) {
                console.error('注册请求出错:', error);
                
                errorList.innerHTML = '';
                errorMessages.style.display = 'block';
                
                if (error.response) {
                    console.error('错误响应状态:', error.response.status);
                    console.error('错误响应数据:', error.response.data);
                    
                    if (error.response.data.errors) {
                        const errors = error.response.data.errors;
                        for (const field in errors) {
                            errors[field].forEach(message => {
                                const li = document.createElement('li');
                                li.textContent = message;
                                errorList.appendChild(li);
                            });
                        }
                    } else if (error.response.data.message) {
                        const li = document.createElement('li');
                        li.textContent = error.response.data.message;
                        errorList.appendChild(li);
                    } else {
                        const li = document.createElement('li');
                        li.textContent = '注册失败，请稍后重试';
                        errorList.appendChild(li);
                    }
                } else {
                    const li = document.createElement('li');
                    li.textContent = '网络错误，请检查您的连接';
                    errorList.appendChild(li);
                }
                
                // 恢复按钮状态
                registerButton.disabled = false;
                registerButton.textContent = '注册';
                loadingIndicator.style.display = 'none';
            }
        });
    </script>
</body>
</html> 