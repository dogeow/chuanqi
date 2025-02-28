<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

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
            
            // 删除旧令牌
            Auth::user()->tokens()->delete();
            
            // 生成新的Sanctum令牌
            $token = Auth::user()->createToken('game-token')->plainTextToken;
            
            // 将令牌存储在会话中，以便在需要时可以访问
            $request->session()->put('game_token', $token);
            
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
        \Log::info('收到注册请求', $request->all());
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            \Log::warning('注册验证失败', ['errors' => $validator->errors()->toArray()]);
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \DB::beginTransaction();
            
            // 创建用户
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
            
            \Log::info('用户创建成功', ['user_id' => $user->id]);

            // 为新用户创建角色
            $character = new \App\Models\Character([
                'name' => $user->name . '的角色',
                'level' => 1,
                'exp' => 0,
                'max_hp' => 100,
                'current_hp' => 100,
                'max_mp' => 50,
                'current_mp' => 50,
                'attack' => 10,
                'defense' => 5,
                'current_map_id' => 1, // 默认从第一张地图开始
                'position_x' => 100,
                'position_y' => 100,
            ]);
            
            $user->characters()->save($character);
            \Log::info('角色创建成功', ['character_id' => $character->id]);
            
            \DB::commit();
            
            // 登录用户
            Auth::login($user);
            $request->session()->regenerate();
            
            // 生成Sanctum令牌
            $token = $user->createToken('game-token')->plainTextToken;
            \Log::info('令牌生成成功', ['token_length' => strlen($token)]);
            
            // 将令牌存储在会话中，以便在需要时可以访问
            $request->session()->put('game_token', $token);
            
            $response = [
                'success' => true,
                'token' => $token,
                'redirect' => route('game.index')
            ];
            
            \Log::info('注册成功，返回响应', ['redirect' => $response['redirect']]);
            
            return response()->json($response);
            
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('注册过程中发生错误', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '注册过程中发生错误，请稍后重试',
                'error' => $e->getMessage()
            ], 500);
        }
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