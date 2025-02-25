<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 传奇游戏</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            background-color: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 0;
        }
        .login-container {
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
        .remember-me {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .remember-me input {
            margin-right: 10px;
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
    <div class="login-container">
        <h1>传奇游戏登录</h1>
        
        <div id="error-messages" class="error" style="display: none;">
            <ul></ul>
        </div>
        
        <form id="login-form" method="POST" action="{{ route('login') }}">
            @csrf
            
            <div class="form-group">
                <label for="email">电子邮件</label>
                <input type="email" id="email" name="email" value="{{ old('email') }}" required autofocus>
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="remember-me">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember">记住我</label>
            </div>
            
            <button type="submit" class="btn">登录</button>
            
            <div class="links">
                <p>还没有账号？ <a href="{{ route('register') }}">立即注册</a></p>
            </div>
        </form>
    </div>

    <script>
        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = this;
            const errorMessages = document.getElementById('error-messages');
            const errorList = errorMessages.querySelector('ul');
            
            try {
                const response = await axios.post(form.action, {
                    email: form.email.value,
                    password: form.password.value,
                    remember: form.remember.checked
                });
                
                if (response.data.success) {
                    // 保存token到localStorage
                    localStorage.setItem('game_token', response.data.token);
                    // 跳转到游戏页面
                    window.location.href = response.data.redirect;
                }
            } catch (error) {
                errorList.innerHTML = '';
                errorMessages.style.display = 'block';
                
                if (error.response && error.response.data.errors) {
                    const errors = error.response.data.errors;
                    for (const field in errors) {
                        errors[field].forEach(message => {
                            const li = document.createElement('li');
                            li.textContent = message;
                            errorList.appendChild(li);
                        });
                    }
                } else {
                    const li = document.createElement('li');
                    li.textContent = '登录失败，请稍后重试';
                    errorList.appendChild(li);
                }
            }
        });
    </script>
</body>
</html> 