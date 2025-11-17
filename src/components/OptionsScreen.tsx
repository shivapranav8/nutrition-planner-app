import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, TrendingUp, Utensils, ClipboardPaste, Sparkles, Check, Star, X, Circle, Coffee, Sun, Moon, CheckCircle2 } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { generateDayPlans as generateDayPlansAPI } from "../services/api";

interface MenuItem {
  id: string;
  name: string;
  quantity?: string; // e.g., "200g", "1 katori", "2 pieces", "250ml"
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner'; // Track which meal this item belongs to
}

interface OptionsScreenProps {
  dailyCalories: number;
  remainingCalories: number;
  macros: {
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fats: { consumed: number; target: number };
  };
  onSelectItem: (item: MenuItem) => void;
  selectedItems: MenuItem[];
}

type ItemPreference = "must-have" | "optional" | "not-necessary";

interface MealPlan {
  name: string;
  icon: any;
  items: MenuItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface DayPlan {
  id: string;
  name: string;
  breakfast: MealPlan;
  lunch: MealPlan;
  dinner: MealPlan;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

// Nutrition estimation based on common Indian foods
const estimateNutrition = (foodName: string): { calories: number; protein: number; carbs: number; fats: number; category: string } => {
  const name = foodName.toLowerCase();
  
  // Rice dishes
  if (name.includes('biryani')) return { calories: 450, protein: 12, carbs: 75, fats: 12, category: 'Main Course' };
  if (name.includes('pulao') || name.includes('pilaf')) return { calories: 380, protein: 10, carbs: 65, fats: 10, category: 'Main Course' };
  if (name.includes('fried rice')) return { calories: 400, protein: 8, carbs: 70, fats: 12, category: 'Main Course' };
  if (name.includes('jeera rice') || name.includes('plain rice')) return { calories: 200, protein: 4, carbs: 44, fats: 1, category: 'Main Course' };
  
  // Bread/Roti
  if (name.includes('naan')) return { calories: 260, protein: 8, carbs: 45, fats: 5, category: 'Bread' };
  if (name.includes('roti') || name.includes('chapati')) return { calories: 120, protein: 4, carbs: 22, fats: 2, category: 'Bread' };
  if (name.includes('paratha')) return { calories: 280, protein: 6, carbs: 38, fats: 12, category: 'Bread' };
  if (name.includes('puri') || name.includes('poori')) return { calories: 180, protein: 3, carbs: 20, fats: 10, category: 'Bread' };
  
  // Curries
  if (name.includes('chicken curry') || name.includes('chicken masala')) return { calories: 320, protein: 35, carbs: 12, fats: 18, category: 'Main Course' };
  if (name.includes('butter chicken')) return { calories: 400, protein: 30, carbs: 15, fats: 25, category: 'Main Course' };
  if (name.includes('paneer') && name.includes('butter')) return { calories: 380, protein: 18, carbs: 22, fats: 25, category: 'Main Course' };
  if (name.includes('paneer') && (name.includes('tikka') || name.includes('masala'))) return { calories: 320, protein: 20, carbs: 18, fats: 20, category: 'Main Course' };
  if (name.includes('chole') || name.includes('chana')) return { calories: 280, protein: 14, carbs: 42, fats: 8, category: 'Main Course' };
  if (name.includes('rajma')) return { calories: 250, protein: 15, carbs: 38, fats: 6, category: 'Main Course' };
  
  // Dal
  if (name.includes('dal') && name.includes('tadka')) return { calories: 180, protein: 12, carbs: 25, fats: 5, category: 'Main Course' };
  if (name.includes('dal')) return { calories: 150, protein: 10, carbs: 22, fats: 4, category: 'Main Course' };
  
  // South Indian
  if (name.includes('dosa')) return { calories: 200, protein: 6, carbs: 35, fats: 5, category: 'Breakfast' };
  if (name.includes('idli')) return { calories: 90, protein: 3, carbs: 17, fats: 1, category: 'Breakfast' };
  if (name.includes('vada')) return { calories: 150, protein: 4, carbs: 18, fats: 8, category: 'Breakfast' };
  if (name.includes('upma')) return { calories: 200, protein: 6, carbs: 32, fats: 6, category: 'Breakfast' };
  if (name.includes('uttapam')) return { calories: 220, protein: 7, carbs: 38, fats: 5, category: 'Breakfast' };
  
  // Sides
  if (name.includes('raita')) return { calories: 90, protein: 4, carbs: 8, fats: 5, category: 'Sides' };
  if (name.includes('salad')) return { calories: 80, protein: 3, carbs: 12, fats: 2, category: 'Sides' };
  if (name.includes('pickle') || name.includes('achar')) return { calories: 40, protein: 1, carbs: 6, fats: 2, category: 'Sides' };
  if (name.includes('papad')) return { calories: 50, protein: 2, carbs: 8, fats: 1, category: 'Sides' };
  
  // Snacks
  if (name.includes('samosa')) return { calories: 250, protein: 5, carbs: 30, fats: 13, category: 'Snacks' };
  if (name.includes('pakora') || name.includes('bhaji')) return { calories: 200, protein: 4, carbs: 22, fats: 12, category: 'Snacks' };
  if (name.includes('sandwich')) return { calories: 280, protein: 12, carbs: 40, fats: 8, category: 'Snacks' };
  
  // Desserts
  if (name.includes('gulab jamun')) return { calories: 150, protein: 3, carbs: 25, fats: 6, category: 'Dessert' };
  if (name.includes('kheer')) return { calories: 180, protein: 5, carbs: 28, fats: 6, category: 'Dessert' };
  if (name.includes('halwa')) return { calories: 200, protein: 3, carbs: 32, fats: 8, category: 'Dessert' };
  
  // Beverages
  if (name.includes('tea') || name.includes('chai')) return { calories: 60, protein: 2, carbs: 10, fats: 2, category: 'Beverage' };
  if (name.includes('coffee')) return { calories: 50, protein: 2, carbs: 8, fats: 2, category: 'Beverage' };
  if (name.includes('lassi')) return { calories: 150, protein: 6, carbs: 22, fats: 4, category: 'Beverage' };
  
  // Default fallback
  return { calories: 250, protein: 10, carbs: 35, fats: 8, category: 'Other' };
};

// Parse menu text into food items
const parseMenu = (text: string): MenuItem[] => {
  if (!text.trim()) return [];
  
  const lines = text.split('\n').filter(line => line.trim());
  const items: MenuItem[] = [];
  
  lines.forEach((line, index) => {
    // Remove common prefixes like numbers, bullets, dashes
    const cleaned = line.replace(/^[\d\.\-\*\•\→\➤\►\◆]+\s*/, '').trim();
    if (cleaned.length < 3) return; // Skip very short lines
    
    const nutrition = estimateNutrition(cleaned);
    items.push({
      id: `parsed-${index}`,
      name: cleaned,
      ...nutrition
    });
  });
  
  return items;
};

export function OptionsScreen({ dailyCalories, remainingCalories, macros, onSelectItem, selectedItems }: OptionsScreenProps) {
  const [menuText, setMenuText] = useState("");
  const [parsedItems, setParsedItems] = useState<MenuItem[]>([]);
  const [itemPreferences, setItemPreferences] = useState<Map<string, ItemPreference>>(new Map());
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategorization, setShowCategorization] = useState(false);
  // Selected meals: one per time slot (breakfast, lunch, dinner) from any option
  const [selectedMeals, setSelectedMeals] = useState<{
    breakfast: string | null;  // planId of selected breakfast (e.g., "plan-0")
    lunch: string | null;      // planId of selected lunch (e.g., "plan-1")
    dinner: string | null;      // planId of selected dinner (e.g., "plan-2")
  }>({ breakfast: null, lunch: null, dinner: null });
  const [aiSuggestions, setAiSuggestions] = useState<MenuItem[]>([]);
  const [aiSuggestionsFull, setAiSuggestionsFull] = useState<any[]>([]); // Store full suggestion data with complements
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingDayPlans, setIsGeneratingDayPlans] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [macroDeficitSuggestions, setMacroDeficitSuggestions] = useState<{
    protein: MenuItem[];
    carbs: MenuItem[];
    fats: MenuItem[];
    deficits: { protein: number; carbs: number; fats: number };
  } | null>(null);
  
  const { userData, getMealSuggestions, getTextBasedMealSuggestions, parseMenuWithAI } = useUser();

  const handleParseMenu = async () => {
    if (!userData) return;
    
    setIsLoadingAi(true);
    try {
      const items = await parseMenuWithAI(
        menuText,
        remainingCalories,
        {
          protein: macros.protein.target - macros.protein.consumed,
          carbs: macros.carbs.target - macros.carbs.consumed,
          fats: macros.fats.target - macros.fats.consumed,
        },
        textInput.trim() || undefined
      );
      
      setParsedItems(items);
      setShowCategorization(true);
      setShowSuggestions(false);
      setDayPlans([]);
      
      // Initialize all items as "optional" by default
      const newPreferences = new Map<string, ItemPreference>();
      items.forEach(item => {
        newPreferences.set(item.id, "optional");
      });
      setItemPreferences(newPreferences);
    } catch (error) {
      console.error('Error parsing menu with AI:', error);
      // Fallback to local parsing
      const items = parseMenu(menuText);
      setParsedItems(items);
      setShowCategorization(true);
      setShowSuggestions(false);
      setDayPlans([]);
      
      const newPreferences = new Map<string, ItemPreference>();
      items.forEach(item => {
        newPreferences.set(item.id, "optional");
      });
      setItemPreferences(newPreferences);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleGetAiSuggestions = async () => {
    if (!userData) {
      setErrorMessage("Please complete your profile first");
      return;
    }
    
    if (remainingCalories <= 0) {
      setErrorMessage("No remaining calories. Please log your meals first.");
      return;
    }
    
    setIsLoadingAi(true);
    setErrorMessage("");
    try {
      // Use text input as preferences, fallback to menu text if no text input
      const preferences = textInput.trim() || menuText.trim() || undefined;
      
      const remainingMacros = {
          protein: macros.protein.target - macros.protein.consumed,
          carbs: macros.carbs.target - macros.carbs.consumed,
          fats: macros.fats.target - macros.fats.consumed,
      };
      
      console.log('Getting AI suggestions with:', {
        remainingCalories,
        macros: remainingMacros,
        hasTextInput: !!textInput.trim(),
        hasMenuText: !!menuText.trim()
      });
      
      let suggestions;
      
      // Use text-based endpoint if there's text input, otherwise use general suggestions
      if (textInput.trim()) {
        console.log('Using text-based suggestions endpoint');
        suggestions = await getTextBasedMealSuggestions(
          textInput.trim(),
          remainingCalories,
          remainingMacros
        );
      } else {
        console.log('Using general suggestions endpoint');
        const allSuggestions = await getMealSuggestions(
          remainingCalories,
          remainingMacros,
        preferences
      );
        // Take first 3 suggestions
        suggestions = allSuggestions.slice(0, 3);
      }
      
      console.log('Received suggestions:', suggestions);
      
      if (!suggestions || suggestions.length === 0) {
        setErrorMessage("No suggestions received. Please try again or check your connection.");
        return;
      }
      
      // Store full suggestion data (with complements and macroStatus)
      setAiSuggestionsFull(suggestions);
      
      // Convert suggestions to MenuItem format for display
      const menuItems: MenuItem[] = suggestions
        .filter(suggestion => suggestion && suggestion.name) // Filter out undefined/null suggestions
        .map((suggestion, index) => ({
        id: `ai-suggestion-${index}`,
          name: suggestion.name || 'Unnamed Meal',
          calories: suggestion.calories || 0,
          protein: suggestion.protein || 0,
          carbs: suggestion.carbs || 0,
          fats: suggestion.fats || 0,
          category: suggestion.category || 'Meal',
        description: suggestion.description,
      }));
      
      setAiSuggestions(menuItems);
      setShowAiSuggestions(true);
      setShowCategorization(false);
      setShowSuggestions(false);
      setErrorMessage("");
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to get suggestions. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoadingAi(false);
    }
  };


  const setItemPreference = (itemId: string, preference: ItemPreference) => {
    setItemPreferences(prev => {
      const newMap = new Map(prev);
      newMap.set(itemId, preference);
      return newMap;
    });
  };

  // Helper function to select optimal items for a meal
  const selectMealItems = (
    availableItems: MenuItem[],
    calTarget: number,
    proteinTarget: number,
    carbsTarget: number,
    fatsTarget: number,
    excludeIds: Set<string> = new Set()
  ): MenuItem[] => {
    const selected: MenuItem[] = [];
    let totalCal = 0;

    // Filter out invalid items (undefined/null) and already used items
    const available = availableItems
      .filter(item => item && item.id) // Remove undefined/null items
      .filter(item => !excludeIds.has(item.id));

    // First add must-have items for this meal category
    const mustHaves = available.filter(item => itemPreferences.get(item.id) === "must-have");
    for (const item of mustHaves) {
      if (totalCal + item.calories <= calTarget * 1.1) {
        selected.push(item);
        totalCal += item.calories;
        excludeIds.add(item.id);
      }
    }

    // Score and add optional items
    const optional = available.filter(
      item => itemPreferences.get(item.id) !== "must-have" && !selected.includes(item)
    );

    const scoredItems = optional.map(item => {
      const calDiff = Math.abs((totalCal + item.calories) - calTarget);
      const proteinScore = proteinTarget > 0 ? item.protein / proteinTarget : 0;
      const carbsScore = carbsTarget > 0 ? item.carbs / carbsTarget : 0;
      const fatsScore = fatsTarget > 0 ? item.fats / fatsTarget : 0;
      
      const macroScore = (proteinScore + carbsScore + fatsScore) / 3;
      const calScore = 1 / (1 + calDiff / 100);
      const totalScore = macroScore * 0.7 + calScore * 0.3;

      return { ...item, score: totalScore };
    });

    scoredItems.sort((a, b) => b.score - a.score);

    for (const item of scoredItems) {
      if (totalCal >= calTarget * 0.9) break;
      if (totalCal + item.calories <= calTarget * 1.15) {
        selected.push(item);
        totalCal += item.calories;
        excludeIds.add(item.id);
      }
    }

    return selected;
  };

  const generateDayPlans = async () => {
    const remainingProtein = macros.protein.target - macros.protein.consumed;
    const remainingCarbs = macros.carbs.target - macros.carbs.consumed;
    const remainingFats = macros.fats.target - macros.fats.consumed;

    // Filter out invalid items first
    const validParsedItems = parsedItems.filter(item => item && item.id);

    if (validParsedItems.length === 0) {
      alert('Please parse menu items first before generating day plans.');
      return;
    }

    if (!userData) {
      alert('User data not available. Please complete onboarding first.');
      return;
    }

    setIsGeneratingDayPlans(true);
    try {
      // Call AI API to generate day plans
      const aiDayPlans = await generateDayPlansAPI(
        validParsedItems,
        userData,
        remainingCalories,
        {
          protein: remainingProtein,
          carbs: remainingCarbs,
          fats: remainingFats
        }
      );

      if (!aiDayPlans || aiDayPlans.length === 0) {
        alert('Failed to generate day plans. Please try again.');
        return;
      }

      // Convert AI response to DayPlan format
      const plans: DayPlan[] = aiDayPlans.map((plan: any, index: number) => {
        // Convert items arrays to MenuItem format
        const convertMealItems = (items: any[], mealType: 'breakfast' | 'lunch' | 'dinner'): MenuItem[] => {
          if (!Array.isArray(items)) return [];
          return items
            .filter(item => item && item.name)
            .map((item, itemIndex) => ({
              id: `plan-${index}-${mealType}-${itemIndex}-${Date.now()}`,
              name: item.name || 'Unnamed Item',
              quantity: item.quantity || undefined, // Preserve quantity with units (e.g., "200g", "1 katori", "2 pieces")
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fats: item.fats || 0,
              category: item.category || 'Other',
              mealType: mealType, // Preserve meal type
            }));
        };

        const breakfastItems = convertMealItems(plan.breakfast?.items || [], 'breakfast');
        const lunchItems = convertMealItems(plan.lunch?.items || [], 'lunch');
        const dinnerItems = convertMealItems(plan.dinner?.items || [], 'dinner');

      const breakfast: MealPlan = {
        name: "Breakfast",
        icon: Coffee,
        items: breakfastItems,
          calories: plan.breakfast?.calories || breakfastItems.reduce((sum, item) => sum + item.calories, 0),
          protein: plan.breakfast?.protein || breakfastItems.reduce((sum, item) => sum + item.protein, 0),
          carbs: plan.breakfast?.carbs || breakfastItems.reduce((sum, item) => sum + item.carbs, 0),
          fats: plan.breakfast?.fats || breakfastItems.reduce((sum, item) => sum + item.fats, 0),
      };

      const lunch: MealPlan = {
        name: "Lunch",
        icon: Sun,
        items: lunchItems,
          calories: plan.lunch?.calories || lunchItems.reduce((sum, item) => sum + item.calories, 0),
          protein: plan.lunch?.protein || lunchItems.reduce((sum, item) => sum + item.protein, 0),
          carbs: plan.lunch?.carbs || lunchItems.reduce((sum, item) => sum + item.carbs, 0),
          fats: plan.lunch?.fats || lunchItems.reduce((sum, item) => sum + item.fats, 0),
      };

      const dinner: MealPlan = {
        name: "Dinner",
        icon: Moon,
        items: dinnerItems,
          calories: plan.dinner?.calories || dinnerItems.reduce((sum, item) => sum + item.calories, 0),
          protein: plan.dinner?.protein || dinnerItems.reduce((sum, item) => sum + item.protein, 0),
          carbs: plan.dinner?.carbs || dinnerItems.reduce((sum, item) => sum + item.carbs, 0),
          fats: plan.dinner?.fats || dinnerItems.reduce((sum, item) => sum + item.fats, 0),
        };

        return {
          id: `plan-${index}`,
          name: `Option ${String.fromCharCode(65 + index)}`,
        breakfast,
        lunch,
        dinner,
          totalCalories: plan.totalCalories || (breakfast.calories + lunch.calories + dinner.calories),
          totalProtein: plan.totalProtein || (breakfast.protein + lunch.protein + dinner.protein),
          totalCarbs: plan.totalCarbs || (breakfast.carbs + lunch.carbs + dinner.carbs),
          totalFats: plan.totalFats || (breakfast.fats + lunch.fats + dinner.fats),
        };
      });

    setDayPlans(plans);
    setShowSuggestions(true);
    } catch (error: any) {
      console.error('Error generating day plans:', error);
      const errorMessage = error?.response?.data?.details || error?.message || 'Unknown error occurred';
      alert(`Failed to generate day plans: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsGeneratingDayPlans(false);
    }
  };

  const handleSelectMeal = (meal: MealPlan, planId: string) => {
    const mealType = meal.name.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
    const currentlySelected = selectedMeals[mealType];
    
    // If this meal is already selected, unselect it
    if (currentlySelected === planId) {
      // Remove all items from this meal
      meal.items.forEach(item => {
        if (selectedItems.some(selected => selected.id === item.id)) {
          onSelectItem(item); // Toggle to remove
        }
      });
      
      // Clear selection for this meal type
      setSelectedMeals(prev => ({
        ...prev,
        [mealType]: null
      }));
    } else {
      // First, remove items from ALL previously selected meals of this type across ALL options
      dayPlans.forEach(plan => {
        const prevMeal = plan[mealType];
        if (prevMeal && prevMeal.items) {
          prevMeal.items.forEach(item => {
            if (selectedItems.some(selected => selected.id === item.id)) {
              onSelectItem(item); // Toggle to remove
            }
          });
        }
      });
      
      // Then add items from the new meal
      console.log(`Selecting ${mealType} from ${planId}:`, meal.items.length, 'items');
      meal.items.forEach(item => {
        if (!selectedItems.some(selected => selected.id === item.id)) {
          onSelectItem(item); // Toggle to add
        }
      });
      
      // Update selected meal for this time slot
      setSelectedMeals(prev => ({
        ...prev,
        [mealType]: planId
      }));
      
      // Log current state after selection
      setTimeout(() => {
        console.log('Current selected meals:', {
          breakfast: selectedMeals.breakfast,
          lunch: selectedMeals.lunch,
          dinner: selectedMeals.dinner
        });
      }, 100);
    }
  };

  const isMealFullySelected = (meal: MealPlan, planId: string) => {
    const mealType = meal.name.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
    return selectedMeals[mealType] === planId;
  };

  // Calculate macro deficits and suggest food sources
  const calculateMacroDeficits = () => {
    if (!selectedMeals.breakfast && !selectedMeals.lunch && !selectedMeals.dinner) {
      setMacroDeficitSuggestions(null);
      return;
    }

    // Calculate totals from selected meals
    let selectedProtein = 0;
    let selectedCarbs = 0;
    let selectedFats = 0;
    let selectedCalories = 0;

    if (selectedMeals.breakfast) {
      const plan = dayPlans.find(p => p.id === selectedMeals.breakfast);
      if (plan) {
        selectedProtein += plan.breakfast.protein;
        selectedCarbs += plan.breakfast.carbs;
        selectedFats += plan.breakfast.fats;
        selectedCalories += plan.breakfast.calories;
      }
    }
    if (selectedMeals.lunch) {
      const plan = dayPlans.find(p => p.id === selectedMeals.lunch);
      if (plan) {
        selectedProtein += plan.lunch.protein;
        selectedCarbs += plan.lunch.carbs;
        selectedFats += plan.lunch.fats;
        selectedCalories += plan.lunch.calories;
      }
    }
    if (selectedMeals.dinner) {
      const plan = dayPlans.find(p => p.id === selectedMeals.dinner);
      if (plan) {
        selectedProtein += plan.dinner.protein;
        selectedCarbs += plan.dinner.carbs;
        selectedFats += plan.dinner.fats;
        selectedCalories += plan.dinner.calories;
      }
    }

    // Calculate deficits (what's still needed to meet targets)
    const proteinDeficit = Math.max(0, macros.protein.target - (macros.protein.consumed + selectedProtein));
    const carbsDeficit = Math.max(0, macros.carbs.target - (macros.carbs.consumed + selectedCarbs));
    const fatsDeficit = Math.max(0, macros.fats.target - (macros.fats.consumed + selectedFats));

    // Only show suggestions if there are significant deficits (>5g)
    if (proteinDeficit < 5 && carbsDeficit < 5 && fatsDeficit < 5) {
      setMacroDeficitSuggestions(null);
      return;
    }

    // Get available menu items (from parsed items or use default menu)
    const availableItems: MenuItem[] = parsedItems.length > 0 ? parsedItems : [
      { id: "1", name: "Boiled Eggs (2)", calories: 140, protein: 12, carbs: 1, fats: 10, category: "Protein" },
      { id: "2", name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fats: 3.6, category: "Protein" },
      { id: "3", name: "Paneer (100g)", calories: 265, protein: 18, carbs: 4, fats: 20, category: "Protein" },
      { id: "4", name: "Greek Yogurt (100g)", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, category: "Protein" },
      { id: "5", name: "Steamed Rice (1 bowl)", calories: 200, protein: 4, carbs: 45, fats: 0.5, category: "Carbs" },
      { id: "6", name: "Roti (2 pieces)", calories: 160, protein: 5, carbs: 30, fats: 3, category: "Carbs" },
      { id: "7", name: "Banana (1 medium)", calories: 105, protein: 1, carbs: 27, fats: 0.4, category: "Carbs" },
      { id: "8", name: "Oats (50g)", calories: 194, protein: 6.9, carbs: 33, fats: 3.6, category: "Carbs" },
      { id: "9", name: "Almonds (30g)", calories: 172, protein: 6.3, carbs: 6.1, fats: 15, category: "Fats" },
      { id: "10", name: "Peanut Butter (1 tbsp)", calories: 94, protein: 4, carbs: 3, fats: 8, category: "Fats" },
      { id: "11", name: "Avocado (100g)", calories: 160, protein: 2, carbs: 9, fats: 15, category: "Fats" },
      { id: "12", name: "Ghee (1 tsp)", calories: 45, protein: 0, carbs: 0, fats: 5, category: "Fats" },
    ];

    // Find best sources for each macro
    const findBestSources = (macroType: 'protein' | 'carbs' | 'fats', deficit: number) => {
      if (deficit < 5) return [];
      
      const sorted = [...availableItems]
        .filter(item => {
          const macroValue = macroType === 'protein' ? item.protein : macroType === 'carbs' ? item.carbs : item.fats;
          return macroValue > 0;
        })
        .sort((a, b) => {
          // Sort by macro density (macro per calorie)
          const aDensity = (macroType === 'protein' ? a.protein : macroType === 'carbs' ? a.carbs : a.fats) / (a.calories || 1);
          const bDensity = (macroType === 'protein' ? b.protein : macroType === 'carbs' ? b.carbs : b.fats) / (b.calories || 1);
          return bDensity - aDensity;
        })
        .slice(0, 3); // Top 3 sources
      
      return sorted;
    };

    const proteinSources = findBestSources('protein', proteinDeficit);
    const carbsSources = findBestSources('carbs', carbsDeficit);
    const fatsSources = findBestSources('fats', fatsDeficit);

    setMacroDeficitSuggestions({
      protein: proteinSources,
      carbs: carbsSources,
      fats: fatsSources,
      deficits: {
        protein: proteinDeficit,
        carbs: carbsDeficit,
        fats: fatsDeficit
      }
    });
  };

  // Recalculate deficits when selected meals change
  useEffect(() => {
    if (dayPlans.length > 0) {
      calculateMacroDeficits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeals, dayPlans, macros.protein.target, macros.protein.consumed, macros.carbs.target, macros.carbs.consumed, macros.fats.target, macros.fats.consumed]);

  // Check if an item is selected (for day plans, also check if meal container is selected)
  const isSelected = (itemId: string, mealType?: 'breakfast' | 'lunch' | 'dinner', planId?: string) => {
    // First check if item is in selectedItems
    if (!selectedItems.some(item => item.id === itemId)) {
      return false;
    }
    // If mealType and planId are provided (day plans), check if the meal container is selected
    if (mealType !== undefined && planId !== undefined) {
      return selectedMeals[mealType] === planId;
    }
    // For non-day-plan items (AI suggestions), just check if in selectedItems
    return true;
  };
  const getItemPreference = (itemId: string) => itemPreferences.get(itemId) || "optional";

  const mustHaveCount = Array.from(itemPreferences.values()).filter(p => p === "must-have").length;
  const optionalCount = Array.from(itemPreferences.values()).filter(p => p === "optional").length;
  const notNecessaryCount = Array.from(itemPreferences.values()).filter(p => p === "not-necessary").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl text-[#E6E9EF]">Smart Menu Suggestions</h1>
        <p className="text-[#9AA3B2]">
          Paste your cafeteria menu and get personalized recommendations
        </p>
      </div>

      {/* Remaining Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-[#22D3EE]/10 to-[#14B8A6]/10 border border-[#22D3EE]/30 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#22D3EE]" />
          <h3 className="text-lg text-[#E6E9EF]">Remaining Today</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#9AA3B2] mb-1">Calories</p>
            <p className="text-xl text-[#E6E9EF]">{remainingCalories}</p>
          </div>
          <div>
            <p className="text-xs text-[#9AA3B2] mb-1">Protein</p>
            <p className="text-xl text-[#E6E9EF]">{Math.max(0, macros.protein.target - macros.protein.consumed)}g</p>
          </div>
          <div>
            <p className="text-xs text-[#9AA3B2] mb-1">Carbs</p>
            <p className="text-xl text-[#E6E9EF]">{Math.max(0, macros.carbs.target - macros.carbs.consumed)}g</p>
          </div>
          <div>
            <p className="text-xs text-[#9AA3B2] mb-1">Fats</p>
            <p className="text-xl text-[#E6E9EF]">{Math.max(0, macros.fats.target - macros.fats.consumed)}g</p>
          </div>
        </div>
      </div>


      {/* Menu Input Section */}
      {!showCategorization && (
        <div className="rounded-2xl bg-[#121722]/40 backdrop-blur-xl border border-[#2A3242] shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ClipboardPaste className="w-5 h-5 text-[#14B8A6]" />
            <h3 className="text-lg text-[#E6E9EF]">Paste Your Menu</h3>
          </div>
          
          <textarea
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            placeholder="Paste your cafeteria menu here... (e.g., Vegetable Biryani, Chicken Curry, Dal Tadka, etc.)"
            className="w-full h-32 px-4 py-3 rounded-xl bg-[#0B0E14]/50 border border-[#2A3242] text-[#E6E9EF] placeholder-[#9AA3B2]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE]"
          />
          
          <div className="space-y-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Additional preferences (optional): e.g., 'I want something spicy', 'Healthy options', 'Light meals'..."
              className="w-full px-4 py-3 rounded-xl bg-[#0B0E14]/50 border border-[#2A3242] text-[#E6E9EF] placeholder-[#9AA3B2]/50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE]"
            />
            
            {errorMessage && (
              <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl p-3">
                <p className="text-sm text-[#F87171]">{errorMessage}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleParseMenu}
                disabled={!menuText.trim() || isLoadingAi}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#14B8A6] text-[#0B0E14] transition-all hover:shadow-lg hover:shadow-[#22D3EE]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B0E14] border-t-transparent rounded-full animate-spin"></div>
                    AI Parsing...
                  </>
                ) : (
                  'Parse Menu with AI'
                )}
              </button>
              <button
                onClick={handleGetAiSuggestions}
                disabled={!userData || isLoadingAi || remainingCalories <= 0}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22D3EE] text-[#0B0E14] transition-all hover:shadow-lg hover:shadow-[#14B8A6]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0B0E14] border-t-transparent rounded-full animate-spin"></div>
                    AI Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get 3 AI Suggestions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* AI Suggestions Section */}
      <AnimatePresence>
        {showAiSuggestions && aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="text-lg text-[#E6E9EF]">AI Meal Suggestions ({aiSuggestions.length})</h3>
              </div>
              <button
                onClick={() => {
                  setShowAiSuggestions(false);
                  setAiSuggestions([]);
                  setTextInput("");
                }}
                className="text-xs text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors"
              >
                Back to Menu
              </button>
            </div>
            
            {textInput.trim() && (
              <div className="bg-[#22D3EE]/10 border border-[#22D3EE]/30 rounded-xl p-3">
                <p className="text-sm text-[#E6E9EF]">
                  <span className="text-[#22D3EE]">Based on your preference:</span> "{textInput.trim()}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSuggestions.map((item, index) => {
                if (!item) return null; // Skip undefined items
                
                const fullSuggestion = aiSuggestionsFull[index];
                const macroStatus = fullSuggestion?.macroStatus;
                const hasComplements = fullSuggestion?.complements && Array.isArray(fullSuggestion.complements) && fullSuggestion.complements.length > 0;
                const needsComplements = macroStatus && (!macroStatus.proteinMet || !macroStatus.carbsMet || !macroStatus.fatsMet);
                
                return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl bg-[#121722]/40 backdrop-blur-xl border border-[#2A3242] shadow-md p-4 hover:border-[#14B8A6]/50 transition-all"
                >
                  <button
                    onClick={() => onSelectItem(item)}
                    className="w-full text-left space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#E6E9EF] truncate">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-[#9AA3B2] mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-[#E6E9EF] ml-2">{item.calories} cal</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9AA3B2]">
                      <span className="bg-[#14B8A6]/20 text-[#14B8A6] px-2 py-1 rounded-full">{item.category}</span>
                        <span className={macroStatus?.proteinMet ? "text-[#14B8A6]" : "text-[#F87171]"}>P:{item.protein}g</span>
                        <span className={macroStatus?.carbsMet ? "text-[#14B8A6]" : "text-[#F87171]"}>C:{item.carbs}g</span>
                        <span className={macroStatus?.fatsMet ? "text-[#14B8A6]" : "text-[#F87171]"}>F:{item.fats}g</span>
                      {isSelected(item.id) && (
                        <span className="ml-auto text-[#14B8A6] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                      
                      {/* Macro Status Indicator */}
                      {needsComplements && (
                        <div className="mt-2 pt-2 border-t border-[#2A3242]">
                          <p className="text-xs text-[#F87171] mb-1 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Consider adding:
                          </p>
                          {macroStatus.proteinGap > 0 && (
                            <p className="text-xs text-[#9AA3B2]">+{macroStatus.proteinGap}g protein</p>
                          )}
                          {macroStatus.carbsGap > 0 && (
                            <p className="text-xs text-[#9AA3B2]">+{macroStatus.carbsGap}g carbs</p>
                          )}
                          {macroStatus.fatsGap > 0 && (
                            <p className="text-xs text-[#9AA3B2]">+{macroStatus.fatsGap}g fats</p>
                          )}
                        </div>
                      )}
                  </button>
                    
                    {/* Complementary Suggestions */}
                    {hasComplements && fullSuggestion.complements && (
                      <div className="mt-3 pt-3 border-t border-[#2A3242]">
                        <p className="text-xs text-[#14B8A6] mb-2 font-medium">Suggested additions to meet macros:</p>
                        <div className="space-y-2">
                          {fullSuggestion.complements
                            .filter((complement: any) => complement && complement.name) // Filter out undefined/null complements
                            .map((complement: any, compIndex: number) => {
                              const complementItem: MenuItem = {
                                id: `complement-${index}-${compIndex}`,
                                name: complement.name || 'Unnamed Item',
                                calories: complement.calories || 0,
                                protein: complement.protein || 0,
                                carbs: complement.carbs || 0,
                                fats: complement.fats || 0,
                                category: complement.category || 'Snack',
                                description: complement.description
                              };
                              
                              return (
                                <button
                                  key={compIndex}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectItem(complementItem);
                                  }}
                                  className="w-full text-left p-2 rounded-lg bg-[#1A1F2E]/50 hover:bg-[#1A1F2E] border border-[#2A3242] transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-[#E6E9EF]">{complement.name}</p>
                                      <p className="text-xs text-[#9AA3B2] mt-0.5">
                                        {complement.calories || 0} cal • P:{complement.protein || 0}g C:{complement.carbs || 0}g F:{complement.fats || 0}g
                                      </p>
                                    </div>
                                    {isSelected(complementItem.id) && (
                                      <Check className="w-4 h-4 text-[#14B8A6] ml-2" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categorization Section */}
      <AnimatePresence>
        {showCategorization && !showSuggestions && !showAiSuggestions && parsedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="text-lg text-[#E6E9EF]">Categorize Your Menu Items ({parsedItems.length})</h3>
              </div>
              <button
                onClick={() => {
                  setShowCategorization(false);
                  setParsedItems([]);
                  setMenuText("");
                  setItemPreferences(new Map());
                }}
                className="text-xs text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors"
              >
                Reset Menu
              </button>
            </div>

            <div className="rounded-xl bg-[#121722]/40 backdrop-blur-xl border border-[#2A3242] shadow-md p-4">
              <p className="text-sm text-[#9AA3B2] mb-3">Mark each item based on your preference:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#14B8A6] fill-[#14B8A6]" />
                  <span className="text-[#E6E9EF]">Must Have ({mustHaveCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-[#22D3EE]" />
                  <span className="text-[#E6E9EF]">Optional ({optionalCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-[#9AA3B2]" />
                  <span className="text-[#E6E9EF]">Not Necessary ({notNecessaryCount})</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {parsedItems.map((item, index) => {
                const preference = getItemPreference(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`rounded-xl bg-[#121722]/40 backdrop-blur-xl border shadow-md p-4 ${
                      preference === "must-have"
                        ? "border-[#14B8A6] ring-2 ring-[#14B8A6]/20"
                        : preference === "not-necessary"
                        ? "border-[#9AA3B2]/30 opacity-60"
                        : "border-[#2A3242]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[#E6E9EF] truncate">{item.name}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className="text-[#9AA3B2]">{item.category}</span>
                          <span className="text-[#9AA3B2]">•</span>
                          <span className="text-[#E6E9EF]">{item.calories} cal</span>
                          <span className="text-[#9AA3B2]">P:{item.protein}g C:{item.carbs}g F:{item.fats}g</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setItemPreference(item.id, "must-have")}
                          className={`p-2 rounded-lg transition-all ${
                            preference === "must-have"
                              ? "bg-[#14B8A6] text-[#0B0E14]"
                              : "bg-[#2A3242] text-[#9AA3B2] hover:bg-[#2A3242]/70"
                          }`}
                          title="Must Have"
                        >
                          <Star className={`w-4 h-4 ${preference === "must-have" ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => setItemPreference(item.id, "optional")}
                          className={`p-2 rounded-lg transition-all ${
                            preference === "optional"
                              ? "bg-[#22D3EE] text-[#0B0E14]"
                              : "bg-[#2A3242] text-[#9AA3B2] hover:bg-[#2A3242]/70"
                          }`}
                          title="Optional"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemPreference(item.id, "not-necessary")}
                          className={`p-2 rounded-lg transition-all ${
                            preference === "not-necessary"
                              ? "bg-[#9AA3B2] text-[#0B0E14]"
                              : "bg-[#2A3242] text-[#9AA3B2] hover:bg-[#2A3242]/70"
                          }`}
                          title="Not Necessary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={generateDayPlans}
              disabled={isGeneratingDayPlans}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#14B8A6] text-[#0B0E14] flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#22D3EE]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-5 h-5 ${isGeneratingDayPlans ? 'animate-spin' : ''}`} />
              <span>{isGeneratingDayPlans ? 'Generating Day Plans...' : 'Generate 3 Meal Plan Options'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 Full Day Meal Plan Options */}
      <AnimatePresence>
        {showSuggestions && dayPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#22D3EE]" />
                <h3 className="text-lg text-[#E6E9EF]">3 Full Day Meal Options</h3>
              </div>
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  setShowCategorization(true);
                }}
                className="text-xs text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors"
              >
                Back to Categories
              </button>
            </div>

            <p className="text-sm text-[#9AA3B2] text-center">
              Select one meal per time slot (breakfast, lunch, dinner) from any option
            </p>

            {/* Selected Meals Summary */}
            {(selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner) && (
              <div className="rounded-xl bg-gradient-to-br from-[#22D3EE]/10 to-[#14B8A6]/10 border border-[#22D3EE]/30 p-4">
                <h4 className="text-sm font-medium text-[#E6E9EF] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
                  Selected Meals
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {selectedMeals.breakfast && (
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-[#9AA3B2]">Breakfast:</span>
                      <span className="text-[#E6E9EF] font-medium">
                        {dayPlans.find(p => p.id === selectedMeals.breakfast)?.name || 'Selected'}
                      </span>
                    </div>
                  )}
                  {selectedMeals.lunch && (
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-[#9AA3B2]">Lunch:</span>
                      <span className="text-[#E6E9EF] font-medium">
                        {dayPlans.find(p => p.id === selectedMeals.lunch)?.name || 'Selected'}
                      </span>
                    </div>
                  )}
                  {selectedMeals.dinner && (
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-[#9AA3B2]">Dinner:</span>
                      <span className="text-[#E6E9EF] font-medium">
                        {dayPlans.find(p => p.id === selectedMeals.dinner)?.name || 'Selected'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[#2A3242]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#9AA3B2]">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected from {[
                        selectedMeals.breakfast && 'Breakfast',
                        selectedMeals.lunch && 'Lunch',
                        selectedMeals.dinner && 'Dinner'
                      ].filter(Boolean).join(', ')} • Use the Log button below to save all items
                    </p>
                    <div className="text-xs text-[#22D3EE] font-medium">
                      Total: {(() => {
                        // Calculate total from selected meal totals (more accurate)
                        let total = 0;
                        if (selectedMeals.breakfast) {
                          const plan = dayPlans.find(p => p.id === selectedMeals.breakfast);
                          if (plan) total += plan.breakfast.calories;
                        }
                        if (selectedMeals.lunch) {
                          const plan = dayPlans.find(p => p.id === selectedMeals.lunch);
                          if (plan) total += plan.lunch.calories;
                        }
                        if (selectedMeals.dinner) {
                          const plan = dayPlans.find(p => p.id === selectedMeals.dinner);
                          if (plan) total += plan.dinner.calories;
                        }
                        return total;
                      })()} cal
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Day Plans */}
            <div className="grid grid-cols-1 gap-6">
              {dayPlans.map((plan, planIndex) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: planIndex * 0.1 }}
                  className="rounded-2xl bg-[#121722]/40 backdrop-blur-xl border border-[#2A3242] shadow-lg overflow-hidden"
                >
                  {/* Plan Header */}
                  <div className="bg-gradient-to-r from-[#22D3EE]/10 to-[#14B8A6]/10 border-b border-[#2A3242] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl text-[#E6E9EF]">{plan.name}</h3>
                    </div>
                    <div className="flex items-center flex-wrap gap-6 text-sm">
                      <span className="text-[#E6E9EF]">{plan.totalCalories} cal</span>
                      <span className="text-[#9AA3B2]">Protein: {plan.totalProtein}g</span>
                      <span className="text-[#9AA3B2]">Carbs: {plan.totalCarbs}g</span>
                      <span className="text-[#9AA3B2]">Fats: {plan.totalFats}g</span>
                    </div>
                  </div>

                  {/* Meals Grid */}
                  <div className="p-5 space-y-4">
                    {[plan.breakfast, plan.lunch, plan.dinner].map((meal, mealIndex) => {
                      const isMealSelected = isMealFullySelected(meal, plan.id);
                      return (
                      <div 
                        key={mealIndex} 
                        className={`space-y-3 rounded-lg p-3 transition-all ${
                          isMealSelected 
                            ? "bg-[#22D3EE]/10 border border-[#22D3EE]/30" 
                            : "bg-transparent"
                        }`}
                      >
                        {/* Meal Header with Select Button */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#2A3242]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#14B8A6]/20 flex items-center justify-center">
                              <meal.icon className="w-4 h-4 text-[#22D3EE]" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-[#E6E9EF]">{meal.name}</h4>
                              <p className="text-xs text-[#9AA3B2]">
                                {meal.calories} cal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelectMeal(meal, plan.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                              isMealSelected
                                ? "bg-[#22D3EE] text-[#0B0E14] font-medium"
                                : "bg-[#2A3242] text-[#E6E9EF] hover:bg-[#2A3242]/70"
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isMealSelected ? 'fill-current' : ''}`} />
                            <span>{isMealSelected ? "Selected ✓" : "Select Meal"}</span>
                          </button>
                        </div>

                        {/* Meal Items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(() => {
                            // Count occurrences of each item to show quantity
                            const itemCounts = new Map<string, number>();
                            meal.items.forEach(item => {
                              const baseName = item.name.replace(/\s*\(.*?\)\s*/g, '').trim(); // Remove quantity from name
                              itemCounts.set(baseName, (itemCounts.get(baseName) || 0) + 1);
                            });
                            
                            // Group items by base name
                            const groupedItems = new Map<string, MenuItem[]>();
                            meal.items.forEach(item => {
                              const baseName = item.name.replace(/\s*\(.*?\)\s*/g, '').trim();
                              if (!groupedItems.has(baseName)) {
                                groupedItems.set(baseName, []);
                              }
                              groupedItems.get(baseName)!.push(item);
                            });
                            
                            const groupedItemsArray = Array.from(groupedItems.entries());
                            const totalItems = groupedItemsArray.length;
                            
                            return groupedItemsArray.map(([baseName, items], itemIndex) => {
                              const item = items[0]; // Use first item for display
                              const quantity = items.length;
                              // Format quantity display: show unit with multiplier if multiple
                              let displayQuantity = '';
                              if (item.quantity) {
                                if (quantity > 1) {
                                  displayQuantity = `${item.quantity} × ${quantity}`;
                                } else {
                                  displayQuantity = item.quantity;
                                }
                              } else if (quantity > 1) {
                                displayQuantity = `× ${quantity}`;
                              }
                              const totalCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
                              const totalProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0);
                              const totalCarbs = items.reduce((sum, i) => sum + (i.carbs || 0), 0);
                              const totalFats = items.reduce((sum, i) => sum + (i.fats || 0), 0);
                              
                            const preference = getItemPreference(item.id);
                              const mealType = meal.name.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
                              const itemIsSelected = isSelected(item.id, mealType, plan.id);
                              
                              // If this is the last item and total items is odd, make it span full width
                              const isLastItem = itemIndex === totalItems - 1;
                              const isOddCount = totalItems % 2 === 1;
                              const shouldSpanFull = isLastItem && isOddCount;
                              
                            return (
                              <button
                                key={item.id}
                                  onClick={() => {
                                    // Select all items of this type
                                    items.forEach(i => onSelectItem(i));
                                  }}
                                className={`text-left rounded-lg bg-[#0B0E14]/50 border p-3 space-y-2 transition-all hover:shadow-md ${
                                    itemIsSelected
                                    ? "border-[#22D3EE] ring-1 ring-[#22D3EE]/20"
                                    : "border-[#2A3242] hover:border-[#22D3EE]/50"
                                  } ${shouldSpanFull ? 'md:col-span-2' : ''}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {preference === "must-have" && (
                                      <Star className="w-3 h-3 text-[#14B8A6] fill-[#14B8A6] flex-shrink-0" />
                                    )}
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-[#E6E9EF] font-medium">{baseName}</span>
                                  </div>
                                    </div>
                                    <span className="text-sm text-[#E6E9EF] ml-2 whitespace-nowrap">{totalCalories} cal</span>
                                </div>
                                  
                                  {displayQuantity && (
                                    <div className="flex justify-end">
                                      <span className="text-xs text-[#22D3EE] font-semibold">
                                        {displayQuantity}
                                      </span>
                                    </div>
                                  )}

                                <div className="flex items-center gap-3 text-xs text-[#9AA3B2]">
                                    <span>P:{totalProtein}g</span>
                                    <span>C:{totalCarbs}g</span>
                                    <span>F:{totalFats}g</span>
                                    {itemIsSelected && (
                                    <span className="ml-auto text-[#22D3EE] flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Selected
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                            });
                          })()}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Macro Deficit Suggestions - Below Option C */}
            {macroDeficitSuggestions && (
              <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Macro Deficits Detected</h4>
                </div>
                <p className="text-xs text-[#9AA3B2]">
                  Your selected meals don't fully meet your macro targets. Add these items to reach your goals:
                </p>
                
                <div className="space-y-3">
                  {macroDeficitSuggestions.deficits.protein >= 5 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E6E9EF]">
                          Protein Deficit: {Math.round(macroDeficitSuggestions.deficits.protein)}g
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {macroDeficitSuggestions.protein.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onSelectItem(item)}
                            className="text-left rounded-lg bg-[#0B0E14]/50 border border-[#2A3242] p-2 hover:border-amber-500/50 transition-all"
                          >
                            <div className="text-xs text-[#E6E9EF] font-medium">{item.name}</div>
                            <div className="text-xs text-[#9AA3B2] mt-1">
                              {item.calories} cal • P:{item.protein}g
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {macroDeficitSuggestions.deficits.carbs >= 5 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E6E9EF]">
                          Carbs Deficit: {Math.round(macroDeficitSuggestions.deficits.carbs)}g
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {macroDeficitSuggestions.carbs.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onSelectItem(item)}
                            className="text-left rounded-lg bg-[#0B0E14]/50 border border-[#2A3242] p-2 hover:border-amber-500/50 transition-all"
                          >
                            <div className="text-xs text-[#E6E9EF] font-medium">{item.name}</div>
                            <div className="text-xs text-[#9AA3B2] mt-1">
                              {item.calories} cal • C:{item.carbs}g
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {macroDeficitSuggestions.deficits.fats >= 5 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E6E9EF]">
                          Fats Deficit: {Math.round(macroDeficitSuggestions.deficits.fats)}g
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {macroDeficitSuggestions.fats.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onSelectItem(item)}
                            className="text-left rounded-lg bg-[#0B0E14]/50 border border-[#2A3242] p-2 hover:border-amber-500/50 transition-all"
                          >
                            <div className="text-xs text-[#E6E9EF] font-medium">{item.name}</div>
                            <div className="text-xs text-[#9AA3B2] mt-1">
                              {item.calories} cal • F:{item.fats}g
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
