# Nutrition Planner App - Setup Guide

This app now includes OpenAI integration for AI-powered meal suggestions and persistent storage for user data.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
npm install --prefix . express cors openai nodemon
```

### 2. Set up Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your-openai-api-key-here
PORT=3001
```

### 3. Start the Backend Server

```bash
# Start the server
node server.js

# Or for development with auto-restart
npx nodemon server.js
```

The server will run on `http://localhost:3001`

### 4. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

### AI-Powered Features
- **Smart Meal Suggestions**: Get personalized meal recommendations based on your profile and remaining calories
- **Meal Analysis**: AI analyzes your meal descriptions and provides accurate nutrition information
- **Indian Cuisine Focus**: Optimized for Indian food items and nutrition patterns

### Data Persistence
- **User Targets**: Your calculated calorie and macro targets are saved automatically
- **Meal Logs**: All your logged meals are stored and persist between sessions
- **Profile Data**: Your user profile information is maintained

### Backend API Endpoints

- `GET /api/health` - Health check
- `GET /api/user/:userId/targets` - Get user targets
- `POST /api/user/:userId/targets` - Save user targets
- `POST /api/suggestions` - Get AI meal suggestions
- `POST /api/analyze-meal` - Analyze meal nutrition
- `GET /api/user/:userId/logs` - Get user meal logs
- `POST /api/user/:userId/logs` - Save meal log entry
- `DELETE /api/user/:userId/logs/:logId` - Delete meal log entry

## Usage

1. **Complete Onboarding**: Enter your profile information (age, gender, height, weight, activity level, goal)
2. **View Targets**: See your calculated BMI, BMR, TDEE, and daily calorie/macro targets
3. **Get AI Suggestions**: Use the "AI Suggestions" button to get personalized meal recommendations
4. **Log Meals**: Add meals manually or select from suggestions
5. **Track Progress**: Monitor your daily intake against targets

## Data Storage

User data is stored in `user-data.json` in the server directory. This includes:
- User profiles and calculated targets
- Meal logs with timestamps
- AI-generated suggestions

## Troubleshooting

### Server Connection Issues
- Ensure the backend server is running on port 3001
- Check that your OpenAI API key is correctly set
- Verify CORS settings if running on different ports

### OpenAI API Issues
- Ensure you have sufficient API credits
- Check that your API key has the correct permissions
- Verify the API key is correctly set in the environment variables

### Data Persistence Issues
- Check that the server has write permissions to the directory
- Ensure the `user-data.json` file is not corrupted
- Restart the server if data seems inconsistent

## Development

### Adding New Features
1. Update the API endpoints in `server.js`
2. Add corresponding functions in `src/services/api.ts`
3. Update the context in `src/contexts/UserContext.tsx`
4. Modify components to use the new functionality

### Testing
- Test API endpoints using tools like Postman or curl
- Verify data persistence by restarting the server
- Check AI responses for accuracy and relevance

## Production Deployment

For production deployment:

1. Set up a proper database (PostgreSQL, MongoDB, etc.)
2. Implement proper authentication
3. Add rate limiting for API endpoints
4. Set up monitoring and logging
5. Use environment variables for all configuration
6. Implement proper error handling and validation

## Support

If you encounter any issues:
1. Check the browser console for frontend errors
2. Check the server console for backend errors
3. Verify all dependencies are installed correctly
4. Ensure all environment variables are set properly
