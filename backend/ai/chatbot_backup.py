import sys
import json
import re
import difflib
import asyncio
from datetime import datetime
from voice_handler import VoiceHandler
from db_connector import get_upcoming_events, get_event_by_id, register_for_event

# Initialize voice handler
voice = VoiceHandler()

# Ensure stdout uses utf-8 encoding (helps on Windows where default encoding may be a legacy code page)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    # Older Python versions or environments may not support reconfigure; ignore if unavailable
    pass

def load_intents():
    """Load intents from the JSON file"""
    try:
        import os
        # Get the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Prefer a small test intents file for quick focused testing
        test_path = os.path.join(script_dir, 'intents_test.json')
        intents_path = os.path.join(script_dir, 'intents.json')
        if os.path.exists(test_path):
            with open(test_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        # Fallback to the full intents dataset
        with open(intents_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading intents: {str(e)}", file=sys.stderr)
        return {"intents": []}

async def get_intent(message, user_context=None):
    """Determine the user's intent from their message with context awareness"""
    message = message.lower().strip()
    
    # Load intents data
    intents_data = load_intents()
    
    # Check for real-time event queries
    if re.search(r"\b(what|any|show|list|tell)\b.*\b(events|happening|scheduled)\b.*\b(today|now|this week|upcoming|soon)\b", message):
        events = await get_upcoming_events(5)
        if events:
            return {"tag": "real_time_events", "events": events}
    
    # Check for event registration intent
    reg_match = re.search(r"\b(register|sign up|join|enroll)\b.*\b(for|in|to)\b.*\bevent\b.*?(\d+|$)", message)
    if reg_match:
        event_id = reg_match.group(3)
        if event_id and user_context and user_context.get('user_id'):
            result = await register_for_event(event_id, user_context['user_id'])
            return {"tag": "event_registration", "result": result}
    
    # First try exact matches in patterns
    for intent in intents_data["intents"]:
        if any(pattern.lower() == message for pattern in intent["patterns"]):
            return {"tag": intent["tag"]}
    
    # Then try pattern matching with common variations
    for intent in intents_data["intents"]:
        for pattern in intent["patterns"]:
            if pattern == "*":
                continue
            pattern = re.escape(pattern.lower())
            pattern = pattern.replace(r"\?", "\\s*\\?*")
            pattern = pattern.replace(r"\!", "\\s*\\!*")
            if re.search(f"\\b{pattern}\\b", message):
                return {"tag": intent["tag"]}
    
    # Navigation commands
    nav_match = re.search(r"\b(open|go to|navigate|show)\b.*\b(dashboard|events|event details|events tab|register|registration|recommend|recommendations|profile|notifications)\b", message)
    if nav_match:
        target = nav_match.group(2)
        nav_mappings = {
            'dashboard': 'navigate_dashboard',
            'event': 'navigate_events',
            'register': 'navigate_register',
            'recommend': 'navigate_recommend',
            'profile': 'navigate_profile',
            'notification': 'navigate_notifications'
        }
        for key, value in nav_mappings.items():
            if key in target:
                return {"tag": value, "action": "navigate"}
    
    # Voice command detection
    if "voice" in message or "speak" in message:
        return {"tag": "voice_command", "action": "toggle_voice"}
    
    # If no direct matches, try fuzzy matching
    all_patterns = []
    pattern_to_tag = {}
    for intent in intents_data["intents"]:
        for pattern in intent["patterns"]:
            if pattern != "*":
                all_patterns.append(pattern.lower())
                pattern_to_tag[pattern.lower()] = intent["tag"]
    
    matches = difflib.get_close_matches(message, all_patterns, n=1, cutoff=0.6)
    if matches:
        return {"tag": pattern_to_tag[matches[0]]}
        
    return {"tag": "unknown"}

async def get_response(intent_data, message=None, voice_enabled=False):
    """Get a response based on the determined intent with real-time data"""
    import random
    
    # Load intents data
    intents_data = load_intents()
    
    # Navigation routes for special handling
    nav_routes = {
        'navigate_dashboard': ('Opening the dashboard for you...', '/dash-student'),
        'navigate_events': ('Opening the Events page...', '/event-details'),
        'navigate_register': ('Taking you to the registration page...', '/reg'),
        'navigate_recommend': ('Opening Recommendations...', '/recommend'),
        'navigate_profile': ('Opening your profile...', '/profile-user'),
        'navigate_notifications': ('Opening Notifications...', '/notifications-student')
    }

    # Only allow event-related answers. If the detected intent is outside
    # of event-related topics, return a short guidance message so the bot
    # stays focused.
    allowed_event_tags = {
        'greeting',
        'event_inquiry',      # intents.json
        'registration_help',   # intents.json
        'recommendation',      # intents.json
        'notifications',       # intents.json
        'event_registration',  # produced by fuzzy/reg matching in get_intent
        'real_time_events',    # produced by regex search in get_intent
        'navigate_events',
        'navigate_register',
        'navigate_recommend'
    }

    # If the intent is not event-related, return a brief helper message.
    # This keeps answers concise and on-topic.
    if intent_data.get('tag') not in allowed_event_tags:
        guidance = (
            "I only answer event-related questions. Try: 'show upcoming events', "
            "'details for event <id>', or 'register for event <id>'."
        )
        if voice_enabled:
            voice.speak(guidance)
        return {'reply': guidance}

    response = None
    
    # Handle real-time events query
    if intent_data["tag"] == "real_time_events" and "events" in intent_data:
        events = intent_data["events"]
        if events:
            response = "Here are the upcoming events:\n\n"
            for event in events:
                date_str = event['date'].strftime('%B %d, %Y at %I:%M %p')
                response += f"• {event['title']} - {date_str}\n"
            response += "\nWould you like to register for any of these events?"
        else:
            response = "There are no upcoming events scheduled at the moment."
    
    # Handle event registration
    elif intent_data["tag"] == "event_registration" and "result" in intent_data:
        result = intent_data["result"]
        if result['success']:
            response = "Great! You've been successfully registered for the event. Check your email for confirmation."
        else:
            response = f"Sorry, I couldn't register you for the event. {result['message']}"
    
    # Handle voice commands
    elif intent_data["tag"] == "voice_command":
        if voice_enabled:
            response = "Voice interaction is now disabled."
        else:
            response = "Voice interaction is now enabled. You can speak your commands."
        return {'reply': response, 'toggle_voice': not voice_enabled}
    
    # Handle navigation intents
    elif intent_data["tag"] in nav_routes:
        reply_text, route = nav_routes[intent_data["tag"]]
        return {'reply': reply_text, 'navigate': route}
    
    # Handle regular intents from intents.json
    if not response:
        for intent in intents_data["intents"]:
            if intent["tag"] == intent_data["tag"]:
                response = random.choice(intent["responses"])
                break
    
    if not response:
        response = "I'm not sure I understood that. Could you rephrase your question?"
    
    # Handle voice output if enabled
    if voice_enabled:
        voice.speak(response)
    
    return {'reply': response}

# Main execution
async def process_message(message, user_context=None, voice_enabled=False):
    try:
        # Process message and get response
        intent_data = await get_intent(message, user_context)
        response = await get_response(intent_data, message, voice_enabled)
        return response
    except Exception as e:
        error_msg = f"I encountered an error: {str(e)}. Please try again!"
        if voice_enabled:
            voice.speak(error_msg)
        return {'reply': error_msg, 'error': str(e)}

if __name__ == "__main__":
    try:
        voice_enabled = False
        user_context = {'user_id': None}  # Should be set when used in the application
        
        if len(sys.argv) > 1:
            # Command line mode: accept message as argv[1] and optional user_id as argv[2]
            message = sys.argv[1]
            if len(sys.argv) > 2:
                # second argument is user id (passed from the server)
                user_context['user_id'] = sys.argv[2]
            response = asyncio.run(process_message(message, user_context, voice_enabled))
            # Print a single JSON object as the response for the caller to parse
            print(json.dumps(response, ensure_ascii=False))
        else:
            # Interactive mode with optional voice
            print("Chatbot initialized. Type 'voice' to toggle voice interaction, or 'quit' to exit.")
            while True:
                if voice_enabled:
                    print("Listening...")
                    message = voice.listen()
                    if message == "Could not understand audio":
                        print("Sorry, I didn't catch that. Please try again.")
                        continue
                else:
                    message = input("You: ").strip()
                
                if message.lower() in ['quit', 'exit', 'bye']:
                    break
                
                response = asyncio.run(process_message(message, user_context, voice_enabled))
                
                if isinstance(response, dict):
                    if 'toggle_voice' in response:
                        voice_enabled = response['toggle_voice']
                        print("System:", response['reply'])
                    elif 'navigate' in response:
                        print("System:", response['reply'])
                        print(f"[Navigating to: {response['navigate']}]")
                    else:
                        print("System:", response['reply'])
                else:
                    print("System:", response)
                    
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Fatal error: {str(e)}. Please restart the chatbot.")
