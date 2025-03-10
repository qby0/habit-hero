import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
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
        completeHabit
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}; 