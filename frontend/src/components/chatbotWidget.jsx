/**
 * Enhanced ChatbotWidget with role-based responses and action handling
 * Supports:
 * - Admin: stats, feedback summaries, user management queries
 * - Students: event listings, registrations, recommendations
 * - Both: navigation, voice control, notification access
 */

import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import aiService from "../services/aiService";
import "../assets/shared/chatbot.css";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // Get user context - check AuthContext first, fallback to localStorage
  // Avoid destructuring a possibly undefined context value which throws at runtime
  const ctx = useContext(AuthContext);
  const ctxUser = ctx?.user ?? null;
  const localUser = ctxUser || JSON.parse(localStorage.getItem("user") || "null");
  const userRole = (localUser && localUser.role) ? localUser.role : (localStorage.getItem("role") || "guest");
  const userId = (localUser && localUser._id) ? localUser._id : (localStorage.getItem("userId") || null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Log computed styles when widget opens to help diagnose invisible/overlay issues
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      try {
        const el = document.querySelector('.chatbot-container');
        if (!el) {
          console.warn('chatbot-container not found in DOM');
          return;
        }
        const cs = getComputedStyle(el);
        console.debug('chatbot-container computed style:', {
          display: cs.display,
          position: cs.position,
          width: cs.width,
          height: cs.height,
          top: cs.top,
          bottom: cs.bottom,
          left: cs.left,
          right: cs.right,
          zIndex: cs.zIndex,
          background: cs.backgroundColor,
          opacity: cs.opacity
        });
      } catch (e) {
        console.error('Error reading chatbot-container styles', e);
      }
    }, 120);
  }, [isOpen]);
  // (Debug marker removed) - widget now uses CSS from chatbot.css only

  // Initialize browser SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recog = new SpeechRecognition();
        recog.lang = "en-US";
        recog.continuous = false;
        recog.interimResults = true;
        recog.maxAlternatives = 1;
        
        recog.onstart = () => {
          setListening(true);
          setVoiceEnabled(true);
        };

        recog.onresult = (event) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          setInputMessage(result.isFinal ? transcript : transcript + "...");
          if (result.isFinal) {
            setTimeout(() => sendMessageFromVoice(transcript), 200);
          }
        };

        recog.onend = () => {
          setListening(false);
          setVoiceEnabled(false);
        };

        recog.onerror = (err) => {
          console.error("Speech recognition error", err);
          setListening(false);
          setVoiceEnabled(false);
        };
        
        recognitionRef.current = recog;
      } catch (err) {
        console.warn("SpeechRecognition init failed", err);
        recognitionRef.current = null;
      }
    }
    
    return () => {
      try {
        if (recognitionRef.current) recognitionRef.current.onresult = null;
      } catch (e) {}
    };
  }, []);

  // Play bot reply using Web Speech API (TTS)
  const speak = (text) => {
    try {
      if (!text) return;
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      synth.speak(utter);
    } catch (e) {
      console.error("TTS error", e);
    }
  };

  /**
   * Handle user message submission.
   * Sends to backend chatbot API and processes response.
   */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    
    try {
      setIsLoading(true);
      await processMessage(userMessage);
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages(prev => [...prev, { 
        text: `Error: ${err.message || "Failed to get response. Please try again."}`, 
        sender: "bot",
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle voice-to-text message
   */
  const sendMessageFromVoice = async (transcript) => {
    if (!transcript || !transcript.trim()) return;
    setMessages(prev => [...prev, { text: transcript.trim(), sender: "user", transcribed: true }]);
    setInputMessage("");
    
    try {
      setIsLoading(true);
      await processMessage(transcript);
    } catch (err) {
      console.error("Chatbot error (voice):", err);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble responding. Please try again.", 
        sender: "bot", 
        error: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Core message processing logic
   * Handles responses from chatbot backend and processes actions
   */
  const processMessage = async (text) => {
    try {
      // Call chatbot backend API
      const data = await aiService.sendMessage(text);
      
      // Extract response fields
      const botReply = data && (data.reply || (typeof data === "string" ? data : "")) || "Sorry, I did not understand that.";
      const action = data && data.action;
      const navigateRoute = data && data.navigate;

      // Add bot message to chat
      setMessages(prev => [...prev, { text: botReply, sender: "bot", action }]);
      
      // Speak if voice enabled
      if (voiceEnabled) speak(botReply);

      // ===== HANDLE ACTIONS =====
      
      // Navigation action
      if (navigateRoute && typeof navigateRoute === "string" && navigateRoute.startsWith("/")) {
        setTimeout(() => {
          setIsOpen(false);
          navigate(navigateRoute);
        }, 500);
      }

      // Registration action
      if (action === "register") {
        console.log("Registration action detected");
        if (navigateRoute) {
          setTimeout(() => {
            setIsOpen(false);
            navigate(navigateRoute);
          }, 1500);
        }
      }

      // Voice toggle action
      if (action === "toggle_voice") {
        setVoiceEnabled(prev => !prev);
      }

      // Show stats action (display-only, already in reply)
      if (action === "show_stats") {
        console.log("Admin stats displayed");
      }

      // Show feedback action (display-only, already in reply)
      if (action === "show_feedback") {
        console.log("Feedback summary displayed");
      }

    } catch (err) {
      console.error("processMessage error:", err);
      throw err;
    }
  };

  /**
   * Toggle voice control
   */
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      console.error("Voice is not supported in this browser.");
      return;
    }

    if (!listening) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(t => t.stop());
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error("start recognition failed", err);
            }
          })
          .catch(err => {
            console.error("Microphone permission error", err);
            setListening(false);
            setVoiceEnabled(false);
          });
      } else {
        console.error("Microphone API not supported.");
        setListening(false);
        setVoiceEnabled(false);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("stop recognition failed", err);
      }
    }
  };

  // ===== RENDER =====
  return (
    <div className={`chatbot-widget ${isOpen ? "open" : ""}`}>
      <button 
        className="chatbot-toggle"
        onClick={() => {
          console.debug('Chatbot toggle clicked, isOpen ->', !isOpen);
          setIsOpen(!isOpen);
        }}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        title={`Open Event Assistant${userRole ? ` (${userRole})` : ""}`}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Event Assistant</h3>
            {userRole && (
              <span className="role-badge" style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: userRole === "admin" ? "#ff6b6b" : "#4ecdc4",
                color: "white",
                marginLeft: "auto"
              }}>
                {userRole}
              </span>
            )}
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>👋 Hi! I'm your event assistant.</p>
                <p style={{ fontSize: "0.9rem", marginTop: "10px", opacity: 0.8 }}>
                  {userRole === "admin" 
                    ? "Ask me about stats, feedback, or user management."
                    : userRole === "student"
                    ? "Ask me about events, registrations, or recommendations."
                    : "Ask me about events and how to get started."}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`message ${msg.sender} ${msg.error ? "error" : ""}`}
                  style={msg.transcribed ? { fontStyle: "italic", color: "#666" } : {}}
                >
                  {msg.transcribed && "🎤 "}
                  {msg.text}
                  {msg.action && (
                    <span style={{
                      display: "block",
                      fontSize: "0.75rem",
                      opacity: 0.6,
                      marginTop: "4px"
                    }}>
                      [{msg.action}]
                    </span>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="message bot loading">
                <span className="typing-indicator">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={listening ? "Listening..." : "Type your message..."}
              disabled={isLoading}
            />

            <button
              type="button"
              className={`chatbot-mic ${listening ? "active" : ""}`}
              onClick={toggleVoice}
              title={listening ? "Stop recording" : "Start recording"}
              aria-pressed={listening}
            >
              {listening ? "🎙️" : "🎤"}
            </button>

            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
