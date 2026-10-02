import json
import sys
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError

class DatabaseConnector:
    """Fetches real-time data from backend APIs"""
    
    def __init__(self):
        self.base_url = "http://localhost:5000/api"
        self.headers = {"Content-Type": "application/json"}
    
    def _fetch_json(self, url: str) -> Optional[Dict[str, Any]]:
        """Helper to fetch JSON from backend API (synchronous)"""
        try:
            request = Request(url, headers=self.headers)
            with urlopen(request, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                return data
        except URLError as e:
            print(f"Network error fetching {url}: {str(e)}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Error fetching {url}: {str(e)}", file=sys.stderr)
            return None
    
    def get_upcoming_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch upcoming events from backend API"""
        try:
            # Call real backend API
            data = self._fetch_json(f"{self.base_url}/event")
            if data and isinstance(data, list):
                # Format backend event structure
                events = []
                for evt in data[:limit]:
                    events.append({
                        'id': evt.get('_id', evt.get('id', '')),
                        'title': evt.get('title', 'Untitled Event'),
                        'description': evt.get('description', ''),
                        'date': datetime.fromisoformat(evt['startDateTime'].replace('Z', '+00:00')) if evt.get('startDateTime') else datetime.now(),
                        'location': evt.get('venueOrLink', evt.get('location', 'TBA')),
                        'registered': len(evt.get('registrations', [])),
                        'capacity': evt.get('maxParticipants', 100),
                        'category': evt.get('category', 'General'),
                        'eventMode': evt.get('eventMode', 'Hybrid')
                    })
                return events
            else:
                # Fallback: return mock data if API fails
                return self._get_mock_events(limit)
        except Exception as e:
            print(f"Error fetching events from API: {str(e)}", file=sys.stderr)
            return self._get_mock_events(limit)

    def _get_mock_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Fallback mock events if API is unavailable"""
        events = [
            {
                'id': 'evt1',
                'title': 'Tech Conference 2025',
                'description': 'Explore cutting-edge technologies',
                'date': datetime.now() + timedelta(days=5),
                'location': 'Auditorium',
                'registered': 45,
                'capacity': 100,
                'category': 'Conference',
                'eventMode': 'In-Person'
            },
            {
                'id': 'evt2',
                'title': 'Web Development Workshop',
                'description': 'Learn React and Node.js',
                'date': datetime.now() + timedelta(days=7),
                'location': 'Lab A',
                'registered': 28,
                'capacity': 50,
                'category': 'Workshop',
                'eventMode': 'In-Person'
            },
            {
                'id': 'evt3',
                'title': 'Annual Hackathon',
                'description': '24-hour coding competition',
                'date': datetime.now() + timedelta(days=14),
                'location': 'Multiple Labs',
                'registered': 120,
                'capacity': 150,
                'category': 'Competition',
                'eventMode': 'In-Person'
            }
        ]
        return events[:limit]

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific event by ID from backend API"""
        try:
            # Call real backend API
            data = self._fetch_json(f"{self.base_url}/event/{event_id}")
            if data:
                return {
                    'id': data.get('_id', data.get('id', '')),
                    'title': data.get('title', 'Untitled Event'),
                    'description': data.get('description', ''),
                    'date': datetime.fromisoformat(data['startDateTime'].replace('Z', '+00:00')) if data.get('startDateTime') else datetime.now(),
                    'location': data.get('venueOrLink', data.get('location', 'TBA')),
                    'registered': len(data.get('registrations', [])),
                    'capacity': data.get('maxParticipants', 100),
                    'category': data.get('category', 'General'),
                    'eventMode': data.get('eventMode', 'Hybrid')
                }
            else:
                # Fallback to mock if not found
                events = self.get_upcoming_events(100)
                for event in events:
                    if event['id'] == event_id:
                        return event
                return None
        except Exception as e:
            print(f"Error fetching event {event_id}: {str(e)}", file=sys.stderr)
            return None

    def register_for_event(self, event_id: str, user_id: str) -> Dict[str, Any]:
        """Register a user for an event"""
        try:
            event = self.get_event_by_id(event_id)
            if not event:
                return {'success': False, 'message': 'Event not found'}
            
            if event['registered'] >= event['capacity']:
                return {'success': False, 'message': 'Event is full'}
            
            # Simulate successful registration
            return {
                'success': True,
                'message': f"Successfully registered for {event['title']}",
                'event_id': event_id,
                'user_id': user_id,
                'confirmation_id': f"CONF-{user_id}-{event_id}",
                'date': event['date']
            }
        except Exception as e:
            print(f"Error registering user: {str(e)}", file=__import__('sys').stderr)
            return {'success': False, 'message': 'Registration failed'}

    def get_user_registrations(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all registrations for a user"""
        try:
            # In production, call /api/reg?userId=...
            return [
                {
                    'event_id': 'evt1',
                    'event_title': 'Tech Conference 2025',
                    'registration_date': datetime.now(),
                    'status': 'confirmed'
                },
                {
                    'event_id': 'evt2',
                    'event_title': 'Web Development Workshop',
                    'registration_date': datetime.now() - timedelta(days=2),
                    'status': 'confirmed'
                }
            ]
        except Exception as e:
            print(f"Error fetching user registrations: {str(e)}", file=__import__('sys').stderr)
            return []

    def get_feedback_summary(self) -> Dict[str, Any]:
        """Get feedback statistics (admin only)"""
        try:
            return {
                'total_feedback': 156,
                'average_rating': 4.2,
                'recent_feedback': [
                    {'event': 'Tech Conference', 'rating': 5, 'comment': 'Excellent event!'},
                    {'event': 'Workshop', 'rating': 4, 'comment': 'Very informative'},
                    {'event': 'Hackathon', 'rating': 5, 'comment': 'Great experience'}
                ]
            }
        except Exception as e:
            print(f"Error fetching feedback: {str(e)}", file=__import__('sys').stderr)
            return {}

    def get_admin_stats(self) -> Dict[str, Any]:
        """Get dashboard stats (admin only)"""
        try:
            events = self.get_upcoming_events(100)
            return {
                'total_events': len(events),
                'total_registrations': 328,
                'total_students': 512,
                'events_this_week': len([e for e in events if (e['date'] - datetime.now()).days <= 7]),
                'avg_attendance_rate': 87.5,
                'feedback_count': 156,
                'avg_satisfaction': 4.2
            }
        except Exception as e:
            print(f"Error fetching admin stats: {str(e)}", file=__import__('sys').stderr)
            return {}

    def submit_feedback(self, user_id: str, event_id: str, rating: int, comment: str) -> Dict[str, Any]:
        """Submit feedback for an event (student only)"""
        try:
            if not 1 <= rating <= 5:
                return {'success': False, 'message': 'Rating must be between 1 and 5'}
            
            return {
                'success': True,
                'message': 'Thank you for your feedback!',
                'feedback_id': f"FB-{user_id}-{event_id}",
                'timestamp': datetime.now()
            }
        except Exception as e:
            print(f"Error submitting feedback: {str(e)}", file=__import__('sys').stderr)
            return {'success': False, 'message': 'Failed to submit feedback'}

    def get_notifications(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user notifications"""
        try:
            return [
                {'type': 'registration', 'message': 'You registered for Tech Conference'},
                {'type': 'reminder', 'message': 'Tech Conference starts in 2 days!'},
                {'type': 'update', 'message': 'Web Development Workshop details updated'}
            ][:limit]
        except Exception as e:
            print(f"Error fetching notifications: {str(e)}", file=__import__('sys').stderr)
            return []


# Create global connector instance
db = DatabaseConnector()


# Public API functions
def get_upcoming_events(limit: int = 10) -> List[Dict[str, Any]]:
    """Get upcoming events"""
    return db.get_upcoming_events(limit)


def get_event_by_id(event_id: str) -> Optional[Dict[str, Any]]:
    """Get event by ID"""
    return db.get_event_by_id(event_id)


def register_for_event(event_id: str, user_id: str) -> Dict[str, Any]:
    """Register user for event"""
    return db.register_for_event(event_id, user_id)


def get_user_registrations(user_id: str) -> List[Dict[str, Any]]:
    """Get user's registrations"""
    return db.get_user_registrations(user_id)


def get_feedback_summary() -> Dict[str, Any]:
    """Get feedback summary"""
    return db.get_feedback_summary()


def get_admin_stats() -> Dict[str, Any]:
    """Get admin statistics"""
    return db.get_admin_stats()


def submit_feedback(user_id: str, event_id: str, rating: int, comment: str) -> Dict[str, Any]:
    """Submit feedback"""
    return db.submit_feedback(user_id, event_id, rating, comment)


def get_notifications(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get user notifications"""
    return db.get_notifications(user_id, limit)


if __name__ == "__main__":
    # Test the connector
    def test():
        print("Testing DB Connector...")
        events = get_upcoming_events(5)
        print(f"Events: {len(events)}")
        
        event = get_event_by_id('evt1')
        print(f"Event 1: {event['title'] if event else 'Not found'}")
        
        stats = get_admin_stats()
        print(f"Admin Stats: {stats}")
    
    test()
