import sys
import json
import re
import difflib
from datetime import datetime
from io import StringIO

# Suppress pygame and other startup messages by redirecting stdout temporarily
# Save original stdout
_original_stdout = sys.stdout
_original_stderr = sys.stderr

# Create null device to suppress pygame startup messages
class NullWriter:
    def write(self, x):
        pass
    def flush(self):
        pass

# Suppress during imports
sys.stdout = NullWriter()
sys.stderr = NullWriter()

# Try to import voice handler but don't fail if missing
voice = None
try:
    from voice_handler import VoiceHandler
    voice = VoiceHandler()
except Exception as e:
    pass

# Import db_connector - CRITICAL, must work
try:
    from db_connector import (
        get_upcoming_events,
        get_event_by_id,
        register_for_event,
        get_user_registrations,
        get_feedback_summary,
        get_admin_stats,
        submit_feedback,
        get_notifications
    )
except ImportError as e:
    # Restore output first
    sys.stdout = _original_stdout
    sys.stderr = _original_stderr
    print(f"CRITICAL: Failed to import db_connector: {str(e)}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    # Restore output first
    sys.stdout = _original_stdout
    sys.stderr = _original_stderr
    print(f"CRITICAL: Unexpected error importing db_connector: {str(e)}", file=sys.stderr)
    sys.exit(1)

# Restore stdout/stderr after imports
sys.stdout = _original_stdout
sys.stderr = _original_stderr

# Ensure stdout uses utf-8 encoding
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def load_intents():
    """Load intents from the JSON file"""
    try:
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        intents_path = os.path.join(script_dir, 'intents.json')
        with open(intents_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading intents: {str(e)}", file=sys.stderr)
        return {"intents": []}


def get_intent(message, user_context=None):
    """Determine user intent with role awareness"""
    message_lower = message.lower().strip()
    user_role = user_context.get('role', 'guest') if user_context else 'guest'
    user_id = user_context.get('user_id') if user_context else None
    
    # ===== ADMIN INTENTS =====
    if user_role == 'admin':
        if re.search(r"\b(show|get|display|tell me about)\b.*\b(stats|statistics|dashboard|summary|overview|report)\b", message_lower):
            try:
                stats = get_admin_stats()
                return {"tag": "admin_stats", "stats": stats, "action": "show_stats"}
            except:
                return {"tag": "admin_stats", "stats": {}}
        
        if re.search(r"\b(show|get|feedback|review|rating|satisfaction)\b.*\b(summary|feedback|reviews|ratings)\b", message_lower):
            try:
                feedback = get_feedback_summary()
                return {"tag": "admin_feedback", "feedback": feedback, "action": "show_feedback"}
            except:
                return {"tag": "admin_feedback", "feedback": {}}
    
    # ===== STUDENT/UNIVERSAL INTENTS =====
    
    # Real-time event queries - FIRST PRIORITY, broad pattern matching
    event_keywords = r"\b(event|events|happening|coming|scheduled|upcoming|recent|show|list|tell|find|what|any)\b"
    if re.search(event_keywords, message_lower):
        try:
            events = get_upcoming_events(5)
            if events:
                return {"tag": "real_time_events", "events": events}
        except:
            pass
    
    # Specific event details
    event_id_match = re.search(r"\b(?:event|workshop|seminar)\s+(?:id\s+)?[#]?(\w+)", message_lower)
    if event_id_match:
        try:
            event_id = event_id_match.group(1)
            event = get_event_by_id(event_id)
            if event:
                return {"tag": "event_details", "event": event}
        except:
            pass
    
    # Event registration
    reg_match = re.search(r"\b(register|sign up|join|enroll)\b.*\b(for|in|to)\b.*\b(?:event|workshop|seminar)?\b.*?(\w+)?", message_lower)
    if reg_match and user_id:
        event_id = reg_match.group(3) if reg_match.group(3) else None
        if event_id:
            try:
                result = register_for_event(event_id, user_id)
                return {"tag": "event_registration", "result": result, "action": "register"}
            except:
                pass
    
    # User's registrations
    if re.search(r"\b(my|show|list|what)\b.*\b(registrations|events|registered|joined)\b", message_lower) and user_id:
        try:
            registrations = get_user_registrations(user_id)
            return {"tag": "my_registrations", "registrations": registrations}
        except:
            pass
    
    # Notifications
    if re.search(r"\b(show|get|check|see|my)\b.*\b(notifications|alerts|updates|messages)\b", message_lower) and user_id:
        try:
            notifications = get_notifications(user_id)
            return {"tag": "notifications", "notifications": notifications}
        except:
            pass
    
    # Navigation
    nav_match = re.search(r"\b(open|go to|navigate|show|take me to)\b.*\b(dashboard|events|event details|events tab|register|registration|recommend|recommendations|profile|notifications|feedback)\b", message_lower)
    if nav_match:
        target = nav_match.group(2).lower()
        nav_map = {
            'dashboard': '/dash-student',
            'events': '/event-details',
            'event details': '/event-details',
            'register': '/reg',
            'registration': '/reg',
            'recommend': '/recommend',
            'recommendations': '/recommend',
            'profile': '/profile-user',
            'notifications': '/notifications-student',
            'feedback': '/feedback-student',
        }
        for key, route in nav_map.items():
            if key in target:
                return {"tag": "navigate", "action": "navigate", "navigate": route}
    
    # Voice
    if re.search(r"\b(voice|speak|audio|toggle|enable|disable)\b", message_lower):
        return {"tag": "voice_command", "action": "toggle_voice"}
    
    # Pattern matching from intents
    intents_data = load_intents()
    
    # Exact match
    for intent in intents_data.get("intents", []):
        if any(pattern.lower() == message_lower for pattern in intent.get("patterns", [])):
            return {"tag": intent["tag"]}
    
    # Fuzzy matching
    for intent in intents_data.get("intents", []):
        for pattern in intent.get("patterns", []):
            if pattern == "*":
                continue
            try:
                escaped = re.escape(pattern.lower())
                escaped = escaped.replace(r"\?", r"\s*\?*").replace(r"\!", r"\s*\!*")
                if re.search(f"\\b{escaped}\\b", message_lower):
                    return {"tag": intent["tag"]}
            except:
                pass
    
    # Difflib fallback
    all_patterns = []
    pattern_to_tag = {}
    for intent in intents_data.get("intents", []):
        for pattern in intent.get("patterns", []):
            if pattern != "*":
                all_patterns.append(pattern.lower())
                pattern_to_tag[pattern.lower()] = intent["tag"]
    
    matches = difflib.get_close_matches(message_lower, all_patterns, n=1, cutoff=0.6)
    if matches:
        matched_tag = pattern_to_tag[matches[0]]
        
        # If matched tag is about events but we don't have real data yet, try to fetch
        if matched_tag in ["events", "event_recommendations", "real_time_events"]:
            try:
                events = get_upcoming_events(5)
                if events:
                    return {"tag": "real_time_events", "events": events}
            except:
                pass
        
        return {"tag": matched_tag}
    
    return {"tag": "unknown"}


def get_response(intent_data, message=None, voice_enabled=False, user_role='guest'):
    """Generate response based on intent"""
    import random
    intents_data = load_intents()
    
    # ===== ADMIN RESPONSES =====
    if intent_data.get("tag") == "admin_stats":
        stats = intent_data.get("stats", {})
        response = f"""📊 **Admin Dashboard Stats**

🎉 Total Events: {stats.get('total_events', 0)}
👥 Total Students: {stats.get('total_students', 0)}
✅ Total Registrations: {stats.get('total_registrations', 0)}
📈 Events This Week: {stats.get('events_this_week', 0)}
⭐ Avg Attendance Rate: {stats.get('avg_attendance_rate', 0)}%
💬 Feedback Count: {stats.get('feedback_count', 0)}
😊 Avg Satisfaction: {stats.get('avg_satisfaction', 0)}/5"""
        return {'reply': response, 'action': 'show_stats'}
    
    elif intent_data.get("tag") == "admin_feedback":
        feedback = intent_data.get("feedback", {})
        response = f"""📝 **Feedback Summary**

Total Feedback: {feedback.get('total_feedback', 0)}
Average Rating: ⭐ {feedback.get('average_rating', 0)}/5

Recent Feedback:"""
        for fb in feedback.get('recent_feedback', [])[:3]:
            response += f"\n• {fb.get('event', 'Event')} - {fb.get('rating')}⭐\n  {fb.get('comment', '')}"
        return {'reply': response, 'action': 'show_feedback'}
    
    # ===== STUDENT RESPONSES =====
    elif intent_data.get("tag") == "real_time_events":
        events = intent_data.get("events", [])
        if events:
            response = "🎉 **Here are the upcoming events:**\n\n"
            for i, event in enumerate(events, 1):
                date_str = event['date'].strftime('%B %d, %Y') if isinstance(event['date'], datetime) else str(event['date'])
                response += f"{i}. **{event['title']}**\n   📍 {event.get('location', 'TBA')}\n   📅 {date_str}\n   👥 {event.get('registered', 0)}/{event.get('capacity', '?')} registered\n\n"
            response += "Would you like to register for any of these events?"
            return {'reply': response}
        else:
            return {'reply': "No upcoming events at the moment. Check back soon! 📅"}
    
    elif intent_data.get("tag") == "event_details":
        event = intent_data.get("event", {})
        date_str = event['date'].strftime('%B %d, %Y at %I:%M %p') if isinstance(event['date'], datetime) else str(event['date'])
        response = f"""📌 **{event.get('title', 'Event')}**

{event.get('description', '')}

📅 **Date:** {date_str}
📍 **Location:** {event.get('location', 'TBA')}
👥 **Registered:** {event.get('registered', 0)}/{event.get('capacity', '?')}

Would you like to register for this event?"""
        return {'reply': response}
    
    elif intent_data.get("tag") == "event_registration":
        result = intent_data.get("result", {})
        if result.get('success'):
            return {
                'reply': f"✅ Great! You've been successfully registered.\n\n📧 Confirmation ID: {result.get('confirmation_id', '')}\n\nCheck your email for details!",
                'action': 'register',
                'navigate': '/dash-student'
            }
        else:
            return {
                'reply': f"❌ Registration failed: {result.get('message', 'Unknown error')}",
                'action': 'register_error'
            }
    
    elif intent_data.get("tag") == "my_registrations":
        registrations = intent_data.get("registrations", [])
        if registrations:
            response = "📋 **Your Registrations:**\n\n"
            for reg in registrations:
                response += f"✅ {reg.get('event_title', 'Event')}\n   Status: {reg.get('status', 'Pending')}\n\n"
            return {'reply': response}
        else:
            return {'reply': "You haven't registered for any events yet. 😢\n\nWould you like to explore upcoming events?"}
    
    elif intent_data.get("tag") == "notifications":
        notifications = intent_data.get("notifications", [])
        if notifications:
            response = "🔔 **Your Notifications:**\n\n"
            for notif in notifications[:5]:
                response += f"• {notif.get('message', '')}\n"
            return {'reply': response, 'navigate': '/notifications-student'}
        else:
            return {'reply': "You don't have any notifications right now. 📭"}
    
    elif intent_data.get("tag") == "navigate":
        route = intent_data.get("navigate")
        return {'reply': 'Opening the page for you... 🔄', 'navigate': route}
    
    # ===== UNIVERSAL RESPONSES =====
    elif intent_data.get("tag") == "voice_command":
        return {'reply': 'Voice interaction enabled! You can speak your commands.', 'action': 'toggle_voice'}
    
    elif intent_data.get("tag") == "greeting":
        greetings = [
            "👋 Hello! How can I help you today?",
            "Hi there! What can I do for you?",
            "Hey! Ready to explore some events?" if user_role == 'student' else "Hey! How can I assist you?",
        ]
        return {'reply': random.choice(greetings)}
    
    elif intent_data.get("tag") == "goodbye":
        return {'reply': random.choice(["Goodbye! 👋", "See you soon!", "Take care!", "Bye! Come back anytime."])}
    
    elif intent_data.get("tag") == "thanks":
        return {'reply': random.choice(["You're welcome! 😊", "No problem!", "Glad I could help!", "Happy to assist!"])}
    
    elif intent_data.get("tag") == "unknown":
        if user_role == 'admin':
            guidance = "I can help with:\n• Show dashboard stats\n• View feedback summary\n• Check notifications\n\nTry: 'show me stats' or 'feedback summary'"
        else:
            guidance = "I can help with:\n• Show upcoming events\n• Register for events\n• Check feedback\n• Show notifications\n\nTry: 'what events are coming up?' or 'register for event'"
        return {'reply': guidance}
    
    # Default: find in intents.json
    for intent in intents_data.get("intents", []):
        if intent["tag"] == intent_data.get("tag"):
            response = random.choice(intent.get("responses", ["I'm not sure I understood that."]))
            return {'reply': response}
    
    return {'reply': "I'm not sure I understood that. Could you rephrase your question?"}


def process_message(message, user_context=None, voice_enabled=False):
    """Process message and return response"""
    try:
        intent_data = get_intent(message, user_context)
        user_role = user_context.get('role', 'guest') if user_context else 'guest'
        response = get_response(intent_data, message, voice_enabled, user_role)
        return response
    except Exception as e:
        error_msg = f"I encountered an error: {str(e)}. Please try again!"
        return {'reply': error_msg, 'error': str(e)}


if __name__ == "__main__":
    try:
        voice_enabled = False
        user_context = {'user_id': None, 'role': 'guest'}
        
        if len(sys.argv) > 1:
            message = sys.argv[1]
            if len(sys.argv) > 2:
                user_context['user_id'] = sys.argv[2]
            if len(sys.argv) > 3:
                user_context['role'] = sys.argv[3]
            
            response = process_message(message, user_context, voice_enabled)
            print(json.dumps(response, ensure_ascii=False, default=str))
        else:
            print("Chatbot initialized. Type 'quit' to exit.")
            while True:
                message = input("You: ").strip()
                if message.lower() in ['quit', 'exit', 'bye']:
                    break
                response = process_message(message, user_context, voice_enabled)
                print("Bot:", response.get('reply', str(response)))
                    
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Fatal error: {str(e)}")
