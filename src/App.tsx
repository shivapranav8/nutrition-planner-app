import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { SummaryCard } from "./components/SummaryCard";
import { FloatingComposer } from "./components/FloatingComposer";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { TargetsScreen } from "./components/TargetsScreen";
import { MenuScreen } from "./components/MenuScreen";
import { OptionsScreen } from "./components/OptionsScreen";
import { LogScreen } from "./components/LogScreen";
import { ApiKeysScreen } from "./components/ApiKeysScreen";
import { UserProvider, useUser } from "./contexts/UserContext";
import { Users, Target, UtensilsCrossed, Lightbulb, BookOpen } from "lucide-react";

interface UserData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  goal: string;
}

interface MenuItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
}

interface LogEntry {
  item: MenuItem;
  timestamp: string;
}

interface Targets {
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

type Screen = "onboarding" | "targets" | "menu" | "options" | "log" | "apikeys";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState("onboarding" as Screen);
  const [selectedItems, setSelectedItems] = useState([] as MenuItem[]);
  
  const { 
    userData, 
    targets, 
    loggedItems, 
    setUserData, 
    setTargets, 
    addLoggedItem, 
    removeLoggedItem,
    isLoading,
    isServerConnected,
    setAuthenticatedUser,
    authenticatedUser
  } = useUser();


  // Calculate BMI, BMR, TDEE, and macros using scientifically validated formulas
  const calculateTargets = (data: UserData): Targets | null => {
    const age = parseInt(data.age);
    const height = parseInt(data.height);
    const weight = parseInt(data.weight);

    // Validate inputs
    if (isNaN(age) || isNaN(height) || isNaN(weight) || age <= 0 || height <= 0 || weight <= 0) {
      return null;
    }

    // BMI calculation: Weight(kg) / Height(m)²
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // BMR calculation using Mifflin-St Jeor Equation (most accurate modern formula)
    let bmr: number;
    if (data.gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers based on scientific research
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,      // Sedentary (little to no exercise)
      light: 1.375,        // Lightly active (light exercise 1-3 days/week)
      moderate: 1.55,      // Moderately active (moderate exercise 3-5 days/week)
      active: 1.725,       // Very active (hard exercise 6-7 days/week)
      veryActive: 1.9,     // Extra active (very hard exercise, physical job)
    };

    // TDEE calculation: BMR × Activity Factor
    const tdee = bmr * activityMultipliers[data.activityLevel];

    // Goal-based calorie adjustments (scientifically validated)
    let dailyCalories = tdee;
    if (data.goal === "lose") {
      // Weight loss: 500 kcal/day deficit (0.5 kg/week loss)
      // CRITICAL: Never go below BMR (scientific safety limit)
      dailyCalories = Math.max(bmr, tdee - 500);
    } else if (data.goal === "gain") {
      // Muscle gain: 300-500 kcal/day surplus for lean muscle gain
      dailyCalories = tdee + 300;
    }
    // Maintenance: dailyCalories = tdee (already set)

    // Scientific macronutrient distribution based on goal
    let proteinRatio: number, fatRatio: number, carbRatio: number;
    
    if (data.goal === "lose") {
      // Fat loss: Higher protein (1.6-2.4 g/kg), moderate fat (20-30%), rest carbs
      proteinRatio = 0.30; // 30% protein for satiety and muscle preservation
      fatRatio = 0.25;     // 25% fat for hormone production
      carbRatio = 0.45;    // 45% carbs for energy and adherence
    } else if (data.goal === "gain") {
      // Muscle gain: Higher carbs (45-55%), adequate protein (1.6-2.2 g/kg)
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30;     // 30% fat for hormone production
      carbRatio = 0.45;    // 45% carbs for energy and recovery
    } else {
      // Maintenance: Balanced approach
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30;     // 30% fat
      carbRatio = 0.45;    // 45% carbs
    }

    // Macro calculations with caloric equivalents
    const protein = Math.round((dailyCalories * proteinRatio) / 4); // 4 kcal/g protein
    const carbs = Math.round((dailyCalories * carbRatio) / 4);      // 4 kcal/g carbs
    const fats = Math.round((dailyCalories * fatRatio) / 9);        // 9 kcal/g fat

    return {
      bmi,
      bmr,
      tdee,
      dailyCalories,
      macros: { protein, carbs, fats },
    };
  };

  const handleOnboardingComplete = (data: UserData) => {
    setUserData(data);
  };

  const handleCalculateTargets = async () => {
    if (userData) {
      const calculatedTargets = calculateTargets(userData);
      if (calculatedTargets) {
        setTargets(calculatedTargets);
        setCurrentScreen("targets");
      }
    }
  };

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleLogItems = async () => {
    if (selectedItems.length > 0) {
      console.log('Logging items:', selectedItems.length, 'items from selected meals');
      console.log('Selected items:', selectedItems.map(i => ({ name: i.name, calories: i.calories })));
      
      // Log all items from all selected meals together
      const loggedCount = selectedItems.length;
      for (const item of selectedItems) {
        await addLoggedItem(item);
      }
      
      console.log(`Successfully logged ${loggedCount} items`);
      setSelectedItems([]);
      // Navigate to log screen to show the newly logged items
      setCurrentScreen("log");
    }
  };

  const handleRemoveLogEntry = async (index: number) => {
    const logEntry = loggedItems[index];
    if (logEntry) {
      await removeLoggedItem(logEntry.id);
    }
  };

  const handleAddManualMeal = async (item: MenuItem) => {
    await addLoggedItem(item);
  };

  const handleGetSuggestions = () => {
    setCurrentScreen("options");
  };

  // Calculate consumed macros from logged items
  const consumedCalories = loggedItems.reduce((sum, entry) => {
    if (!entry || !entry.item) return sum;
    return sum + (entry.item.calories || 0);
  }, 0);
  const consumedProtein = loggedItems.reduce((sum, entry) => {
    if (!entry || !entry.item) return sum;
    return sum + (entry.item.protein || 0);
  }, 0);
  const consumedCarbs = loggedItems.reduce((sum, entry) => {
    if (!entry || !entry.item) return sum;
    return sum + (entry.item.carbs || 0);
  }, 0);
  const consumedFats = loggedItems.reduce((sum, entry) => {
    if (!entry || !entry.item) return sum;
    return sum + (entry.item.fats || 0);
  }, 0);

  const remainingCalories = targets ? targets.dailyCalories - consumedCalories : 0;

  // Check if onboarding form is valid
  const isOnboardingFormValid = userData && userData.age && userData.height && userData.weight;

  const navigationItems = [
    { id: "onboarding" as Screen, label: "Profile", icon: Users, disabled: false },
    { id: "targets" as Screen, label: "Targets", icon: Target, disabled: !targets },
    { id: "options" as Screen, label: "Suggestions", icon: Lightbulb, disabled: !targets },
    { id: "log" as Screen, label: "Log", icon: BookOpen, disabled: !targets },
  ];

  const showHeader = true;

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-32">
      {showHeader && <Header 
        authenticatedUser={authenticatedUser} 
        onLogout={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authenticatedUser');
          setAuthenticatedUser(null);
          setCurrentScreen("onboarding");
        }}
        onSettingsClick={() => setCurrentScreen("apikeys")}
      />}
      
      {/* Server Connection Status */}
      {!isServerConnected && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400 rounded-xl p-4 text-center">
            <p className="text-white text-sm">
              ⚠️ Backend server not connected. Some features may not work properly.
            </p>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-[#121722] rounded-2xl p-6 border border-[#2A3242]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#E6E9EF]">Processing...</span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          {targets && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 p-2 rounded-full bg-[#121722]/60 backdrop-blur-xl border border-[#2A3242]">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setCurrentScreen(item.id)}
                    disabled={item.disabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      currentScreen === item.id
                        ? "bg-gradient-to-r from-[#22D3EE] to-[#14B8A6] text-[#0B0E14]"
                        : item.disabled
                        ? "text-[#9AA3B2]/40 cursor-not-allowed"
                        : "text-[#9AA3B2] hover:text-[#E6E9EF] hover:bg-[#2A3242]/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <div className={`grid gap-6 ${targets ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
            {/* Main Screen */}
            <div>
              <AnimatePresence mode="wait">
                {currentScreen === "onboarding" && (
                  <motion.div
                    key="onboarding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <OnboardingScreen onComplete={handleOnboardingComplete} />
                  </motion.div>
                )}

                {currentScreen === "targets" && targets && (
                  <motion.div
                    key="targets"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TargetsScreen
                      bmi={targets.bmi}
                      bmr={targets.bmr}
                      tdee={targets.tdee}
                      dailyCalories={targets.dailyCalories}
                      macros={targets.macros}
                    />
                  </motion.div>
                )}

                {currentScreen === "menu" && targets && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MenuScreen onSelectItem={handleSelectItem} selectedItems={selectedItems} />
                  </motion.div>
                )}

                {currentScreen === "options" && targets && (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <OptionsScreen
                      dailyCalories={targets.dailyCalories}
                      remainingCalories={remainingCalories}
                      macros={{
                        protein: { consumed: consumedProtein, target: targets.macros.protein },
                        carbs: { consumed: consumedCarbs, target: targets.macros.carbs },
                        fats: { consumed: consumedFats, target: targets.macros.fats },
                      }}
                      onSelectItem={handleSelectItem}
                      selectedItems={selectedItems}
                    />
                  </motion.div>
                )}

                {currentScreen === "log" && targets && (
                  <motion.div
                    key="log"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LogScreen 
                      loggedItems={loggedItems} 
                      onRemoveItem={handleRemoveLogEntry}
                      onAddManualMeal={handleAddManualMeal}
                    />
                  </motion.div>
                )}

                {currentScreen === "apikeys" && (
                  <motion.div
                    key="apikeys"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ApiKeysScreen onBack={() => {
                      // Navigate back to the last screen or default to onboarding
                      if (targets) {
                        setCurrentScreen("targets");
                      } else {
                        setCurrentScreen("onboarding");
                      }
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary Card (Right Side) */}
            {targets && (
              <div className="hidden lg:block">
                <SummaryCard
                  dailyCalories={targets.dailyCalories}
                  consumedCalories={consumedCalories}
                  remainingCalories={remainingCalories}
                  macros={{
                    protein: { consumed: consumedProtein, target: targets.macros.protein },
                    carbs: { consumed: consumedCarbs, target: targets.macros.carbs },
                    fats: { consumed: consumedFats, target: targets.macros.fats },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Composer */}
      {targets && (
        <FloatingComposer
          currentScreen={currentScreen}
          onCalculate={undefined}
          onSuggest={currentScreen === "menu" ? handleGetSuggestions : undefined}
          onLog={selectedItems.length > 0 ? handleLogItems : undefined}
        />
      )}

      {currentScreen === "onboarding" && !targets && (
        <FloatingComposer
          currentScreen={currentScreen}
          onCalculate={handleCalculateTargets}
          onSuggest={undefined}
          onLog={undefined}
          isFormValid={!!isOnboardingFormValid}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
