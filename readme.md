# Event Management App
 A Full-Stack Event Management System with AI-Based Features

## 1.Project Overview
The "Event Management" App is a full-stack web application developed as a practical learning project to gain hands-on experience in **web development, backend development, database management, authentication, API integration, and AI feature integration**.
The application provides separate functionality for **Students and Administrators**. Students can discover and register for events, manage their profiles, provide feedback, receive notifications, and interact with AI-powered features. Administrators can manage events, students, registrations, feedback, and notifications.
The project also integrates **Python-based AI modules with a Node.js/Express backend**, allowing AI features to work with application data through backend APIs.


## 2. Main Features

### Student Features

* Student registration and login
* Secure authentication
* Password reset functionality
* Protected student pages
* Browse upcoming events
* View event details
* Register for events
* View registered events
* Manage student profile
* Submit event feedback
* View notifications
* Receive event recommendations
* Interact with AI chatbot
* Voice-based interaction
* AI-based feedback sentiment analysis

### Admin Features

* Secure admin login
* Protected admin dashboard
* View event and student statistics
* Create and manage events
* Manage students
* View event registrations
* View and analyze feedback
* Manage notifications
* Access AI-assisted administrative information

## 3. System Workflow
                         ┌─────────────────────────┐
                         │     React Frontend      │
                         │                         │
                         │ Student / Admin UI      │
                         │ Events / Registration   │
                         │ Feedback / Profile     │
                         │ Chatbot / Voice        │
                         └────────────┬────────────┘
                                      ↕
                              REST API / Axios
                                      ↕
                    ┌─────────────────────────────────┐
                    │      Node.js + Express Backend  │
                    │                                 │
                    │ Routes • Controllers • Middleware│
                    │ Authentication • Authorization  │
                    │ Application Logic • APIs        │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ↕                             ↕
          ┌─────────────────┐          ┌─────────────────────┐
          │     MongoDB     │          │    Python AI Layer  │
          │                 │          │                     │
          │ Users           │          │ AI Chatbot          │
          │ Events          │          │ Event Recommendation│
          │ Registrations   │          │ Sentiment Analysis  │
          │ Feedback        │          │ Voice Assistant     │
          │ Notifications   │          │                     │
          └─────────────────┘          └─────────────────────┘
                                   ↕
                              API Data / Results
The Python AI modules communicate with the Node.js backend through HTTP/API communication rather than directly connecting to MongoDB.

## 4. AI-Based Features
The project currently contains four main AI features.

### 4.1 AI Chatbot
The application includes an **intent-based AI chatbot** developed using Python.

The chatbot can:
* Understand predefined user intents
* Detect event-related queries
* Display upcoming events
* Provide event details
* Assist with event registration
* Display user registrations
* Show notifications
* Navigate users to application pages
* Provide different responses based on user roles
* Provide administrator statistics and feedback information
* Use fuzzy matching when an exact pattern is not found

The chatbot uses:
* Python
* Regular expressions
* JSON-based intents
* `difflib` fuzzy matching
* Backend API integration


### 4.2 Event Recommendation
The application includes a **similarity-based event recommendation system** implemented in Python.

The recommendation system considers information such as:
* Previous events
* Event titles
* Event descriptions
* Event locations
* Upcoming events
* Event timing

A custom similarity-based approach is used to compare event information and generate relevant recommendations.
The system returns a set of recommended events based on the calculated relevance.
This is a **custom recommendation algorithm**, not a trained machine-learning model.

### 4.3 Feedback Sentiment Analysis
The application analyzes student feedback using **TextBlob sentiment analysis**.
Feedback is processed using sentiment polarity and classified into:

* Positive
* Neutral
* Negative
The system also contains a simple keyword-based fallback mechanism when TextBlob is unavailable.
This allows administrators to obtain a basic understanding of overall feedback sentiment.


### 4.4 Voice Assistant

The project includes a voice interaction feature that allows users to communicate with the application using speech.

The voice system uses:
* SpeechRecognition for speech recognition
* PyAudio for microphone input
* Google speech recognition through SpeechRecognition
* gTTS for text-to-speech generation
* Pygame for audio playback
* Python threading and queues for background voice processing

The voice assistant can listen to user commands, convert speech into text, process the command through the chatbot, and provide spoken output.

---

## 5. Technology Stack

### Frontend

| Technology   | Purpose                             |
| ------------ | ----------------------------------- |
| React        | User interface development          |
| Vite         | Frontend development and build tool |
| JavaScript   | Application logic                   |
| HTML5        | Page structure                      |
| CSS3         | Styling and responsive interface    |
| React Router | Frontend navigation                 |
| Axios        | API communication                   |

### Backend

| Technology                 | Purpose                    |
| -------------------------- | -------------------------- |
| Node.js                    | Backend runtime            |
| Express.js                 | REST API and server        |
| JavaScript                 | Backend application logic  |
| MongoDB                    | Database                   |
| Mongoose                   | MongoDB data modeling      |
| Axios / HTTP communication | API communication          |
| dotenv                     | Environment configuration  |
| CORS                       | Cross-origin communication |

### Authentication and Security

| Technology               | Purpose                                 |
| ------------------------ | --------------------------------------- |
| JWT                      | User authentication and authorization   |
| jsonwebtoken             | JWT generation and verification         |
| bcrypt / bcryptjs        | Password hashing                        |
| Protected routes         | Restrict authenticated pages and APIs   |
| Role-based authorization | Separate Student and Admin permissions  |
| Environment variables    | Protect configuration and secret values |
| Password reset tokens    | Secure password recovery                |

### AI and Python

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| Python            | AI feature implementation   |
| TextBlob          | Feedback sentiment analysis |
| SpeechRecognition | Speech-to-text processing   |
| PyAudio           | Microphone/audio input      |
| gTTS              | Text-to-speech              |
| Pygame            | Audio playback              |
| Python `re`       | Pattern and intent matching |
| Python `difflib`  | Fuzzy intent matching       |
| JSON              | Intent and AI data handling |


## 6. Project Structure

event-app/
│
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication, roles and CORS
│   ├── controllers/     # Application and business logic
│   ├── models/          # MongoDB/Mongoose data models
│   ├── routes/          # Backend API routes
│   ├── utils/           # Authentication, validation, email and notification utilities
│   ├── ai/              # Python AI features and supporting files
│   ├── server.js        # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Student and Admin pages
│   │   ├── services/    # API communication with the backend
│   │   ├── context/     # Global authentication state
│   │   ├── assets/      # CSS and frontend styling
│   │   ├── App.jsx      # Main React application
│   │   ├── main.jsx     # React entry point
│   │   └── index.css    # Global styles
│   ├── index.html       # Main HTML page
│
└── README.md            # Main project documentation


## 7. Screenshots
screenshots are inside screeshots.pdf

### Student Interface

* Student Login
* Student Signup
* Student Dashboard
* Event Details
* Event Registration
* Event Recommendations
* Feedback
* Student Profile
* Notifications
* AI Chatbot
* Voice Assistant

### Admin Interface

* Admin Login
* Admin Dashboard
* Event Management
* Add Event
* User Management
* Registration Management
* Feedback Management
* Notifications

Example:

```text
screenshots/
├── student-dashboard.png
├── event-details.png
├── recommendations.png
├── chatbot.png
├── admin-dashboard.png
└── event-management.png
```

*Add the actual screenshot files when preparing the final GitHub repository.*

---

## 8. Installation and Setup

###  Prerequisites
Before running the project, install:
* Node.js
* npm
* Python
* MongoDB
* Git
Python voice functionality may additionally require the appropriate audio dependencies for microphone input.

### Clone the Repository
git clone <your-repository-url>
cd event-app

### Backend Setup
Navigate to the backend directory:
cd backend

Install the Node.js dependencies:
npm install

Configure the backend environment variables in the backend `.env` file.
The environment configuration should contain the required database connection, authentication secret, server configuration, and other application settings used by the backend.

Start the backend server using node mainserverfile.js

### Frontend Setup

Open another terminal and navigate to the frontend:
```bash
cd frontend
```
Install frontend dependencies:
```bash
npm install
```
Configure the frontend `.env` file with the required backend API configuration.
Start the Vite development server using npm run dev commands

### Python AI Setup
The AI modules are located inside:
backend/ai/
Install the Python dependencies required by the implemented AI and voice features.
The Python environment is used for:
* Chatbot processing
* Event recommendation
* Feedback sentiment analysis
* Voice interaction
The Node.js backend invokes the Python modules when AI functionality is required.


## 9. Backend API Overview

The backend follows a REST API structure.

| API Area        | Purpose                            |
| --------------- | ---------------------------------- |
| Authentication  | Student and Admin authentication   |
| Students        | Student-related operations         |
| Admin           | Administrative operations          |
| Events          | Event management                   |
| Registrations   | Event registration                 |
| Feedback        | Feedback submission and management |
| Chatbot         | AI chatbot communication           |
| Recommendations | Event recommendations              |
| Notifications   | Notification management            |
| Profile         | Student profile operations         |
| User Management | Administrative user management     |

The exact API endpoints are implemented within the backend `routes/` directory.

## 10. AI Workflow

### Chatbot Workflow

User Message
     ↓
Python Chatbot
     ↓
Intent Detection
     ↓
Pattern / Regex Matching
     ↓
Fuzzy Matching if Required
     ↓
Backend API Data
     ↓
Response Generation
     ↓
Frontend Chatbot


### Recommendation Workflow

User/Event Information
        ↓
Python Recommendation Module
        ↓
Event Data Collection
        ↓
Similarity Calculation
        ↓
Event Ranking
        ↓
Recommended Events
        ↓
Frontend


### Sentiment Analysis Workflow

Student Feedback
       ↓
Python Feedback Module
       ↓
TextBlob Sentiment Analysis
       ↓
Polarity Calculation
       ↓
Positive / Neutral / Negative
       ↓
Admin Feedback Analysis




## 11. Security

Security was implemented as an important part of the application.
The project includes:

* JWT-based authentication
* Password hashing using bcrypt/bcryptjs
* Protected frontend routes
* Protected backend APIs
* Role-based authorization
* Separate Student and Admin access
* Environment variables for sensitive configuration
* Secure password reset token handling
* CORS configuration
* Generic authentication error messages
* Authentication middleware
These mechanisms help prevent unauthorized access to protected application functionality.



## 12. Current Limitations
As this is a practical learning project, some AI components use relatively simple approaches.
For example:

* The chatbot primarily uses intent and pattern matching.
* Event recommendations use a custom similarity-based approach rather than a trained ML model.
* Sentiment analysis uses TextBlob polarity with a keyword-based fallback.
* Some Python backend helper functions may use simulated/fallback data where complete backend integration is still being developed.
* The voice assistant depends on microphone and audio environment configuration.
These limitations can be enhanced as  future development.

## 13. Future Enhancements
The project can be expanded with more advanced technologies and capabilities.
### AI and Machine Learning

* Advanced Natural Language Processing using NLTK or spaCy
* Machine-learning recommendation models using scikit-learn
* Advanced personalized recommendations
* Event attendance prediction
* Event demand prediction
* Predictive analytics
* Advanced sentiment and emotion analysis
* User behavior analysis

### Chatbot Improvements
* LLM-powered conversational chatbot
* More advanced natural-language understanding
* Conversational memory
* Context-aware responses
* Multilingual chatbot support
### Voice Improvements
* More natural voice conversations
* Improved speech recognition
* Multiple language support
* Voice-controlled application navigation

### Data and Analytics
* Pandas and NumPy-based data analysis
* Advanced analytics dashboards
* Event performance analysis
* Student participation analytics
* Recommendation performance analysis
### Application Improvements
* Mobile application
* Cloud deployment
* Scalable AI services
* Improved notification system
* Advanced attendance management
* Email and communication improvements



# 14. Author

**Ahmed**


