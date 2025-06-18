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
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL } from "../config/aiConfig";
import { VOICE_AI_CONFIG } from "../config/VoiceAiConfig";
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from "../UserContext";
import '../i18n';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get("window");

const CHAT_LOG_API_URL = "http://localhost:8000/api/add_chat_log/";
const GET_CHAT_LOGS_API_URL = "http://localhost:8000/api/get_user_chat_logs/";
const MOOD_LOG_API_URL = "http://localhost:8000/api/add_mood_log/";
const ACTIVITY_LOG_API_URL = "http://localhost:8000/api/add_activity_log/";
const EXERCISE_API_URL = "http://localhost:8000/api/add_exercise/";

const DEFAULT_AVATAR = require("../../assets/images/no-profile.png");
const ROBOT_AVATAR = require("../../assets/images/robot.png");

// List of moods to detect
const moodList = [
  "happy", "sad", "angry", "anxious", "stressed", "calm", "tired", "excited"
];

// Keywords that indicate positive feelings about activities
const positiveKeywords = [
  "love", "enjoy", "like", "good", "great", "helpful", "comfortable",
  "relaxing", "calming", "therapeutic", "makes me feel better", "helps me",
  "favorite", "best", "wonderful", "amazing", "perfect"
];

// Keywords that indicate negative feelings about activities
const negativeKeywords = [
  "hate", "dislike", "don't like", "bad", "terrible", "uncomfortable",
  "stressful", "anxiety", "makes me feel worse", "worst", "awful",
  "difficult", "hard", "tiring", "exhausting"
];

// Common activity verbs
const activityVerbs = [
  "doing", "performing", "practicing", "playing", "reading", "exercising",
  "going", "running", "walking", "swimming", "dancing", "singing", "writing",
  "drawing", "painting", "cooking", "baking", "gardening", "meditating",
  "yoga", "stretching", "lifting", "cycling", "hiking", "climbing"
];

// List of common sports/activities
const knownActivities = [
  "running", "basketball", "chess", "tennis", "kayaking", "swimming", "cycling", "yoga", "meditation", "soccer", "football", "baseball", "volleyball", "hiking", "dancing", "skiing", "surfing", "climbing", "golf", "boxing", "skating", "rowing", "badminton", "table tennis", "ping pong", "rugby", "cricket", "handball", "squash", "martial arts", "pilates", "stretching", "jogging", "walking"
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

const detectActivity = (text) => {
  const lower = text.toLowerCase();

  // Check if the message contains positive or negative feelings
  const hasPositive = positiveKeywords.some(keyword => lower.includes(keyword));
  const hasNegative = negativeKeywords.some(keyword => lower.includes(keyword));

  if (!hasPositive && !hasNegative) return null;

  // Always scan the entire message for any known activity
  let detected = null;
  for (const activity of knownActivities) {
    if (lower.includes(activity)) {
      detected = activity;
      break;
    }
  }
  if (detected) {
    return {
      activity: detected.charAt(0).toUpperCase() + detected.slice(1),
      isPositive: hasPositive
    };
  }

  // Fallback to previous extraction logic
  let activity = null;
  const pattern1 = lower.match(/(?:i|me|my)\s+(?:love|enjoy|like|hate|dislike)\s+(?:to\s+)?([^,.!?]+)/i);
  if (pattern1) {
    activity = pattern1[1].trim();
  }
  const pattern2 = lower.match(/([^,.!?]+)\s+makes\s+me\s+feel\s+(?:good|better|bad|worse)/i);
  if (pattern2) {
    activity = pattern2[1].trim();
  }
  const pattern3 = lower.match(/(?:i|me|my)\s+(?:am|was|were)\s+(?:doing\s+)?([^,.!?]+)/i);
  if (pattern3) {
    activity = pattern3[1].trim();
  }
  if (!activity) {
    for (const verb of activityVerbs) {
      if (lower.includes(verb)) {
        const parts = lower.split(verb);
        if (parts[1]) {
          activity = parts[1].trim();
          break;
        }
      }
    }
  }
  if (activity) {
    activity = activity.replace(/^(to|the|a|an)\s+/i, '').trim();
    const firstWord = activity.split(/\s|,|\.|!|\?/)[0];
    // Ignore pronouns as activity names
    const ignoreWords = ["it", "this", "that", "they", "he", "she", "we", "you"];
    if (knownActivities.includes(firstWord)) {
      return {
        activity: firstWord.charAt(0).toUpperCase() + firstWord.slice(1),
        isPositive: hasPositive
      };
    } else if (!ignoreWords.includes(firstWord)) {
      return {
        activity: activity.charAt(0).toUpperCase() + activity.slice(1),
        isPositive: hasPositive
      };
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

const saveExercise = async (userId, activity) => {
  try {
    await fetch(EXERCISE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        name: activity,
        type: "activity", // or you can try to infer type
        duration: 0,
        completed: false
      })
    });
  } catch (err) {
    console.error("Failed to save exercise:", err);
  }
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const scrollViewRef = useRef();
  const { user } = useUser();
  const { t } = useTranslation();

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

        // Activity detection and logging
        const activityData = detectActivity(inputText);
        if (activityData && activityData.isPositive) {
          saveExercise(userId, activityData.activity);
        }
      }
    } catch (err) {
      console.error("Error processing user message:", err);
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
              <Image
                source={ROBOT_AVATAR}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={{
            backgroundColor: isUser ? '#5100F3' : '#fff',
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
              color: isUser ? 'white' : '#2c1a4a',
              fontSize: 16,
              lineHeight: 22,
            }}>
              {msg.text}
            </Text>
            <Text style={{
              fontSize: 10,
              color: isUser ? 'rgba(255,255,255,0.7)' : '#64748b',
              marginTop: 4,
              alignSelf: 'flex-end'
            }}>
              {msg.timestamp && formatTime(msg.timestamp)}
            </Text>
          </View>

          {isUser && (
            <View style={{ marginLeft: 8, flexShrink: 0 }}>
              <Image
                source={user?.profile_image ? { uri: user.profile_image } : DEFAULT_AVATAR}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsLoading(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', VOICE_AI_CONFIG.WHISPER_MODEL);
      formData.append('response_format', 'json');
      formData.append('temperature', '0');

      // Send to Groq API
      const response = await fetch(VOICE_AI_CONFIG.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOICE_AI_CONFIG.GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Transcription failed');
      }

      const data = await response.json();

      // Check if we have valid transcription data
      if (data && data.text && data.text !== "Transcribe the following audio.") {
        setInputText(data.text.trim());
      } else {
        throw new Error('Invalid transcription response');
      }
    } catch (err) {
      console.error('Failed to transcribe audio:', err);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus'
        });
        await transcribeAudio(audioBlob);

        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with a smaller timeslice to get more frequent data
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <LinearGradient
      colors={["#f3e7fa", "#e3e0ff"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Header */}
          <LinearGradient
            colors={["#e3e0ff", "#f3e7fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingTop: Platform.OS === 'ios' ? 40 : 10,
              paddingBottom: 10,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#e0d7f3',
              shadowColor: '#a18aff',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
              position: 'relative',
            }}
          >
            <TouchableOpacity
              onPress={handleGoBack}
              style={{ position: 'absolute', left: 10, top: Platform.OS === 'ios' ? 40 : 10, padding: 4, zIndex: 2 }}
              accessibilityLabel={t('chatbot.go_back')}
              accessibilityRole="button"
            >
              <Text style={{ color: '#5100F3', fontSize: 22 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={ROBOT_AVATAR}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
              <Text style={{
                fontSize: 19,
                fontWeight: 'bold',
                color: '#5100F3',
                textShadowColor: '#e3e0ff',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                {t('chatbot.mindy')}
              </Text>
            </View>
          </LinearGradient>

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
                    backgroundColor: '#5100F3',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 32, color: 'white' }}>AI</Text>
                  </View>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#2c1a4a',
                    marginBottom: 12,
                  }}>
                    {t('chatbot.empty_title')}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: '#64748b',
                    textAlign: 'center',
                    maxWidth: '80%',
                  }}>
                    {t('chatbot.empty_subtitle')}
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
                        backgroundColor: '#5100F3',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>AI</Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: '#fff',
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
                        <ActivityIndicator size="small" color="#5100F3" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#64748b' }}>{t('chatbot.thinking')}</Text>
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
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e0d7f3',
            }}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isRecording ? '#ef4444' : '#5100F3',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>
                  {isRecording ? '■' : '🎤'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  fontSize: 16,
                  marginRight: 10,
                  color: '#2c1a4a',
                }}
                placeholder={t('chatbot.input_placeholder')}
                placeholderTextColor="#64748b"
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
                  backgroundColor: inputText.trim() === '' ? '#cbd5e1' : '#5100F3',
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c1a4a',
    marginBottom: 20,
  },
});

export default ChatbotScreen;
