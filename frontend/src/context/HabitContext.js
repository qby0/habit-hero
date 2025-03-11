import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';
import { useTranslation } from 'react-i18next';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [habits, setHabits] = useState([]);
  const [publicHabits, setPublicHabits] = useState([]);
  const [publicHabit, setPublicHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    streak: 0,
    longestStreak: 0,
    completionRate: 0
  });

  // Функция для загрузки привычек пользователя
  const fetchHabits = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/habits`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setHabits(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Загружаем привычки при изменении токена
  useEffect(() => {
    if (token) {
      fetchHabits();
    }
  }, [token, fetchHabits]);

  // Функция для расчета статистики
  const calculateStats = (habitsList) => {
    if (!habitsList || habitsList.length === 0) {
      setStats({
        totalHabits: 0,
        completedToday: 0,
        streak: 0,
        longestStreak: 0,
        completionRate: 0
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Подсчитываем количество привычек, выполненных сегодня
    const completedToday = habitsList.filter(habit => {
      if (habit.completionHistory && habit.completionHistory.length > 0) {
        const lastEntry = habit.completionHistory[habit.completionHistory.length - 1];
        const entryDate = new Date(lastEntry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        // Для обычных привычек проверяем, что привычка выполнена
        // Для негативных привычек проверяем, что пользователь воздержался (completed = false)
        if (habit.isNegative) {
          return entryDate.getTime() === today.getTime() && !lastEntry.completed;
        } else {
          return entryDate.getTime() === today.getTime() && lastEntry.completed;
        }
      }
      return false;
    }).length;

    // Находим максимальную серию и текущую серию
    let maxStreak = 0;
    let currentStreak = 0;
    
    // Подсчитываем общее количество дней выполнения
    let totalCompletions = 0;
    let totalDays = 0;

    habitsList.forEach(habit => {
      if (habit.streak > currentStreak) {
        currentStreak = habit.streak;
      }
      if (habit.longestStreak > maxStreak) {
        maxStreak = habit.longestStreak;
      }
      
      if (habit.completionHistory) {
        // Для негативных привычек считаем дни воздержания
        if (habit.isNegative) {
          totalCompletions += habit.completionHistory.filter(entry => !entry.completed).length;
        } else {
          totalCompletions += habit.completionHistory.filter(entry => entry.completed).length;
        }
        totalDays += habit.completionHistory.length;
      }
    });

    // Рассчитываем процент выполнения
    const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;

    setStats({
      totalHabits: habitsList.length,
      completedToday,
      streak: currentStreak,
      longestStreak: maxStreak,
      completionRate
    });
  };

  // Функция для создания новой привычки
  const createHabit = async (habitData) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await axios.post(
        `${API_URL}/api/habits`,
        habitData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Добавляем новую привычку в список
      setHabits(prevHabits => {
        const updatedHabits = [...prevHabits, response.data];
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      return { success: true, habit: response.data };
    } catch (error) {
      console.error('Error creating habit:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create habit' 
      };
    }
  };

  // Функция для обновления привычки
  const updateHabit = async (habitId, habitData) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await axios.put(
        `${API_URL}/api/habits/${habitId}`,
        habitData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Обновляем привычку в списке
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.map(habit => 
          habit._id === habitId ? response.data : habit
        );
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      return { success: true, habit: response.data };
    } catch (error) {
      console.error('Error updating habit:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update habit' 
      };
    }
  };

  // Функция для удаления привычки
  const deleteHabit = async (habitId) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      await axios.delete(`${API_URL}/api/habits/${habitId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Удаляем привычку из списка
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.filter(habit => habit._id !== habitId);
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete habit' 
      };
    }
  };

  // Функция для выполнения привычки
  const completeHabit = async (habitId) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await axios.post(
        `${API_URL}/api/habits/${habitId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Обновляем привычку в списке
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.map(habit => 
          habit._id === habitId ? response.data : habit
        );
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      // Проверяем, разблокировано ли достижение
      if (response.data.achievementUnlocked) {
        toast.success(t('achievements.unlocked', { name: response.data.achievementUnlocked.name }));
      }

      return { success: true, habit: response.data };
    } catch (error) {
      console.error('Error completing habit:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to complete habit' 
      };
    }
  };
  
  // Функция для отметки воздержания от негативной привычки
  const markAbstained = async (habitId) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await axios.post(
        `${API_URL}/api/habits/${habitId}/abstain`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Обновляем привычку в списке
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.map(habit => 
          habit._id === habitId ? response.data : habit
        );
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      // Проверяем, разблокировано ли достижение
      if (response.data.achievementUnlocked) {
        toast.success(t('achievements.unlocked', { name: response.data.achievementUnlocked.name }));
      }

      return { success: true, habit: response.data };
    } catch (error) {
      console.error('Error marking abstained:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to mark abstained' 
      };
    }
  };
  
  // Функция для отметки срыва негативной привычки
  const markFailed = async (habitId) => {
    if (!token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await axios.post(
        `${API_URL}/api/habits/${habitId}/fail`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Обновляем привычку в списке
      setHabits(prevHabits => {
        const updatedHabits = prevHabits.map(habit => 
          habit._id === habitId ? response.data : habit
        );
        calculateStats(updatedHabits);
        return updatedHabits;
      });

      return { success: true, habit: response.data };
    } catch (error) {
      console.error('Error marking failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to mark failed' 
      };
    }
  };

  // Функция для получения привычки по ID
  const getHabitById = (habitId) => {
    return habits.find(habit => habit._id === habitId);
  };

  // Функция для фильтрации привычек по категории
  const getHabitsByCategory = (category) => {
    return habits.filter(habit => habit.category === category);
  };
  
  // Функция для получения позитивных привычек
  const getPositiveHabits = () => {
    return habits.filter(habit => !habit.isNegative);
  };
  
  // Функция для получения негативных привычек
  const getNegativeHabits = () => {
    return habits.filter(habit => habit.isNegative);
  };

  // Workshop functions

  // Get all public habits
  const getPublicHabits = useCallback(async (sort = 'newest', category = 'all', search = '') => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/habits/workshop?sort=${sort}&category=${category}&search=${search}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setPublicHabits(response.data.habits);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch public habits');
      toast.error(err.response?.data?.message || 'Failed to fetch public habits');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get a single public habit
  const getPublicHabit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/habits/workshop/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setPublicHabit(response.data.habit);
        return response.data.habit;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch public habit');
      toast.error(err.response?.data?.message || 'Failed to fetch public habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Rate a public habit
  const rateHabit = async (id, rating) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/habits/${id}/rate`, { rating }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update the public habit if it's currently viewed
        if (publicHabit && publicHabit._id === id) {
          setPublicHabit({
            ...publicHabit,
            avgRating: response.data.avgRating,
            totalRatings: response.data.totalRatings
          });
        }
        
        // Update the public habits list if it contains this habit
        setPublicHabits(publicHabits.map(habit => 
          habit._id === id 
            ? { 
                ...habit, 
                avgRating: response.data.avgRating, 
                totalRatings: response.data.totalRatings 
              } 
            : habit
        ));
        
        toast.success('Rating submitted successfully');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rate habit');
      toast.error(err.response?.data?.message || 'Failed to rate habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Comment on a public habit
  const commentHabit = async (id, text) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/habits/${id}/comment`, { text }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update the public habit if it's currently viewed
        if (publicHabit && publicHabit._id === id) {
          setPublicHabit({
            ...publicHabit,
            comments: [...publicHabit.comments, response.data.comment]
          });
        }
        
        toast.success('Comment added successfully');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to comment on habit');
      toast.error(err.response?.data?.message || 'Failed to comment on habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Import a public habit
  const importHabit = async (id) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/habits/${id}/import`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Add the imported habit to user's habits
        setHabits(prevHabits => {
          const updatedHabits = [...prevHabits, response.data.habit];
          calculateStats(updatedHabits);
          return updatedHabits;
        });
        
        // Update the public habit downloads count if it's currently viewed
        if (publicHabit && publicHabit._id === id) {
          setPublicHabit({
            ...publicHabit,
            downloads: publicHabit.downloads + 1
          });
        }
        
        // Update the public habits list if it contains this habit
        setPublicHabits(publicHabits.map(habit => 
          habit._id === id 
            ? { ...habit, downloads: habit.downloads + 1 } 
            : habit
        ));
        
        toast.success('Habit imported successfully');
        return true;
      }
    } catch (err) {
      if (err.response?.data?.alreadyImported) {
        toast.info(err.response.data.message || 'You have already imported this habit');
        return 'already_imported';
      }
      
      setError(err.response?.data?.message || 'Failed to import habit');
      toast.error(err.response?.data?.message || 'Failed to import habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        loading,
        error,
        stats,
        fetchHabits,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        markAbstained,
        markFailed,
        getHabitById,
        getHabitsByCategory,
        getPositiveHabits,
        getNegativeHabits,
        publicHabits,
        publicHabit,
        getPublicHabits,
        getPublicHabit,
        rateHabit,
        commentHabit,
        importHabit
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}; 