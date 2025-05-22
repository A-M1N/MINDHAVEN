// AI API Configuration
// TEST COMMENT - This is a test edit to verify Git tracking
export const GROQ_API_URL = "YOUR_GROQ_API_URL";
export const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
export const GROQ_MODEL = "YOUR_GROQ_MODEL";

// Chat Log API Configuration
export const CHAT_LOG_API_URL = "YOUR_CHAT_LOG_API_URL";
export const GET_CHAT_LOGS_API_URL = "YOUR_GET_CHAT_LOGS_API_URL";

// Mood API Configuration
export const MOOD_API_URL = "YOUR_MOOD_API_URL";

// Mood Detection Configuration
export const MOOD_KEYWORDS = {
    'Happy': ['happy', 'joy', 'excited', 'great', 'wonderful', 'delighted', 'cheerful', 'glad', 'thrilled'],
    'Calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'at ease', 'composed'],
    'Neutral': ['okay', 'fine', 'alright', 'neutral', 'normal', 'average', 'moderate'],
    'Sad': ['sad', 'down', 'depressed', 'unhappy', 'blue', 'gloomy', 'miserable'],
    'Angry': ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'furious', 'enraged'],
    'Anxious': ['anxious', 'worried', 'nervous', 'scared', 'fearful', 'concerned', 'stressed'],
    'Stressed': ['stressed', 'overwhelmed', 'pressured', 'tension', 'strain', 'burdened'],
    'Tired': ['tired', 'exhausted', 'fatigued', 'drained', 'weary', 'sleepy', 'worn out']
};

// AI Assistant Instructions
export const AI_INSTRUCTIONS = {
    role: "system",
    content: "You are MindHaven AI, a specialized CBT (Cognitive Behavioral Therapy) assistant focused on mental health support. Your role is to:\n" +
        "1. Apply CBT principles and techniques in your responses\n" +
        "2. Provide supportive and empathetic responses\n" +
        "3. Share evidence-based CBT techniques and exercises\n" +
        "4. Help users identify connections between thoughts, feelings, and behaviors\n" +
        "5. Use clear, accessible language\n" +
        "6. Maintain professional boundaries\n" +
        "7. Never provide medical diagnoses\n" +
        "8. Focus on practical CBT-based solutions\n" +
        "9. Guide users through structured CBT exercises\n" +
        "10. Help users develop healthy coping mechanisms\n" +
        "11. Detect and log user moods\n" +
        "12. Keep responses concise and focused"
}; 