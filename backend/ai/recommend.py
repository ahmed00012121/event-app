import sys
import json
from typing import List, Dict
from datetime import datetime

def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate text similarity score between two strings with more lenient matching"""
    if not text1 or not text2:
        return 0.1  # Base similarity for empty texts
        
    # Convert to sets of words for comparison
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    # Calculate modified Jaccard similarity
    intersection = len(words1.intersection(words2))
    min_len = min(len(words1), len(words2))
    
    # More lenient similarity score
    return (intersection / min_len) if min_len > 0 else 0.1

def get_recommendations(user_data: Dict) -> List[Dict]:
    """Generate event recommendations based on user's past events"""
    try:
        past_events = user_data.get('pastEvents', [])
        upcoming_events = user_data.get('upcomingEvents', [])
        
        if not upcoming_events:
            return []
            
        # Calculate scores for each upcoming event
        event_scores = []
        
        for upcoming in upcoming_events:
            # Extended future window (6 months)
            event_date = datetime.fromisoformat(upcoming['date'].replace('Z', '+00:00'))
            now = datetime.now().astimezone()
            if (event_date - now).days > 180:  # Extended to 6 months
                continue
                
            # Start with a base score
            score = 1.0
            
            if past_events:
                # Compare with past events
                for past in past_events:
                    # Calculate similarity between event titles and descriptions
                    title_sim = calculate_similarity(
                        past.get('title', ''),
                        upcoming.get('title', '')
                    )
                    desc_sim = calculate_similarity(
                        past.get('description', ''),
                        upcoming.get('description', '')
                    )
                    
                    # Weighted combination of similarities
                    sim_score = (title_sim * 0.4) + (desc_sim * 0.6)
                    score += sim_score
                    
                    # Bonus for same location
                    if past.get('location') == upcoming.get('location'):
                        score += 0.5
                        
                # Normalize by number of past events
                score = score / len(past_events)
            else:
                # If no past events, provide some basic recommendations
                score = 1.0
                # Prioritize upcoming events
                days_until = (event_date - now).days
                if days_until <= 30:  # Boost score for events within a month
                    score += 0.5
                
            event_scores.append((score, upcoming))
            
        # Sort by score and take top 8
        event_scores.sort(reverse=True, key=lambda x: x[0])
        recommendations = [
            {
                'id': event['id'],
                'title': event['title'],
                'description': event.get('description', ''),
                'date': event['date'],
                'location': event.get('location', ''),
                'score': round(score, 2)
            }
            for score, event in event_scores[:8]
        ]
        
        return recommendations
        
    except Exception as e:
        print(f"Error in recommendation engine: {str(e)}", file=sys.stderr)
        return []

# Read input data from stdin
try:
    input_data = json.loads(sys.stdin.read())
    recommendations = get_recommendations(input_data)
    print(json.dumps(recommendations))
except Exception as e:
    print(f"Error reading input data: {str(e)}", file=sys.stderr)
    sys.exit(1)
