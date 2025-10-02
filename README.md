<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15iJRCk7HI8fCIcbVLxb5oozy4CRCE1Yg

## Run Locally

**Prerequisites:**  Node.js (version 16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a `.env.local` file in the project root
   - Add your API key:
     ```
     VITE_GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - Allow camera permissions when prompted

## Features

- 🎨 AI-powered face stylization using Google's Gemini API
- 📷 Real-time webcam capture
- 🖼️ Transform faces into US animation style
- ⚡ Built with React, TypeScript, and Vite
- 🎯 MediaPipe for accurate face detection

## Troubleshooting

- **API Key Error:** Make sure your `.env.local` file contains a valid Gemini API key
- **Camera Access:** Ensure your browser has permission to access your camera
- **Build Issues:** Try deleting `node_modules` and running `npm install` again
