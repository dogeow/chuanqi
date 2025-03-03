<?php

namespace App\Http\Controllers;

use App\Models\Character;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RankingController extends Controller
{
    /**
     * 获取排行榜数据
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRankings(Request $request)
    {
        $type = $request->input('type', 'level'); // 默认按等级排名
        $limit = $request->input('limit', 10); // 默认显示10条记录
        
        // 缓存键
        $cacheKey = "rankings_{$type}_{$limit}";
        
        // 尝试从缓存获取数据
        if (Cache::has($cacheKey)) {
            return response()->json([
                'success' => true,
                'rankings' => Cache::get($cacheKey),
                'type' => $type
            ]);
        }
        
        // 根据不同类型获取排名
        switch ($type) {
            case 'level':
                $rankings = $this->getLevelRankings($limit);
                break;
            case 'gold':
                $rankings = $this->getGoldRankings($limit);
                break;
            case 'attack':
                $rankings = $this->getAttackRankings($limit);
                break;
            case 'defense':
                $rankings = $this->getDefenseRankings($limit);
                break;
            default:
                $rankings = $this->getLevelRankings($limit);
                break;
        }
        
        // 缓存结果，有效期10分钟
        Cache::put($cacheKey, $rankings, 600);
        
        return response()->json([
            'success' => true,
            'rankings' => $rankings,
            'type' => $type
        ]);
    }
    
    /**
     * 获取等级排行榜
     * 
     * @param int $limit
     * @return array
     */
    private function getLevelRankings($limit)
    {
        return Character::select('id', 'name', 'level', 'exp')
            ->orderBy('level', 'desc')
            ->orderBy('exp', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($character, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $character->id,
                    'name' => $character->name,
                    'level' => $character->level,
                    'exp' => $character->exp,
                ];
            });
    }
    
    /**
     * 获取金币排行榜
     * 
     * @param int $limit
     * @return array
     */
    private function getGoldRankings($limit)
    {
        return Character::select('id', 'name', 'gold', 'level')
            ->orderBy('gold', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($character, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $character->id,
                    'name' => $character->name,
                    'gold' => $character->gold,
                    'level' => $character->level,
                ];
            });
    }
    
    /**
     * 获取攻击力排行榜
     * 
     * @param int $limit
     * @return array
     */
    private function getAttackRankings($limit)
    {
        return Character::select('id', 'name', 'attack', 'level')
            ->orderBy('attack', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($character, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $character->id,
                    'name' => $character->name,
                    'attack' => $character->attack,
                    'level' => $character->level,
                ];
            });
    }
    
    /**
     * 获取防御力排行榜
     * 
     * @param int $limit
     * @return array
     */
    private function getDefenseRankings($limit)
    {
        return Character::select('id', 'name', 'defense', 'level')
            ->orderBy('defense', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($character, $index) {
                return [
                    'rank' => $index + 1,
                    'id' => $character->id,
                    'name' => $character->name,
                    'defense' => $character->defense,
                    'level' => $character->level,
                ];
            });
    }
    
    /**
     * 获取当前用户在各排行榜中的排名
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserRanking(Request $request)
    {
        $user = $request->user();
        $character = Character::where('user_id', $user->id)->first();
        
        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '未找到角色信息'
            ], 404);
        }
        
        // 获取用户在各排行榜中的排名
        $levelRank = Character::where('level', '>', $character->level)
            ->orWhere(function ($query) use ($character) {
                $query->where('level', '=', $character->level)
                      ->where('exp', '>', $character->exp);
            })
            ->count() + 1;
            
        $goldRank = Character::where('gold', '>', $character->gold)->count() + 1;
        $attackRank = Character::where('attack', '>', $character->attack)->count() + 1;
        $defenseRank = Character::where('defense', '>', $character->defense)->count() + 1;
        
        return response()->json([
            'success' => true,
            'rankings' => [
                'level' => $levelRank,
                'gold' => $goldRank,
                'attack' => $attackRank,
                'defense' => $defenseRank
            ],
            'character' => [
                'id' => $character->id,
                'name' => $character->name,
                'level' => $character->level,
                'exp' => $character->exp,
                'gold' => $character->gold,
                'attack' => $character->attack,
                'defense' => $character->defense
            ]
        ]);
    }
}