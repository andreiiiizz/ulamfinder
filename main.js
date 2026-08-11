require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'Ulam Finder',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// Handles every AI call from the renderer. The API key never leaves this
// process, so it's never exposed to the app's front-end code.
ipcMain.handle('ai-call', async (_event, prompt) => {
  if (!API_KEY) {
    return { error: { message: 'No GOOGLE_API_KEY found. Add one to your .env file (see .env.example) and restart the app.' } };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: { message: (data && data.error && data.error.message) || `API request failed: ${response.status}` } };
    }
    return data;
  } catch (err) {
    return { error: { message: err.message || 'Network error calling the Gemini API' } };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
