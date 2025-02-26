<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TestController extends Controller
{
    /**
     * 测试记录请求数据
     */
    public function logRequest(Request $request)
    {
        // 记录所有请求数据
        Log::info('测试请求数据', [
            'all' => $request->all(),
            'headers' => $request->header(),
            'method' => $request->method(),
            'path' => $request->path(),
            'ip' => $request->ip()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => '请求数据已记录'
        ]);
    }
}
