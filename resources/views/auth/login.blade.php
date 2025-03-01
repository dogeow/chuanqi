<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 传奇游戏</title>
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
                <p>还没有账号？ <a href="{{ route('register') }}" id="register-link">立即注册</a></p>
            </div>
        </form>
    </div>

    <script>
        // 打印当前注册路由
        console.log('注册路由URL:', '{{ route("register") }}');
        
        document.addEventListener('DOMContentLoaded', function() {
            // 为注册链接添加点击事件
            const registerLink = document.getElementById('register-link');
            if (registerLink) {
                registerLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('注册链接被点击，准备跳转到:', '{{ url("/register") }}');
                    window.location.href = '{{ url("/register") }}';
                });
            }
            
            const loginForm = document.getElementById('login-form');
            
            if (loginForm) {
                loginForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(loginForm);
                    const email = formData.get('email');
                    const password = formData.get('password');
                    const remember = formData.get('remember') ? true : false;
                    
                    axios.post('/login', {
                        email: email,
                        password: password,
                        remember: remember
                    })
                    .then(response => {
                        if (response.data.success) {
                            // 保存token到localStorage
                            localStorage.setItem('game_token', response.data.token);
                            
                            // 重定向到游戏页面
                            window.location.href = response.data.redirect;
                        }
                    })
                    .catch(error => {
                        let errorMessage = '登录失败，请重试';
                        if (error.response && error.response.data && error.response.data.errors) {
                            const errors = error.response.data.errors;
                            errorMessage = Object.values(errors)[0][0] || errorMessage;
                        }
                        alert(errorMessage);
                    });
                });
            }
        });
    </script>
</body>
</html> 