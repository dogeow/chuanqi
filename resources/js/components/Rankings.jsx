import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/rankings.css';

const Rankings = () => {
    const [rankings, setRankings] = useState([]);
    const [userRanking, setUserRanking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('level');

    // 获取排行榜数据
    const fetchRankings = async (type) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/rankings?type=${type}`);
            if (response.data.success) {
                setRankings(response.data.rankings);
            }
        } catch (error) {
            console.error('获取排行榜数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 获取用户排名
    const fetchUserRanking = async () => {
        try {
            const response = await axios.get('/api/rankings/user');
            if (response.data.success) {
                setUserRanking(response.data);
            }
        } catch (error) {
            console.error('获取用户排名失败:', error);
        }
    };

    // 切换标签时获取对应排行榜数据
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        fetchRankings(tab);
    };

    // 初始加载
    useEffect(() => {
        fetchRankings(activeTab);
        fetchUserRanking();
    }, []);

    // 渲染排行榜表格
    const renderRankingTable = () => {
        if (loading) {
            return (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>加载排行榜数据中...</p>
                </div>
            );
        }

        // 根据不同类型显示不同列
        const renderColumns = () => {
            switch (activeTab) {
                case 'level':
                    return (
                        <>
                            <th>等级</th>
                            <th>经验</th>
                        </>
                    );
                case 'gold':
                    return <th>金币</th>;
                case 'attack':
                    return <th>攻击力</th>;
                case 'defense':
                    return <th>防御力</th>;
                default:
                    return <th>等级</th>;
            }
        };

        // 根据不同类型显示不同数据
        const renderData = (item) => {
            switch (activeTab) {
                case 'level':
                    return (
                        <>
                            <td>{item.level}</td>
                            <td>{item.exp}</td>
                        </>
                    );
                case 'gold':
                    return <td>{item.gold}</td>;
                case 'attack':
                    return <td>{item.attack}</td>;
                case 'defense':
                    return <td>{item.defense}</td>;
                default:
                    return <td>{item.level}</td>;
            }
        };

        return (
            <table className="rankings-table">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>角色名</th>
                        {renderColumns()}
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((item) => (
                        <tr key={item.id} className={userRanking?.character?.id === item.id ? 'highlight-row' : ''}>
                            <td>
                                {item.rank <= 3 ? (
                                    <span className={`rank-badge rank-${item.rank}`}>
                                        {item.rank}
                                    </span>
                                ) : (
                                    item.rank
                                )}
                            </td>
                            <td>{item.name}</td>
                            {renderData(item)}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // 渲染用户排名信息
    const renderUserRanking = () => {
        if (!userRanking) return null;

        return (
            <div className="user-ranking-card">
                <div className="user-ranking-header">我的排名</div>
                <div className="user-ranking-body">
                    <div className="user-ranking-stats">
                        <div className="user-ranking-stat">
                            <strong>等级排名:</strong> {userRanking.rankings.level}
                        </div>
                        <div className="user-ranking-stat">
                            <strong>金币排名:</strong> {userRanking.rankings.gold}
                        </div>
                        <div className="user-ranking-stat">
                            <strong>攻击排名:</strong> {userRanking.rankings.attack}
                        </div>
                        <div className="user-ranking-stat">
                            <strong>防御排名:</strong> {userRanking.rankings.defense}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="rankings-container">
            <div className="rankings-card">
                <div className="rankings-header">
                    <h4>排行榜</h4>
                </div>
                <div className="rankings-body">
                    <div className="rankings-tabs">
                        <div 
                            className={`rankings-tab ${activeTab === 'level' ? 'active' : ''}`}
                            onClick={() => handleTabChange('level')}
                        >
                            等级排行
                        </div>
                        <div 
                            className={`rankings-tab ${activeTab === 'gold' ? 'active' : ''}`}
                            onClick={() => handleTabChange('gold')}
                        >
                            金币排行
                        </div>
                        <div 
                            className={`rankings-tab ${activeTab === 'attack' ? 'active' : ''}`}
                            onClick={() => handleTabChange('attack')}
                        >
                            攻击排行
                        </div>
                        <div 
                            className={`rankings-tab ${activeTab === 'defense' ? 'active' : ''}`}
                            onClick={() => handleTabChange('defense')}
                        >
                            防御排行
                        </div>
                    </div>
                    <div className="rankings-content">
                        {renderRankingTable()}
                    </div>
                    {renderUserRanking()}
                </div>
            </div>
        </div>
    );
};

export default Rankings;