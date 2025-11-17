# Scientific Basis for Nutrition Calculations

This document outlines the scientific formulas and evidence-based approaches used in the Nutrition Planner App.

## 1. Body Mass Index (BMI)

### Formula
```
BMI = Weight (kg) / Height (m)²
```

### Scientific Basis
- **Origin**: Introduced by Adolphe Quetelet in the 19th century
- **Principle**: Assumes human weight scales approximately with the square of height
- **Limitations**: Doesn't distinguish between fat and lean mass
- **Use**: Correlates statistically with population-level adiposity and health outcomes

### Categories
- **Underweight**: BMI < 18.5
- **Normal**: BMI 18.5-24.9
- **Overweight**: BMI 25-29.9
- **Obese**: BMI ≥ 30

## 2. Basal Metabolic Rate (BMR)

### Definition
BMR represents the energy your body needs at rest to maintain vital functions (respiration, circulation, cell repair). It accounts for 60-70% of daily energy expenditure.

### Mifflin-St Jeor Equation (Used in App)
**Most accurate modern formula**

**Men**: `BMR = 10W + 6.25H - 5A + 5`
**Women**: `BMR = 10W + 6.25H - 5A - 161`

Where:
- W = weight (kg)
- H = height (cm)
- A = age (years)

### Alternative: Harris-Benedict (Revised)
**Men**: `BMR = 88.362 + (13.397 × W) + (4.799 × H) - (5.677 × A)`
**Women**: `BMR = 447.593 + (9.247 × W) + (3.098 × H) - (4.330 × A)`

### Factors Affecting BMR
- Lean body mass
- Sex
- Age
- Hormone levels (thyroid, leptin)
- Genetics
- Body composition

## 3. Total Daily Energy Expenditure (TDEE)

### Formula
```
TDEE = BMR × Activity Factor
```

### Activity Multipliers (Scientific Standards)
- **1.2** — Sedentary (little to no exercise)
- **1.375** — Lightly active (light exercise 1-3 days/week)
- **1.55** — Moderately active (moderate exercise 3-5 days/week)
- **1.725** — Very active (hard exercise 6-7 days/week)
- **1.9** — Extra active (very hard exercise, physical job)

### Additional Components
- **NEAT** (Non-Exercise Activity Thermogenesis)
- **Exercise Activity**
- **TEF** (Thermic Effect of Food) ≈ 10% of calories consumed

## 4. Macronutrient Targets

### Caloric Equivalents
- **Protein**: 4 kcal/g
- **Carbohydrates**: 4 kcal/g
- **Fat**: 9 kcal/g

### Evidence-Based Ratios by Goal

#### Fat Loss
- **Protein**: 1.6-2.4 g/kg (30% of calories)
- **Fat**: 20-30% of calories (25% in app)
- **Carbs**: Remaining calories (45% in app)

#### Maintenance
- **Protein**: 1.4-2.0 g/kg (25% of calories)
- **Fat**: 25-35% of calories (30% in app)
- **Carbs**: 40-50% of calories (45% in app)

#### Muscle Gain
- **Protein**: 1.6-2.2 g/kg (25% of calories)
- **Fat**: 25-35% of calories (30% in app)
- **Carbs**: 45-55% of calories (45% in app)

### Scientific Rationale

#### Protein
- **Muscle preservation** during caloric deficit
- **Satiety** and appetite control
- **Thermic effect** (20-30% of protein calories burned in digestion)
- **Recovery** and muscle protein synthesis

#### Fat
- **Hormone production** (testosterone, estrogen, cortisol)
- **Vitamin absorption** (A, D, E, K)
- **Satiety** and flavor
- **Essential fatty acids** (omega-3, omega-6)

#### Carbohydrates
- **Primary energy source** for high-intensity exercise
- **Glycogen storage** in muscles and liver
- **Brain function** (glucose is primary fuel)
- **Recovery** and performance

## 5. Caloric Adjustments for Goals

### Weight Loss
- **Deficit**: 500 kcal/day (0.5 kg/week loss)
- **Range**: 300-1000 kcal deficit
- **Minimum**: Never below BMR

### Weight Gain
- **Surplus**: 300-500 kcal/day
- **Focus**: Lean muscle gain
- **Monitoring**: Body composition changes

### Maintenance
- **Target**: TDEE
- **Monitoring**: Weight stability over time

## 6. Implementation in App

### Calculation Flow
1. **Input Validation**: Age, height, weight, gender
2. **BMI Calculation**: Weight(kg) / Height(m)²
3. **BMR Calculation**: Mifflin-St Jeor equation
4. **TDEE Calculation**: BMR × Activity Factor
5. **Goal Adjustment**: TDEE ± deficit/surplus
6. **Macro Distribution**: Goal-specific ratios

### Scientific Accuracy
- **BMR**: Most accurate modern formula (Mifflin-St Jeor)
- **Activity Factors**: Based on extensive research
- **Macro Ratios**: Evidence-based ranges
- **Caloric Adjustments**: Sustainable and safe

## 7. Limitations and Considerations

### Individual Variability
- **Metabolism** varies between individuals
- **Body composition** affects BMR
- **Activity levels** may be underestimated
- **Hormonal factors** not fully captured

### Monitoring and Adjustment
- **Track progress** over 2-4 weeks
- **Adjust calories** based on results
- **Consider body composition** changes
- **Account for metabolic adaptation**

### Professional Guidance
- **Complex cases** may need professional input
- **Medical conditions** require specialized approaches
- **Athletes** may need sport-specific protocols
- **Older adults** may need adjusted formulas

## 8. References and Further Reading

### Key Research Papers
- Mifflin, M. D., et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals."
- Harris, J. A., & Benedict, F. G. (1919). "A biometric study of human basal metabolism."
- Hall, K. D., et al. (2012). "Quantification of the effect of energy imbalance on bodyweight."

### Professional Guidelines
- **ACSM** (American College of Sports Medicine)
- **ISSN** (International Society of Sports Nutrition)
- **AND** (Academy of Nutrition and Dietetics)

### Online Resources
- **NIH Body Weight Planner**
- **USDA Dietary Guidelines**
- **WHO BMI Guidelines**

---

*This documentation ensures the app uses scientifically validated methods for nutrition calculations while acknowledging individual variability and the need for professional guidance in complex cases.*
