// 碰撞检测服务 - 处理游戏中的碰撞检测逻辑

class CollisionService {
    static isCollisionEnabled = true; // 添加碰撞检测开关

    static setCollisionEnabled(enabled) {
        this.isCollisionEnabled = enabled;
    }

    /**
     * 检测两个圆形对象之间是否发生碰撞
     * @param {Object} obj1 - 第一个对象，包含 x, y 和 radius 属性
     * @param {Object} obj2 - 第二个对象，包含 x, y 和 radius 属性
     * @returns {boolean} - 如果碰撞返回 true，否则返回 false
     */
    static checkCircleCollision(obj1, obj2) {
        // 如果碰撞检测被禁用，直接返回false
        if (!this.isCollisionEnabled) {
            return false;
        }

        // 获取对象的位置
        const x1 = obj1.position_x || obj1.x || 0;
        const y1 = obj1.position_y || obj1.y || 0;
        const x2 = obj2.position_x || obj2.x || 0;
        const y2 = obj2.position_y || obj2.y || 0;
        
        // 获取对象的半径，如果没有指定则使用默认值
        const r1 = obj1.radius || 30; // 默认半径改为30像素
        const r2 = obj2.radius || 30; // 默认半径改为30像素
        
        // 计算两点之间的距离
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离小于两个半径之和，则发生碰撞
        return distance < (r1 + r2);
    }
    
    /**
     * 检测玩家与怪物之间的碰撞
     * @param {Object} player - 玩家对象
     * @param {Array} monsters - 怪物数组
     * @returns {Array} - 与玩家碰撞的怪物数组
     */
    static checkPlayerMonsterCollisions(player, monsters) {
        if (!player || !monsters || monsters.length === 0) {
            return [];
        }
        
        return monsters.filter(monster => 
            !monster.is_dead && 
            monster.current_hp > 0 && 
            this.checkCircleCollision(player, monster)
        );
    }
    
    /**
     * 检测玩家与其他玩家之间的碰撞
     * @param {Object} player - 当前玩家对象
     * @param {Array} otherPlayers - 其他玩家数组
     * @returns {Array} - 与当前玩家碰撞的其他玩家数组
     */
    static checkPlayerPlayerCollisions(player, otherPlayers) {
        if (!player || !otherPlayers || otherPlayers.length === 0) {
            return [];
        }
        
        return otherPlayers.filter(otherPlayer => 
            otherPlayer.id !== player.id && 
            this.checkCircleCollision(player, otherPlayer)
        );
    }
    
    /**
     * 检测玩家与NPC之间的碰撞
     * @param {Object} player - 玩家对象
     * @param {Array} npcs - NPC数组
     * @returns {Array} - 与玩家碰撞的NPC数组
     */
    static checkPlayerNpcCollisions(player, npcs) {
        if (!player || !npcs || npcs.length === 0) {
            return [];
        }
        
        return npcs.filter(npc => 
            this.checkCircleCollision(player, npc)
        );
    }
    
    /**
     * 计算最近的非碰撞位置
     * @param {Object} player - 玩家对象
     * @param {number} targetX - 目标X坐标
     * @param {number} targetY - 目标Y坐标
     * @param {Array} obstacles - 障碍物数组（怪物、玩家等）
     * @returns {Object} - 最近的非碰撞位置 {x, y}
     */
    static findNearestNonCollidingPosition(player, targetX, targetY, obstacles) {
        // 如果碰撞检测被禁用，直接返回目标位置
        if (!this.isCollisionEnabled) {
            return { x: targetX, y: targetY };
        }
        
        if (!obstacles || obstacles.length === 0) {
            return { x: targetX, y: targetY };
        }
        
        // 获取玩家当前位置
        const startX = player.position_x || player.x || 0;
        const startY = player.position_y || player.y || 0;
        
        // 玩家半径
        const playerRadius = player.radius || 30; // 默认半径改为30像素
        
        // 计算移动方向向量
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离为0，直接返回当前位置
        if (distance === 0) {
            return { x: startX, y: startY };
        }
        
        // 归一化方向向量
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // 初始化最近非碰撞位置为目标位置
        let nearestX = targetX;
        let nearestY = targetY;
        let minDistanceToTarget = 0;
        
        // 检查每个障碍物
        for (const obstacle of obstacles) {
            // 获取障碍物位置
            const obstacleX = obstacle.position_x || obstacle.x || 0;
            const obstacleY = obstacle.position_y || obstacle.y || 0;
            
            // 障碍物半径
            const obstacleRadius = obstacle.radius || 30; // 默认半径改为30像素
            
            // 计算安全距离（两个半径之和）
            const safeDistance = playerRadius + obstacleRadius;
            
            // 计算障碍物到移动线段的最近点
            // 参考：https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
            
            // 计算线段长度的平方
            const segmentLengthSquared = distance * distance;
            
            // 计算障碍物到起点的向量
            const obstacleToStartX = obstacleX - startX;
            const obstacleToStartY = obstacleY - startY;
            
            // 计算投影比例
            const t = Math.max(0, Math.min(1, (obstacleToStartX * dx + obstacleToStartY * dy) / segmentLengthSquared));
            
            // 计算线段上最近点
            const projectionX = startX + t * dx;
            const projectionY = startY + t * dy;
            
            // 计算障碍物到最近点的距离
            const distToLineX = obstacleX - projectionX;
            const distToLineY = obstacleY - projectionY;
            const distToLine = Math.sqrt(distToLineX * distToLineX + distToLineY * distToLineY);
            
            // 如果距离小于安全距离，需要调整位置
            if (distToLine < safeDistance) {
                // 计算从障碍物到线段的单位向量
                let unitX = 0;
                let unitY = 0;
                
                if (distToLine > 0) {
                    unitX = distToLineX / distToLine;
                    unitY = distToLineY / distToLine;
                } else {
                    // 如果距离为0，使用垂直于移动方向的向量
                    unitX = -dirY;
                    unitY = dirX;
                }
                
                // 计算调整后的位置
                const adjustedX = projectionX - unitX * safeDistance;
                const adjustedY = projectionY - unitY * safeDistance;
                
                // 计算调整后位置到目标位置的距离
                const distToTargetX = adjustedX - targetX;
                const distToTargetY = adjustedY - targetY;
                const distToTarget = Math.sqrt(distToTargetX * distToTargetX + distToTargetY * distToTargetY);
                
                // 如果这是第一个障碍物或距离目标更近，更新最近非碰撞位置
                if (minDistanceToTarget === 0 || distToTarget < minDistanceToTarget) {
                    nearestX = adjustedX;
                    nearestY = adjustedY;
                    minDistanceToTarget = distToTarget;
                }
            }
        }
        
        // 返回最近的非碰撞位置
        return { x: nearestX, y: nearestY };
    }
    
    /**
     * 检查位置是否与任何障碍物碰撞
     * @param {Object} player - 玩家对象
     * @param {number} x - 要检查的X坐标
     * @param {number} y - 要检查的Y坐标
     * @param {Array} obstacles - 障碍物数组
     * @returns {boolean} - 如果有碰撞返回true，否则返回false
     */
    static isPositionColliding(player, x, y, obstacles) {
        // 如果碰撞检测被禁用，直接返回false
        if (!this.isCollisionEnabled) {
            return false;
        }

        if (!obstacles || obstacles.length === 0) {
            return false;
        }
        
        // 创建临时玩家对象用于碰撞检测
        const tempPlayer = {
            ...player,
            position_x: x,
            position_y: y
        };
        
        // 检查是否与任何障碍物碰撞
        for (const obstacle of obstacles) {
            if (this.checkCircleCollision(tempPlayer, obstacle)) {
                return true;
            }
        }
        
        return false;
    }
}

export default CollisionService; 