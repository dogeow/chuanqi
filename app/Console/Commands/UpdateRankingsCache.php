<?php

namespace App\Console\Commands;

use App\Models\Character;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class UpdateRankingsCache extends Command
{
    /**
     * 命令名称
     *
     * @var string
     */
    protected $signature = 'rankings:update';

    /**
     * 命令描述
     *
     * @var string
     */
    protected $description = '更新排行榜缓存数据';

    /**
     * 执行命令
     *
     * @return int
     */
    public function handle()
    {
        $this->info('开始更新排行榜缓存...');
        
        // 更新各类型排行榜缓存
        $this->updateRankingCache('level', 10);
        $this->updateRankingCache('gold', 10);
        $this->updateRankingCache('attack', 10);
        $this->updateRankingCache('defense', 10);
        
        // 更新更多数量的排行榜
        $this->updateRankingCache('level', 50);
        $this->updateRankingCache('gold', 50);
        $this->updateRankingCache('attack', 50);
        $this->updateRankingCache('defense', 50);
        
        $this->info('排行榜缓存更新完成!');
        
        return Command::SUCCESS;
    }
    
    /**
     * 更新指定类型和数量的排行榜缓存
     *
     * @param string $type 排行榜类型
     * @param int $limit 显示数量
     * @return void
     */
    private function updateRankingCache($type, $limit)
    {
        $cacheKey = "rankings_{$type}_{$limit}";
        
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
        
        $this->info("已更新 {$type} 排行榜 (显示{$limit}条)");
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
}