import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';
import { useTranslation } from 'react-i18next';

export const AchievementContext = createContext();

export const AchievementProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Функция для загрузки достижений пользователя
  const fetchAchievements = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/achievements`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAchievements(response.data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем достижения при изменении токена
  useEffect(() => {
    if (token) {
      fetchAchievements();
    }
  }, [token]);
  
  // Функция для получения разблокированных достижений
  const getUnlockedAchievements = () => {
    return achievements.filter(achievement => achievement.unlocked);
  };
  
  // Функция для получения заблокированных достижений
  const getLockedAchievements = () => {
    return achievements.filter(achievement => !achievement.unlocked);
  };
  
  // Функция для получения достижений по категории
  const getAchievementsByCategory = (category) => {
    if (category === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => achievement.category === category);
  };
  
  return (
    <AchievementContext.Provider
      value={{
        achievements,
        loading,
        error,
        fetchAchievements,
        getUnlockedAchievements,
        getLockedAchievements,
        getAchievementsByCategory
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}; 