<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * 显示登录页面
     */
    public function showLogin()
    {
        return view('auth.login');
    }

    /**
     * 处理登录请求
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials, $request->filled('remember'))) {
            $request->session()->regenerate();
            
            // 生成Sanctum令牌
            $token = Auth::user()->createToken('game-token')->plainTextToken;
            
            return response()->json([
                'success' => true,
                'token' => $token,
                'redirect' => route('game.index')
            ]);
        }

        return response()->json([
            'success' => false,
            'errors' => ['email' => ['提供的凭据不匹配我们的记录']]
        ], 401);
    }

    /**
     * 显示注册页面
     */
    public function showRegister()
    {
        return view('auth.register');
    }

    /**
     * 处理注册请求
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'gold' => 1000, // 初始金币
        ]);

        Auth::login($user);
        
        // 生成Sanctum令牌
        $token = $user->createToken('game-token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'token' => $token,
            'redirect' => route('game.index')
        ]);
    }

    /**
     * 处理登出请求
     */
    public function logout(Request $request)
    {
        // 删除当前用户的所有令牌
        if (Auth::check()) {
            Auth::user()->tokens()->delete();
        }
        
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
} 