import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';
import { useTranslation } from 'react-i18next';

export const WorkshopContext = createContext();

export const WorkshopProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [publicHabits, setPublicHabits] = useState([]);
  const [currentHabit, setCurrentHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Функция для загрузки публичных привычек
  const fetchPublicHabits = async (sort = 'newest', category = 'all', search = '') => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/habits/workshop`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          sort,
          category,
          search
        }
      });
      
      setPublicHabits(response.data || []);
    } catch (error) {
      console.error('Error fetching public habits:', error);
      setError('Failed to load public habits');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для загрузки деталей публичной привычки
  const fetchPublicHabitDetails = async (habitId) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/habits/workshop/${habitId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCurrentHabit(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching public habit details:', error);
      setError('Failed to load habit details');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для оценки привычки
  const rateHabit = async (habitId, rating) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/habits/workshop/${habitId}/rate`,
        { rating },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Обновляем текущую привычку, если она открыта
      if (currentHabit && currentHabit._id === habitId) {
        setCurrentHabit({
          ...currentHabit,
          avgRating: response.data.avgRating,
          totalRatings: response.data.totalRatings,
          userRating: rating
        });
      }
      
      // Обновляем привычку в списке публичных привычек
      setPublicHabits(prevHabits => 
        prevHabits.map(habit => 
          habit._id === habitId 
            ? {
                ...habit,
                avgRating: response.data.avgRating,
                totalRatings: response.data.totalRatings,
                userRating: rating
              }
            : habit
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error rating habit:', error);
      return false;
    }
  };
  
  // Функция для добавления комментария к привычке
  const commentHabit = async (habitId, text) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/habits/workshop/${habitId}/comment`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Обновляем текущую привычку, если она открыта
      if (currentHabit && currentHabit._id === habitId) {
        setCurrentHabit({
          ...currentHabit,
          comments: [...currentHabit.comments, response.data.comment]
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error commenting habit:', error);
      return false;
    }
  };
  
  // Функция для импорта привычки
  const importHabit = async (habitId) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/habits/workshop/${habitId}/import`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Обновляем текущую привычку, если она открыта
      if (currentHabit && currentHabit._id === habitId) {
        setCurrentHabit({
          ...currentHabit,
          downloads: currentHabit.downloads + 1
        });
      }
      
      // Обновляем привычку в списке публичных привычек
      setPublicHabits(prevHabits => 
        prevHabits.map(habit => 
          habit._id === habitId 
            ? { ...habit, downloads: habit.downloads + 1 }
            : habit
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error importing habit:', error);
      return false;
    }
  };
  
  // Функция для публикации привычки
  const publishHabit = async (habitId) => {
    if (!token) return false;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/habits/${habitId}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error publishing habit:', error);
      return false;
    }
  };
  
  return (
    <WorkshopContext.Provider
      value={{
        publicHabits,
        currentHabit,
        loading,
        error,
        fetchPublicHabits,
        fetchPublicHabitDetails,
        rateHabit,
        commentHabit,
        importHabit,
        publishHabit
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
}; 