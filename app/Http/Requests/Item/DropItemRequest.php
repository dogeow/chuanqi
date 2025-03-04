<?php

namespace App\Http\Requests\Item;

use Illuminate\Foundation\Http\FormRequest;

class DropItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'character_item_id' => 'required|exists:inventories,id',
            'quantity' => 'required|integer|min:1',
        ];
    }

    /**
     * 获取验证错误的自定义消息
     */
    public function messages(): array
    {
        return [
            'character_item_id.required' => '物品ID不能为空',
            'character_item_id.exists' => '物品不存在',
            'quantity.required' => '数量不能为空',
            'quantity.integer' => '数量必须是整数',
            'quantity.min' => '数量必须大于0',
        ];
    }
} 