import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "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";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const { width } = Dimensions.get("window");

const CHAT_LOG_API_URL = "http://localhost:8000/api/add_chat_log/";
const GET_CHAT_LOGS_API_URL = "http://localhost:8000/api/get_user_chat_logs/";
const MOOD_LOG_API_URL = "http://localhost:8000/api/add_mood_log/";

// List of moods to detect
const moodList = [
  "happy", "sad", "angry", "anxious", "stressed", "calm", "tired", "excited"
];

const detectMood = (text) => {
  const lower = text.toLowerCase();
  for (const mood of moodList) {
    if (lower.includes(mood)) {
      return mood;
    }
  }
  return null;
};

const predictMoodScore = async (userMessage, mood) => {
  // Use the LLM to predict the score
  try {
    const prompt = `Given the following user message and detected mood, predict the intensity of the mood on a scale from 1 (very mild) to 10 (very intense). Only return the number.\n\nUser message: "${userMessage}"\nDetected mood: ${mood}`;
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are an expert at rating mood intensity on a scale from 1 to 10. Only return the number." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4,
        top_p: 1
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const scoreText = data.choices[0].message.content.trim();
    const score = parseInt(scoreText.match(/\d+/)?.[0], 10);
    if (isNaN(score) || score < 1 || score > 10) return null;
    return score;
  } catch (err) {
    console.error("Failed to predict mood score:", err);
    return null;
  }
};

const saveMoodLog = async (userId, mood, note, score) => {
  if (!score) return;
  await fetch(MOOD_LOG_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      date: new Date().toISOString(),
      mood,
      notes: note,
      score,
    }),
  });
};

const saveChatLog = async (userId, message, sender) => {
  try {
    await fetch(CHAT_LOG_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message, sender })
    });
  } catch (err) {
    console.error("Failed to save chat log:", err);
  }
};

const ChatbotScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) return;
        const response = await fetch(`${GET_CHAT_LOGS_API_URL}${userId}/`);
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.chat_logs)) {
          // Map logs to message format used in state
          const historyMessages = data.chat_logs.map(log => ({
            text: log.message,
            sender: log.sender,
            timestamp: log.created_at ? new Date(log.created_at) : new Date()
          }));
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchChatHistory();
  }, []);

  const handleGoBack = () => {
    router.push("/home");
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMessage = { text: inputText, sender: "user", timestamp: new Date() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Save user message to chat log
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        saveChatLog(userId, inputText, "user");
        // Mood detection and logging
        const mood = detectMood(inputText);
        if (mood) {
          const score = await predictMoodScore(inputText, mood);
          if (score) {
            saveMoodLog(userId, mood, inputText, score);
          }
        }
      }
    } catch (err) {
      console.error("Error getting user_id for chat log:", err);
    }

    setTimeout(() => {
      fetchBotReply(inputText)
        .then(async botReply => {
          setMessages(prevMessages => [...prevMessages, botReply]);
          // Save bot message to chat log
          try {
            const userId = await AsyncStorage.getItem('user_id');
            if (userId) {
              saveChatLog(userId, botReply.text, "bot");
            }
          } catch (err) {
            console.error("Error getting user_id for chat log:", err);
          }
        })
        .catch(error => {
          Alert.alert("Error", error.message);
          console.error("Error getting bot reply:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 10);
  };

  const fetchBotReply = async (userInput) => {
    try {
      // Prepare conversation history for the model
      const systemPrompt = {
        role: "system",
        content: "You are a compassionate and professional CBT (Cognitive Behavioral Therapy) therapist. Respond to the user using CBT techniques, such as Socratic questioning, cognitive restructuring, and behavioral activation. Keep your responses concise and focused, and ask no more than 2 questions in each reply. Wait for the user's answer before moving to the next step. Help the user identify and challenge unhelpful thoughts, and encourage practical steps for well-being. Always be supportive, non-judgmental, and evidence-based."
      };

      const messageHistory = [
        systemPrompt,
        ...messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        })),
        {
          role: "user",
          content: userInput
        }
      ];

      // Call Groq API using fetch
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messageHistory,
          temperature: 1,
          max_tokens: 1024,
          top_p: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      return {
        text: botResponse,
        sender: "bot",
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error calling Groq API:", error);
      return {
        text: "Sorry, I encountered an error. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      };
    }
  };

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.sender === "user";

    return (
      <View
        key={index}
        style={{
          marginVertical: 8,
          width: '100%',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          maxWidth: '80%',
        }}>
          {!isUser && (
            <View style={{ marginRight: 8, flexShrink: 0 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#7E57C2',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>AI</Text>
              </View>
            </View>
          )}

          <View style={{
            backgroundColor: isUser ? '#3b82f6' : '#f3f4f6',
            padding: 12,
            borderRadius: 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            borderBottomRightRadius: isUser ? 4 : 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            elevation: 2,
            flex: 1,
          }}>
            <Text style={{
              color: isUser ? 'white' : '#333',
              fontSize: 16,
              lineHeight: 22,
            }}>
              {msg.text}
            </Text>
            <Text style={{
              fontSize: 10,
              color: isUser ? 'rgba(255,255,255,0.7)' : '#888',
              marginTop: 4,
              alignSelf: 'flex-end'
            }}>
              {msg.timestamp && formatTime(msg.timestamp)}
            </Text>
          </View>

          {isUser && (
            <View style={{ marginLeft: 8, flexShrink: 0 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#3b82f6',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>U</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#1e293b',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
      }}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ padding: 8 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={{ color: 'white', fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: 'white'
        }}>
          MindHaven AI Assistant
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages Container */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16 }}
        >
          {messages.length === 0 ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
              marginTop: width * 0.3,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#7E57C2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 32, color: 'white' }}>AI</Text>
              </View>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 12,
              }}>
                How can I help you today?
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                maxWidth: '80%',
              }}>
                Ask me anything about mental health, stress management, or meditation techniques.
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}

          {isLoading && (
            <View style={{
              width: '100%',
              alignItems: 'flex-start',
              marginVertical: 8,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                maxWidth: '80%',
              }}>
                <View style={{ marginRight: 8, flexShrink: 0 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#7E57C2',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>AI</Text>
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#f3f4f6',
                  padding: 16,
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.5,
                  elevation: 2,
                  flex: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#7E57C2" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#666' }}>Thinking...</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Container */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#f3f4f6',
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 12,
              fontSize: 16,
              marginRight: 10,
            }}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isLoading || inputText.trim() === ''}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: inputText.trim() === '' ? '#cbd5e1' : '#3b82f6',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatbotScreen;
