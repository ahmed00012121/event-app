import speech_recognition as sr
from gtts import gTTS
import os
import tempfile
import pygame
from threading import Thread
import queue

class VoiceHandler:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.audio_queue = queue.Queue()
        pygame.mixer.init()
        
    def listen(self):
        """Listen for voice input"""
        try:
            with sr.Microphone() as source:
                print("Listening...")
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.listen(source)
                try:
                    text = self.recognizer.recognize_google(audio)
                    return text.lower()
                except sr.UnknownValueError:
                    return "Could not understand audio"
                except sr.RequestError:
                    return "Could not request results"
        except Exception as e:
            print(f"Error in voice recognition: {str(e)}")
            return None
            
    def speak(self, text):
        """Convert text to speech and play it"""
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
                temp_filename = fp.name
                
            # Generate speech
            tts = gTTS(text=text, lang='en')
            tts.save(temp_filename)
            
            # Play the audio
            pygame.mixer.music.load(temp_filename)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)
                
            # Clean up the temporary file
            os.unlink(temp_filename)
            
        except Exception as e:
            print(f"Error in text-to-speech: {str(e)}")
            
    def start_listening(self):
        """Start continuous listening in a separate thread"""
        def listen_thread():
            while True:
                text = self.listen()
                if text and text != "Could not understand audio":
                    self.audio_queue.put(text)
                    
        Thread(target=listen_thread, daemon=True).start()
        
    def get_voice_input(self):
        """Get the next voice input from the queue"""
        try:
            return self.audio_queue.get_nowait()
        except queue.Empty:
            return None