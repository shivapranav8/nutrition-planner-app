import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserData, Targets, LogEntry, MenuItem, MealSuggestion } from '../services/api';
import * as api from '../services/api';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface ApiKeys {
  openai?: string;
  anthropic?: string;
}

interface UserContextType {
  // User data
  userData: UserData | null;
  targets: Targets | null;
  loggedItems: LogEntry[];
  userId: string;
  authenticatedUser: AuthenticatedUser | null;
  apiKeys: ApiKeys | null;
  
  // Loading states
  isLoading: boolean;
  isServerConnected: boolean;
  
  // Actions
  setUserData: (data: UserData) => void;
  setTargets: (targets: Targets) => void;
  setAuthenticatedUser: (user: AuthenticatedUser | null) => void;
  setApiKeys: (keys: ApiKeys) => void;
  saveApiKeys: (keys: ApiKeys) => Promise<void>;
  addLoggedItem: (item: MenuItem) => Promise<void>;
  removeLoggedItem: (logId: string) => Promise<void>;
  getMealSuggestions: (remainingCalories: number, macros: { protein: number; carbs: number; fats: number }, preferences?: string) => Promise<MealSuggestion[]>;
  getTextBasedMealSuggestions: (userText: string, remainingCalories: number, macros: { protein: number; carbs: number; fats: number }) => Promise<MealSuggestion[]>;
  parseMenuWithAI: (menuText: string, remainingCalories: number, macros: { protein: number; carbs: number; fats: number }, preferences?: string) => Promise<MenuItem[]>;
  analyzeMeal: (mealDescription: string) => Promise<MenuItem | null>;
  saveUserData: () => Promise<void>;
  loadUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [targets, setTargetsState] = useState<Targets | null>(null);
  const [loggedItems, setLoggedItems] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [authenticatedUser, setAuthenticatedUserState] = useState<AuthenticatedUser | null>(null);
  const [apiKeys, setApiKeysState] = useState<ApiKeys | null>(null);
  
  // Use authenticated user ID if available, otherwise generate a temporary one
  const userId = authenticatedUser?.id || 'user-' + Math.random().toString(36).substr(2, 9);

  // Check server connection on mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
    loadApiKeys();
  }, []);

  // Load API keys from localStorage
  const loadApiKeys = () => {
    try {
      const stored = localStorage.getItem('apiKeys');
      if (stored) {
        const keys = JSON.parse(stored);
        setApiKeysState(keys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const setApiKeys = (keys: ApiKeys) => {
    setApiKeysState(keys);
  };

  const saveApiKeys = async (keys: ApiKeys) => {
    try {
      localStorage.setItem('apiKeys', JSON.stringify(keys));
      setApiKeysState(keys);
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  };

  const checkServerConnection = async () => {
    const isConnected = await api.checkServerHealth();
    setIsServerConnected(isConnected);
  };

  const setUserData = (data: UserData) => {
    setUserDataState(data);
  };

  const setTargets = (targets: Targets) => {
    setTargetsState(targets);
  };

  const setAuthenticatedUser = (user: AuthenticatedUser | null) => {
    setAuthenticatedUserState(user);
    // Reload user data when authentication changes
    if (user) {
      loadUserData();
    }
  };

  const addLoggedItem = async (item: MenuItem) => {
    try {
      setIsLoading(true);
      const logEntry = await api.saveMealLog(userId, item);
      if (logEntry) {
        setLoggedItems(prev => [...prev, logEntry]);
      }
    } catch (error) {
      console.error('Error adding logged item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLoggedItem = async (logId: string) => {
    try {
      setIsLoading(true);
      const success = await api.deleteMealLog(userId, logId);
      if (success) {
        setLoggedItems(prev => prev.filter(item => item.id !== logId));
      }
    } catch (error) {
      console.error('Error removing logged item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMealSuggestions = async (
    remainingCalories: number,
    macros: { protein: number; carbs: number; fats: number },
    preferences?: string
  ): Promise<MealSuggestion[]> => {
    if (!userData) return [];
    
    try {
      setIsLoading(true);
      const suggestions = await api.getMealSuggestions(userData, remainingCalories, macros, preferences);
      return suggestions;
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getTextBasedMealSuggestions = async (
    userText: string,
    remainingCalories: number,
    macros: { protein: number; carbs: number; fats: number }
  ): Promise<MealSuggestion[]> => {
    if (!userData) return [];
    
    try {
      setIsLoading(true);
      const suggestions = await api.getTextBasedMealSuggestions(userText, userData, remainingCalories, macros);
      return suggestions;
    } catch (error) {
      console.error('Error getting text-based meal suggestions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const parseMenuWithAI = async (
    menuText: string,
    remainingCalories: number,
    macros: { protein: number; carbs: number; fats: number },
    preferences?: string
  ): Promise<MenuItem[]> => {
    if (!userData) return [];
    
    try {
      setIsLoading(true);
      const items = await api.parseMenuWithAI(menuText, userData, remainingCalories, macros, preferences);
      return items;
    } catch (error) {
      console.error('Error parsing menu with AI:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMeal = async (mealDescription: string): Promise<MenuItem | null> => {
    try {
      setIsLoading(true);
      const analyzedMeal = await api.analyzeMeal(mealDescription);
      return analyzedMeal;
    } catch (error) {
      console.error('Error analyzing meal:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    if (!targets) return;
    
    try {
      setIsLoading(true);
      const success = await api.saveUserTargets(userId, targets);
      if (success) {
        console.log('User data saved successfully');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load targets
      const savedTargets = await api.getUserTargets(userId);
      if (savedTargets) {
        setTargetsState(savedTargets);
      }
      
      // Load logs
      const savedLogs = await api.getUserLogs(userId);
      setLoggedItems(savedLogs);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserContextType = {
    userData,
    targets,
    loggedItems,
    userId,
    authenticatedUser,
    apiKeys,
    isLoading,
    isServerConnected,
    setUserData,
    setTargets,
    setAuthenticatedUser,
    setApiKeys,
    saveApiKeys,
    addLoggedItem,
    removeLoggedItem,
    getMealSuggestions,
    getTextBasedMealSuggestions,
    parseMenuWithAI,
    analyzeMeal,
    saveUserData,
    loadUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
