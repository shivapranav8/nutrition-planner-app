const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('=== Gemini API Diagnostic Tool ===\n');
console.log('API Key loaded:', !!API_KEY);
console.log('API Key starts with:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT SET');
console.log('API Key length:', API_KEY ? API_KEY.length : 0);
console.log('\n');

if (!API_KEY || API_KEY === 'your-gemini-api-key-here') {
  console.error('❌ ERROR: Gemini API key not set or using placeholder value');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function diagnose() {
  console.log('1. Testing API Key with direct HTTP call...\n');
  
  try {
    // Test 1: Direct API call to list models
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    const data = response.data;
    
    if (data.error) {
      console.error('❌ API Error:', data.error.message);
      console.error('   Code:', data.error.code);
      console.error('   Status:', data.error.status);
      
      if (data.error.status === 'PERMISSION_DENIED') {
        console.error('\n💡 SOLUTION: The API key may not have access to Generative AI API.');
        console.error('   Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        console.error('   Enable "Generative Language API" for your project.');
      } else if (data.error.status === 'INVALID_ARGUMENT') {
        console.error('\n💡 SOLUTION: The API key may be invalid or expired.');
        console.error('   Get a new key from: https://aistudio.google.com/apikey');
      }
    } else if (data.models && data.models.length > 0) {
      console.log('✅ API Key is valid!');
      console.log(`\n📋 Available models (${data.models.length}):`);
      data.models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name}`);
        if (model.supportedGenerationMethods) {
          console.log(`      Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
      
      // Find models that support generateContent
      const generateContentModels = data.models.filter(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
      );
      
      if (generateContentModels.length > 0) {
        console.log(`\n✅ Models supporting generateContent (${generateContentModels.length}):`);
        generateContentModels.forEach((model, index) => {
          const modelName = model.name.replace('models/', '');
          console.log(`   ${index + 1}. ${modelName}`);
        });
        
        // Test with the first available model
        const testModel = generateContentModels[0];
        const modelName = testModel.name.replace('models/', '');
        console.log(`\n2. Testing with model: ${modelName}...\n`);
        
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent('Say hello in one word');
          console.log('✅ SUCCESS! Model is working!');
          console.log('   Response:', result.response.text());
          console.log(`\n💡 Use this model name in your server: "${modelName}"`);
        } catch (testError) {
          console.error('❌ Model test failed:', testError.message);
        }
      } else {
        console.error('\n❌ No models found that support generateContent');
      }
    } else {
      console.error('❌ Unexpected response format:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
    console.error('   This might indicate:');
    console.error('   - Internet connection issue');
    console.error('   - API endpoint changed');
    console.error('   - Firewall blocking the request');
  }
  
  console.log('\n=== Diagnostic Complete ===');
}

diagnose().catch(console.error);

