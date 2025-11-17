// Log function initialization
console.log('API function file loaded at:', new Date().toISOString());

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Data storage file path - Note: In Vercel, this is ephemeral
// For production, consider using Vercel KV, MongoDB, or another database
const DATA_FILE = path.join('/tmp', 'user-data.json');

// Helper function to read user data
async function readUserData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Helper function to write user data
async function writeUserData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper function to get OpenAI client with user key (no fallback)
function getOpenAIClient(apiKeys) {
  const apiKey = apiKeys?.openai;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenAI API key is required. Please add your API key in Settings.');
  }
  return new OpenAI({ apiKey });
}

// API Routes

// Get user targets
app.get('/api/user/:userId/targets', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData();
    const userTargets = userData[userId]?.targets || null;
    
    res.json({ targets: userTargets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user targets' });
  }
});

// Save user targets
app.post('/api/user/:userId/targets', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targets } = req.body;
    
    const userData = await readUserData();
    if (!userData[userId]) {
      userData[userId] = {};
    }
    userData[userId].targets = targets;
    userData[userId].lastUpdated = new Date().toISOString();
    
    await writeUserData(userData);
    
    res.json({ success: true, message: 'Targets saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user targets' });
  }
});

// Get meal suggestions from OpenAI
app.post('/api/suggestions', async (req, res) => {
  try {
    const { userProfile, remainingCalories, macros, preferences, apiKeys } = req.body;
    
    const prompt = `You are a nutrition expert. Based on the following user profile and requirements, suggest 5 healthy meal options:

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}

Current Status:
- Remaining Calories: ${remainingCalories}
- Protein Target: ${macros.protein}g
- Carbs Target: ${macros.carbs}g
- Fats Target: ${macros.fats}g

Preferences: ${preferences || 'No specific preferences'}

Please suggest 5 meal options that:
1. Fit within the remaining calorie budget
2. Help meet macro targets
3. Are healthy and nutritious
4. Include Indian cuisine options
5. Provide variety

For each meal, provide:
- Name
- Estimated calories
- Protein, carbs, and fats in grams
- Brief description
- Category (Breakfast, Lunch, Dinner, Snack)

Format as JSON array with objects containing: name, calories, protein, carbs, fats, description, category`;

    const openaiClient = getOpenAIClient(apiKeys);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful nutrition expert specializing in Indian cuisine and healthy meal planning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const suggestions = JSON.parse(completion.choices[0].message.content);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.message && error.message.includes('API key is required')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate meal suggestions' });
    }
  }
});

// Get nutrition analysis from OpenAI
app.post('/api/analyze-meal', async (req, res) => {
  try {
    const { mealDescription, apiKeys } = req.body;
    
    const prompt = `Analyze the following meal and provide detailed nutrition information:

Meal: "${mealDescription}"

Please provide:
1. Estimated calories per serving
2. Protein content in grams
3. Carbohydrates content in grams
4. Fats content in grams
5. Category (Breakfast, Lunch, Dinner, Snack, etc.)
6. Brief description

Format as JSON object with: calories, protein, carbs, fats, category, description`;

    const openaiClient = getOpenAIClient(apiKeys);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in Indian cuisine and food analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    res.json({ analysis });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.message && error.message.includes('API key is required')) {
      res.status(400).json({ error: error.message });
    } else if (error.status === 429) {
      res.status(503).json({ 
        error: 'OpenAI quota exceeded. Please check your billing and try again later.',
        details: 'Your OpenAI account has exceeded its quota. Please check your billing settings at https://platform.openai.com/settings/organization/billing'
      });
    } else {
      res.status(500).json({ error: 'Failed to analyze meal' });
    }
  }
});

// Parse menu text using AI
app.post('/api/parse-menu', async (req, res) => {
  try {
    const { menuText, userProfile, remainingCalories, macros, preferences, apiKeys } = req.body;
    
    const prompt = `You are a nutrition expert. Parse the following menu text and extract food items with their nutritional information.

Menu Text:
"${menuText}"

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}

Current Status:
- Remaining Calories: ${remainingCalories}
- Protein Target: ${macros.protein}g
- Carbs Target: ${macros.carbs}g
- Fats Target: ${macros.fats}g

Preferences: ${preferences || 'No specific preferences'}

Please:
1. Parse the menu text and extract all food items
2. For each item, estimate nutritional values (calories, protein, carbs, fats)
3. Categorize each item (Breakfast, Lunch, Dinner, Snack, etc.)
4. Consider the user's profile and goals
5. Focus on Indian cuisine and common food items

For each food item, provide:
- Name (clean, readable format)
- Calories per serving
- Protein in grams
- Carbs in grams
- Fats in grams
- Category
- Brief description

Format as JSON array with objects containing: name, calories, protein, carbs, fats, category, description`;

    const openaiClient = getOpenAIClient(apiKeys);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in Indian cuisine and food analysis. Parse menu text accurately and provide detailed nutritional information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const parsedItems = JSON.parse(completion.choices[0].message.content);
    
    res.json({ items: parsedItems });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.message && error.message.includes('API key is required')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Fallback to local parsing when AI fails for any reason
    console.log('AI parsing failed, falling back to local parsing...');
    
    try {
        // Simple local parsing fallback
        console.log('Menu text received:', menuText);
        const lines = menuText.split('\n').filter(line => line.trim());
        console.log('Lines found:', lines);
        const items = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          console.log('Processing line:', line);
          if (line && !line.includes('S.No') && !line.includes('Item') && !line.includes('Qty')) {
            // Extract item name - try different delimiters
            let parts = line.split('\t');
            if (parts.length === 1) {
              parts = line.split(' ');
            }
            
            const itemName = parts[1] || parts[0] || line;
            console.log('Extracted item name:', itemName);
            
            // Basic nutrition estimation
            const calories = Math.floor(Math.random() * 200) + 100; // 100-300 calories
            const protein = Math.floor(calories * 0.15 / 4); // 15% protein
            const carbs = Math.floor(calories * 0.5 / 4); // 50% carbs
            const fats = Math.floor(calories * 0.35 / 9); // 35% fats
            
            items.push({
              name: itemName.trim(),
              calories: calories,
              protein: protein,
              carbs: carbs,
              fats: fats,
              category: 'Lunch',
              description: `Parsed from menu: ${itemName.trim()}`
            });
          }
        }
        
        console.log('Parsed items:', items);
        
        res.json({ 
          items: items,
          fallback: true,
          message: 'AI parsing unavailable. Using basic local parsing.'
        });
      } catch (fallbackError) {
        console.error('Fallback parsing error:', fallbackError);
        res.status(500).json({ 
          error: 'Failed to parse menu',
          details: 'Both AI and local parsing failed. Please check your menu format.'
        });
      }
  }
});

// Get 3 meal suggestions based on user text input
app.post('/api/suggest-meals', async (req, res) => {
  try {
    const { userText, userProfile, remainingCalories, macros, apiKeys } = req.body;
    
    const prompt = `You are a nutrition expert. Based on the user's text input and profile, suggest exactly 3 healthy meal options.

User Text: "${userText}"

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}

Current Status:
- Remaining Calories: ${remainingCalories}
- Protein Target: ${macros.protein}g
- Carbs Target: ${macros.carbs}g
- Fats Target: ${macros.fats}g

Please suggest exactly 3 meal options that:
1. Are inspired by or related to the user's text input
2. Fit within the remaining calorie budget
3. Help meet macro targets
4. Are healthy and nutritious
5. Include Indian cuisine options when relevant
6. Provide variety

For each meal, provide:
- Name
- Estimated calories
- Protein, carbs, and fats in grams
- Brief description
- Category (Breakfast, Lunch, Dinner, Snack)

Format as JSON array with exactly 3 objects containing: name, calories, protein, carbs, fats, description, category`;

    const openaiClient = getOpenAIClient(apiKeys);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful nutrition expert specializing in Indian cuisine and healthy meal planning. Always provide exactly 3 meal suggestions based on user input."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const suggestions = JSON.parse(completion.choices[0].message.content);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.message && error.message.includes('API key is required')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate meal suggestions' });
    }
  }
});

// Get user's meal log
app.get('/api/user/:userId/logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await readUserData();
    const userLogs = userData[userId]?.logs || [];
    
    res.json({ logs: userLogs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
});

// Save meal log entry
app.post('/api/user/:userId/logs', async (req, res) => {
  try {
    const { userId } = req.params;
    const { meal } = req.body;
    
    const userData = await readUserData();
    if (!userData[userId]) {
      userData[userId] = {};
    }
    if (!userData[userId].logs) {
      userData[userId].logs = [];
    }
    
    const logEntry = {
      ...meal,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    userData[userId].logs.push(logEntry);
    await writeUserData(userData);
    
    res.json({ success: true, logEntry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save meal log' });
  }
});

// Delete meal log entry
app.delete('/api/user/:userId/logs/:logId', async (req, res) => {
  try {
    const { userId, logId } = req.params;
    
    const userData = await readUserData();
    if (userData[userId]?.logs) {
      userData[userId].logs = userData[userId].logs.filter(log => log.id !== logId);
      await writeUserData(userData);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meal log' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generate day plans with breakfast/lunch/dinner using AI
app.post('/api/generate-day-plans', async (req, res) => {
  try {
    const { menuItems, userProfile, remainingCalories, macros, apiKeys } = req.body;
    
    const prompt = `You are a nutrition expert. Based on the available menu items and user profile, create 3 complete day plans. Each day plan should include breakfast, lunch, and dinner.

Available Menu Items:
${menuItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.calories} cal, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fats}g fats)`).join('\n')}

User Profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height}cm
- Weight: ${userProfile.weight}kg
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}

Current Status:
- Remaining Calories: ${remainingCalories}
- Protein Target: ${macros.protein}g
- Carbs Target: ${macros.carbs}g
- Fats Target: ${macros.fats}g

Please create 3 different day plans. Each day plan should:
1. Include breakfast, lunch, and dinner
2. Use items from the available menu items
3. Fit within the remaining calorie budget
4. Help meet macro targets
5. Provide variety across the 3 plans
6. Focus on Indian cuisine

For each day plan, provide:
- Plan name
- Breakfast: item name, calories, protein, carbs, fats
- Lunch: item name, calories, protein, carbs, fats
- Dinner: item name, calories, protein, carbs, fats
- Total calories, protein, carbs, fats for the day

Format as JSON array with 3 objects. Each object should have:
{
  "name": "Day Plan Name",
  "breakfast": { "name": "...", "calories": ..., "protein": ..., "carbs": ..., "fats": ... },
  "lunch": { "name": "...", "calories": ..., "protein": ..., "carbs": ..., "fats": ... },
  "dinner": { "name": "...", "calories": ..., "protein": ..., "carbs": ..., "fats": ... },
  "totalCalories": ...,
  "totalProtein": ...,
  "totalCarbs": ...,
  "totalFats": ...
}`;

    const openaiClient = getOpenAIClient(apiKeys);
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in Indian cuisine and meal planning. Create complete day plans with breakfast, lunch, and dinner."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const dayPlans = JSON.parse(completion.choices[0].message.content);
    
    res.json({ dayPlans });
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.message && error.message.includes('API key is required')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate day plans' });
    }
  }
});

// Test endpoint for menu parsing
app.post('/api/test-parse', (req, res) => {
  try {
    const { menuText } = req.body;
    console.log('Test parsing menu:', menuText);
    
    const lines = menuText.split('\n').filter(line => line.trim());
    console.log('Lines found:', lines);
    const items = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log('Processing line:', line);
      
      // Skip header lines
      if (line && !line.includes('S.No') && !line.includes('Item') && !line.includes('Qty') && !line.includes('Calorie') && !line.includes('Allergens')) {
        // Try to extract item name from table format
        let itemName = line;
        if (line.includes('\t')) {
          const parts = line.split('\t');
          // Look for the item name (usually in the second column)
          itemName = parts[1] || parts[0];
        }
        
        // Basic nutrition estimation
        const calories = Math.floor(Math.random() * 200) + 100;
        const protein = Math.floor(calories * 0.15 / 4);
        const carbs = Math.floor(calories * 0.5 / 4);
        const fats = Math.floor(calories * 0.35 / 9);
        
        items.push({
          name: itemName.trim(),
          calories: calories,
          protein: protein,
          carbs: carbs,
          fats: fats,
          category: 'Lunch',
          description: `Parsed from menu: ${itemName.trim()}`
        });
      }
    }
    
    console.log('Test parsed items:', items);
    res.json({ items: items, test: true });
  } catch (error) {
    console.error('Test parsing error:', error);
    res.status(500).json({ error: 'Test parsing failed' });
  }
});

// Add a catch-all route for debugging (should be last)
app.use((req, res) => {
  console.log('No route matched:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl
  });
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    url: req.url,
    path: req.path
  });
});

// Export as Vercel serverless function
// Vercel automatically routes /api/* to /api/index.js
// The req.url will be the path AFTER /api (e.g., /api/health -> /health)
// Express routes are defined with /api prefix, so we need to normalize the URL
module.exports = (req, res) => {
  // Immediate response test - if this works, the function is being invoked
  // Log for debugging - this should appear in Vercel function logs
  console.log('=== API Function Invoked ===');
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query
  });
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  
  try {
    // Vercel strips the /api prefix when routing to /api/index.js
    // So /api/health becomes /health in req.url
    // We need to add /api back for Express routes
    let requestUrl = req.url || req.path || '/';
    let queryString = '';
    
    // Extract query string if present
    if (requestUrl.includes('?')) {
      const parts = requestUrl.split('?');
      requestUrl = parts[0];
      queryString = '?' + parts[1];
    }
    
    // Ensure URL starts with /
    if (!requestUrl.startsWith('/')) {
      requestUrl = '/' + requestUrl;
    }
    
    // If URL doesn't start with /api, add it
    if (!requestUrl.startsWith('/api')) {
      const normalizedPath = '/api' + requestUrl;
      req.url = normalizedPath + queryString;
      req.path = normalizedPath;
      // Preserve originalUrl
      if (!req.originalUrl) {
        req.originalUrl = normalizedPath + queryString;
      } else if (!req.originalUrl.startsWith('/api')) {
        req.originalUrl = normalizedPath + queryString;
      }
    } else {
      // URL already has /api prefix
      req.url = requestUrl + queryString;
      req.path = requestUrl;
      if (!req.originalUrl) {
        req.originalUrl = requestUrl + queryString;
      }
    }
    
    console.log('Normalized URL:', {
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    // Handle the request with Express
    app(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};
