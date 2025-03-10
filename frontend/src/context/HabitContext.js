import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [publicHabits, setPublicHabits] = useState([]);
  const [publicHabit, setPublicHabit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, updateUserData } = useContext(AuthContext);

  // Get all habits
  const getHabits = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.get('/api/habits');
      
      if (res.data.success) {
        setHabits(res.data.habits);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch habits');
      toast.error(err.response?.data?.message || 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create a new habit
  const createHabit = async (habitData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post('/api/habits', habitData);
      
      if (res.data.success) {
        setHabits([res.data.habit, ...habits]);
        toast.success('Habit created successfully!');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create habit');
      toast.error(err.response?.data?.message || 'Failed to create habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get a single habit
  const getHabit = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return null;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.get(`/api/habits/${id}`);
      
      if (res.data.success) {
        return res.data.habit;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch habit');
      toast.error(err.response?.data?.message || 'Failed to fetch habit');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a habit
  const updateHabit = async (id, habitData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.put(`/api/habits/${id}`, habitData);
      
      if (res.data.success) {
        setHabits(habits.map(habit => 
          habit._id === id ? res.data.habit : habit
        ));
        toast.success('Habit updated successfully!');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update habit');
      toast.error(err.response?.data?.message || 'Failed to update habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a habit
  const deleteHabit = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.delete(`/api/habits/${id}`);
      
      if (res.data.success) {
        setHabits(habits.filter(habit => habit._id !== id));
        toast.success('Habit deleted successfully!');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete habit');
      toast.error(err.response?.data?.message || 'Failed to delete habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Complete a habit
  const completeHabit = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post(`/api/habits/${id}/complete`);
      
      if (res.data.success) {
        // Update habits list
        setHabits(habits.map(habit => 
          habit._id === id ? res.data.habit : habit
        ));
        
        // Update user data (experience, level, etc.)
        updateUserData(res.data.user);
        
        // Show level up notification if user leveled up
        if (res.data.leveledUp) {
          toast.success(`🎉 Level Up! You are now level ${res.data.user.level}!`, {
            autoClose: 5000,
            className: 'level-up-toast'
          });
        } else {
          toast.success('Habit completed! +XP');
        }
        
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete habit');
      toast.error(err.response?.data?.message || 'Failed to complete habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Workshop functions

  // Get all public habits
  const getPublicHabits = useCallback(async (sort = 'newest', category = 'all', search = '') => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.get(`/api/habits/workshop?sort=${sort}&category=${category}&search=${search}`);
      
      if (res.data.success) {
        setPublicHabits(res.data.habits);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch public habits');
      toast.error(err.response?.data?.message || 'Failed to fetch public habits');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get a single public habit
  const getPublicHabit = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.get(`/api/habits/workshop/${id}`);
      
      if (res.data.success) {
        setPublicHabit(res.data.habit);
        return res.data.habit;
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post(`/api/habits/${id}/rate`, { rating });
      
      if (res.data.success) {
        // Update the public habit if it's currently viewed
        if (publicHabit && publicHabit._id === id) {
          setPublicHabit({
            ...publicHabit,
            avgRating: res.data.avgRating,
            totalRatings: res.data.totalRatings
          });
        }
        
        // Update the public habits list if it contains this habit
        setPublicHabits(publicHabits.map(habit => 
          habit._id === id 
            ? { 
                ...habit, 
                avgRating: res.data.avgRating, 
                totalRatings: res.data.totalRatings 
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post(`/api/habits/${id}/comment`, { text });
      
      if (res.data.success) {
        // Update the public habit if it's currently viewed
        if (publicHabit && publicHabit._id === id) {
          setPublicHabit({
            ...publicHabit,
            comments: [...publicHabit.comments, res.data.comment]
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.post(`/api/habits/${id}/import`);
      
      if (res.data.success) {
        // Add the imported habit to user's habits
        setHabits([res.data.habit, ...habits]);
        
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
      setError(err.response?.data?.message || 'Failed to import habit');
      toast.error(err.response?.data?.message || 'Failed to import habit');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load habits when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getHabits();
    }
  }, [isAuthenticated, getHabits]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        loading,
        error,
        getHabits,
        getHabit,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
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