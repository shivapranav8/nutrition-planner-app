import axios from 'axios';

// Determine API base URL
// In production (Vercel), use relative path /api
// In development, use localhost
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're running on localhost (development)
  // This is more reliable than checking env.DEV in Vercel builds
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '');
  
  // Also check Vite's environment variables as fallback
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (isLocalhost && isDev) {
    return 'http://localhost:3001/api';
  }
  
  // Production: use relative path (works with Vercel)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface UserData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goal: string;
}

export interface Targets {
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  description?: string;
}

export interface LogEntry {
  id: string;
  item: MenuItem;
  timestamp: string;
}

export interface MealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description: string;
  category: string;
  complements?: MealSuggestion[];
  macroStatus?: {
    proteinMet: boolean;
    carbsMet: boolean;
    fatsMet: boolean;
    proteinGap: number;
    carbsGap: number;
    fatsGap: number;
  };
}

// API Functions

// User Targets
export const getUserTargets = async (userId: string): Promise<Targets | null> => {
  try {
    const response = await api.get(`/user/${userId}/targets`);
    return response.data.targets;
  } catch (error) {
    console.error('Error fetching user targets:', error);
    return null;
  }
};

export const saveUserTargets = async (userId: string, targets: Targets): Promise<boolean> => {
  try {
    await api.post(`/user/${userId}/targets`, { targets });
    return true;
  } catch (error) {
    console.error('Error saving user targets:', error);
    return false;
  }
};

// Helper function to get API keys from localStorage
const getApiKeys = () => {
  try {
    const stored = localStorage.getItem('apiKeys');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading API keys:', error);
  }
  return {};
};

// Meal Suggestions
export const getMealSuggestions = async (
  userProfile: UserData,
  remainingCalories: number,
  macros: { protein: number; carbs: number; fats: number },
  preferences?: string
): Promise<MealSuggestion[]> => {
  try {
    const apiKeys = getApiKeys();
    const response = await api.post('/suggestions', {
      userProfile,
      remainingCalories,
      macros,
      preferences,
      apiKeys,
    });
    return response.data.suggestions;
  } catch (error) {
    console.error('Error getting meal suggestions:', error);
    return [];
  }
};

// Meal Analysis
export const analyzeMeal = async (mealDescription: string): Promise<MenuItem | null> => {
  try {
    const apiKeys = getApiKeys();
    const response = await api.post('/analyze-meal', {
      mealDescription,
      apiKeys,
    });
    const analysis = response.data.analysis;
    
    return {
      id: `analyzed-${Date.now()}`,
      name: analysis.description || mealDescription,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fats: analysis.fats,
      category: analysis.category,
      description: analysis.description,
    };
  } catch (error) {
    console.error('Error analyzing meal:', error);
    return null;
  }
};

// Parse menu text using AI
export const parseMenuWithAI = async (
  menuText: string,
  userProfile: UserData,
  remainingCalories: number,
  macros: { protein: number; carbs: number; fats: number },
  preferences?: string
): Promise<MenuItem[]> => {
  try {
    const apiKeys = getApiKeys();
    // Try the main AI parsing endpoint first
    const response = await api.post('/parse-menu', {
      menuText,
      userProfile,
      remainingCalories,
      macros,
      preferences,
      apiKeys,
    });
    
    // Convert parsed items to MenuItem format
    return response.data.items.map((item: any, index: number) => ({
      id: `ai-parsed-${index}`,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      category: item.category,
      description: item.description,
    }));
  } catch (error) {
    console.error('Error parsing menu with AI:', error);
    
    // Fallback to test parsing endpoint
    try {
      console.log('Falling back to test parsing...');
      const response = await api.post('/test-parse', {
        menuText,
      });
      
      return response.data.items.map((item: any, index: number) => ({
        id: `fallback-parsed-${index}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
        category: item.category,
        description: item.description,
      }));
    } catch (fallbackError) {
      console.error('Fallback parsing also failed:', fallbackError);
      return [];
    }
  }
};

// Get 3 meal suggestions based on user text
export const getTextBasedMealSuggestions = async (
  userText: string,
  userProfile: UserData,
  remainingCalories: number,
  macros: { protein: number; carbs: number; fats: number }
): Promise<MealSuggestion[]> => {
  try {
    const apiKeys = getApiKeys();
    const response = await api.post('/suggest-meals', {
      userText,
      userProfile,
      remainingCalories,
      macros,
      apiKeys,
    });
    return response.data.suggestions;
  } catch (error) {
    console.error('Error getting text-based meal suggestions:', error);
    return [];
  }
};

// Meal Logs
export const getUserLogs = async (userId: string): Promise<LogEntry[]> => {
  try {
    const response = await api.get(`/user/${userId}/logs`);
    return response.data.logs;
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return [];
  }
};

export const saveMealLog = async (userId: string, meal: MenuItem): Promise<LogEntry | null> => {
  try {
    const response = await api.post(`/user/${userId}/logs`, { meal });
    return response.data.logEntry;
  } catch (error) {
    console.error('Error saving meal log:', error);
    return null;
  }
};

export const deleteMealLog = async (userId: string, logId: string): Promise<boolean> => {
  try {
    await api.delete(`/user/${userId}/logs/${logId}`);
    return true;
  } catch (error) {
    console.error('Error deleting meal log:', error);
    return false;
  }
};

// Generate day plans with breakfast/lunch/dinner using AI
export const generateDayPlans = async (
  menuItems: MenuItem[],
  userProfile: UserData,
  remainingCalories: number,
  macros: { protein: number; carbs: number; fats: number }
): Promise<any[]> => {
  try {
    const apiKeys = getApiKeys();
    const response = await api.post('/generate-day-plans', {
      menuItems,
      userProfile,
      remainingCalories,
      macros,
      apiKeys,
    });
    return response.data.dayPlans || [];
  } catch (error: any) {
    console.error('Error generating day plans:', error);
    console.error('Error response:', error?.response?.data);
    // Re-throw to let the component handle it
    throw error;
  }
};

// Health check
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'OK';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export default api;
