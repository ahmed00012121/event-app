const Feedback = require('../models/feedback');
const path = require('path');
const { exec } = require('child_process');
const mongoose = require('mongoose');
const pythonPath = 'C:/Users/ahmdm/AppData/Local/Programs/Python/Python312/python.exe';
const scriptPath = path.resolve(__dirname, '..', 'ai', 'feedback.py');

// Submit feedback + sentiment analysis via Python script
const submitFeedback = async (req, res) => {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            message: 'Database connection unavailable. Please try again later.',
            code: 'DB_UNAVAILABLE'
        });
    }

    const { eventId, message } = req.body;
    
    // Validate input
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
            message: 'Message is required',
            code: 'INVALID_INPUT'
        });
    }

    try {
        // Attempt to run Python sentiment script but fallback gracefully
        const analyzeSentiment = () => new Promise((resolve) => {
            // Basic JS fallback sentiment analyzer
            const basicSentiment = (text) => {
                const pos = ['good','great','excellent','love','nice','happy','awesome','fantastic'];
                const neg = ['bad','poor','terrible','hate','awful','sad','disappoint'];
                const t = (text || '').toLowerCase();
                let score = 0;
                pos.forEach(w => { if (t.includes(w)) score++; });
                neg.forEach(w => { if (t.includes(w)) score--; });
                if (score > 0) return 'positive';
                if (score < 0) return 'negative';
                return 'neutral';
            };

            // Try to spawn python script and send message via stdin (JSON)
            try {
                const { spawn } = require('child_process');

                // Try possible python commands (allow system python or configured path)
                const pythonCandidates = [];
                if (pythonPath) pythonCandidates.push(pythonPath);
                pythonCandidates.push('python');
                pythonCandidates.push('python3');

                let tried = 0;
                const tryNext = () => {
                    if (tried >= pythonCandidates.length) {
                        // no python available, fallback
                        return resolve(basicSentiment(message));
                    }

                    const cmd = pythonCandidates[tried++];
                    let finished = false;

                    try {
                        const py = spawn(cmd, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
                        let out = '';
                        let errOut = '';

                        // send JSON payload via stdin
                        try {
                            py.stdin.write(JSON.stringify({ message }));
                        } catch (wErr) {}
                        py.stdin.end();

                        py.stdout.on('data', (d) => { out += d.toString(); });
                        py.stderr.on('data', (d) => { errOut += d.toString(); });

                        const timeout = setTimeout(() => {
                            if (!finished) {
                                finished = true;
                                try { py.kill(); } catch (e) {}
                                // try next candidate
                                tryNext();
                            }
                        }, 9000);

                        py.on('close', (code) => {
                            if (finished) return;
                            finished = true;
                            clearTimeout(timeout);
                            if (code !== 0) {
                                // try next candidate
                                return tryNext();
                            }
                            try {
                                const parsed = JSON.parse(out.trim());
                                if (parsed && parsed.sentiment) return resolve(parsed.sentiment);
                            } catch (parseErr) {
                                // fallback to text output parsing
                                const s = (out || '').trim().toLowerCase();
                                if (['positive','negative','neutral'].includes(s)) return resolve(s);
                            }
                            // fallback JS heuristic
                            return resolve(basicSentiment(message));
                        });

                        py.on('error', (err) => {
                            // try next candidate
                            if (!finished) {
                                finished = true;
                                tryNext();
                            }
                        });
                    } catch (err) {
                        // try the next python candidate
                        tryNext();
                    }
                };

                tryNext();

            } catch (e) {
                // If spawn throws or python not found, fallback
                console.warn('Python sentiment failed, falling back to basic JS:', e && e.message);
                return resolve(basicSentiment(message));
            }
        });

        const sentiment = await analyzeSentiment();

        const feedbackObj = {
            student: req.user._id,
            message,
            sentiment
        };
        if (eventId) feedbackObj.event = eventId;

        const feedback = await Feedback.create(feedbackObj);
        res.status(201).json(feedback);
    } catch (err) {
        console.error('Feedback submission error:', err);
        res.status(500).json({ 
            message: 'Could not process feedback, please try again',
            error: err.message
        });
    }
};

// Get all feedback (Admin sees all, Student sees own)
const getFeedback = async (req, res) => {
    try {
        let feedbacks;
        if (req.user.role === 'admin') {
            feedbacks = await Feedback.find()
                .populate('student', 'name email')
                .populate('event', 'title date');
        } else {
            feedbacks = await Feedback.find({ student: req.user._id })
                .populate('event', 'title date');
        }
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { submitFeedback, getFeedback };
