// backend/controllers/chatbot.js
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ChatbotLog = require('../models/chatbotLog');

// Get Python executable path based on OS
// Try multiple options to find a working Python installation
const getPythonPath = () => {
  const candidates = [
    process.platform === 'win32' 
      ? path.normalize('C:/Users/ahmdm/AppData/Local/Programs/Python/Python312/python.exe')
      : 'python3',
    'python',
    process.platform === 'win32' ? 'python.exe' : 'python3',
  ];
  
  // Test each candidate
  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate, ['--version'], { stdio: 'pipe', timeout: 2000 });
      if (result.status === 0) {
        return candidate;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  
  // Default fallback
  return candidates[0];
};

const pythonPath = getPythonPath();

/**
 * Main chatbot handler: processes user messages and streams them through Python AI engine.
 * Detects user role (admin/student) and passes context to the AI engine.
 * Logs all conversations to ChatbotLog for analytics.
 */
const chatWithBot = async (req, res) => {
  const { message } = req.body;
  const userId = req.user ? req.user._id : 'anonymous';
  const userRole = req.user ? req.user.role : 'guest'; // Extract role from JWT token

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'Invalid message format' });
  }

  try {
    // Verify Python script exists
    const scriptPath = path.resolve(__dirname, '..', 'ai', 'chatbot.py');
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Chatbot script not found at ${scriptPath}`);
    }

    // Spawn Python process with proper path handling
    // Pass PYTHONIOENCODING to ensure Python uses UTF-8 for stdout/stderr on Windows
    // Pass the message, userId, and role as command-line arguments so the Python
    // script runs non-interactively and returns a single JSON response.
    const args = [scriptPath, message];
    if (userId) args.push(String(userId));
    if (userRole) args.push(String(userRole));

    const python = spawn(pythonPath, args, {
      env: Object.assign({}, process.env, { 
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      }),
      stdio: ['ignore', 'pipe', 'pipe'], // Allow stderr to be captured
      timeout: 10000
    });
    
    let output = '';
    let errorOutput = '';
    let processCompleted = false;

    // Collect output
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process completion
    python.on('close', async (code) => {
      if (processCompleted) return; // Prevent double response
      processCompleted = true;

      if (code !== 0) {
        console.error(`[CHATBOT] Python process exited with code ${code}`);
        console.error(`[CHATBOT] stderr:`, errorOutput.substring(0, 500));
        console.error(`[CHATBOT] stdout:`, output.substring(0, 500));
        
        // Try to extract meaningful error message
        let errorMsg = 'Chatbot failed to process your message';
        if (errorOutput.includes('ModuleNotFoundError')) {
          errorMsg = 'Chatbot dependencies not installed. Please run: pip install -r requirements.txt';
        } else if (errorOutput.includes('ImportError')) {
          errorMsg = 'Chatbot import error. Check Python environment.';
        }
        
        return res.status(500).json({ 
          message: errorMsg,
          error: errorOutput.substring(0, 200)
        });
      }

      // Try to parse structured JSON response from Python script
      // Filter out console noise (pygame, warnings, etc.) by extracting only JSON lines
      let reply = output.trim();
      let navigate = null;
      let action = null;
      
      try {
        // Split by newlines and find the last JSON-like line (filters pygame noise and warnings)
        const lines = output.trim().split('\n');
        let jsonLine = null;
        
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              JSON.parse(line); // Validate it's valid JSON
              jsonLine = line;
              break;
            } catch (e) {
              // Not valid JSON, continue searching
            }
          }
        }
        
        if (jsonLine) {
          const parsed = JSON.parse(jsonLine);
          if (parsed && typeof parsed === 'object') {
            if (parsed.reply) reply = parsed.reply;
            if (parsed.navigate) navigate = parsed.navigate;
            if (parsed.action) action = parsed.action;
          }
        } else if (output.trim()) {
          // If no JSON found but we have output, use it as reply
          reply = output.trim();
        } else {
          // No output at all - Python script didn't produce output
          return res.status(500).json({ 
            message: 'Chatbot produced no response',
            error: 'Python script did not generate output'
          });
        }
      } catch (e) {
        // Failed to parse JSON, but we have some output
        console.debug('[CHATBOT] Failed to parse JSON from Python output:', e.message);
        reply = output.trim() || 'Sorry, I encountered an error processing your message.';
      }

      try {
        // Save to chat log with metadata
        const logEntry = await ChatbotLog.create({
          userId: userId !== 'anonymous' ? userId : null,
          role: userRole,
          messages: [
            {
              sender: 'user',
              text: message,
              timestamp: new Date()
            },
            {
              sender: 'bot',
              text: reply,
              timestamp: new Date()
            }
          ]
        });

        console.log(`[CHATBOT LOG] User: ${userId}, Role: ${userRole}, Message: ${message.substring(0, 50)}...`);

        // Send reply and optional navigate/action instructions
        const payload = { reply };
        if (navigate) payload.navigate = navigate;
        if (action) payload.action = action;
        res.json(payload);
      } catch (err) {
        console.error('[CHATBOT] Error saving chat log:', err.message);
        const payload = { reply };
        if (navigate) payload.navigate = navigate;
        if (action) payload.action = action;
        // Still send the reply even if logging fails
        res.json(payload);
      }
    });

    // Handle process errors (e.g., spawn failures)
    python.on('error', (err) => {
      if (processCompleted) return;
      processCompleted = true;
      
      console.error('[CHATBOT] Failed to spawn Python process:', err.message);
      res.status(500).json({ 
        message: 'Failed to start chatbot process',
        error: err.message
      });
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!processCompleted) {
        processCompleted = true;
        python.kill();
        if (!res.headersSent) {
          console.error('[CHATBOT] Process timeout after 10 seconds');
          res.status(504).json({ 
            message: 'Chatbot response timed out. Please try again.'
          });
        }
      }
    }, 10000);

    // Clear timeout on process exit
    python.on('close', () => {
      clearTimeout(timeoutId);
    });

  } catch (err) {
    console.error('[CHATBOT] Error:', err.message);
    res.status(500).json({ 
      message: 'Failed to process your message',
      error: err.message
    });
  }
};

/**
 * Get chatbot conversation logs (admin only).
 * Returns paginated conversation history for analytics.
 */
const getChatLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const query = userId ? { userId } : {};
    
    const logs = await ChatbotLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email');

    const total = await ChatbotLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (err) {
    console.error('Error fetching chat logs:', err);
    res.status(500).json({ message: 'Failed to fetch chat logs', error: err.message });
  }
};

/**
 * Get conversation statistics (admin only).
 * Returns insights into chatbot usage and performance.
 */
const getChatStats = async (req, res) => {
  try {
    const stats = await ChatbotLog.aggregate([
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          averageMessagesPerConversation: { $avg: { $size: '$messages' } },
          totalMessages: {
            $sum: { $size: '$messages' }
          }
        }
      }
    ]);

    const roleStats = await ChatbotLog.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overall: stats[0] || { totalConversations: 0, averageMessagesPerConversation: 0, totalMessages: 0 },
      byRole: roleStats
    });
  } catch (err) {
    console.error('Error fetching chat stats:', err);
    res.status(500).json({ message: 'Failed to fetch chat stats', error: err.message });
  }
};

module.exports = { chatWithBot, getChatLogs, getChatStats };
