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
} from "react-native";
import { useRouter } from "expo-router";

const ChatbotScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef();

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMessage = { text: inputText, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "67d43e305b64e7a549c2239b", // Replace with actual user identification logic
          message: inputText,
          sender: "user",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const botReply = await fetchBotReply(inputText);
      setMessages((prevMessages) => [...prevMessages, botReply]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const fetchBotReply = async (userMessage) => {
    // This is a placeholder for fetching a bot reply. You'll need to implement this based on your actual chatbot logic.
    // For now, we'll use a simple delay and a static response.
    return new Promise((resolve) => {
      setTimeout(() => {
        const botReply = { text: "Hello! How can I help you?", sender: "bot" };
        resolve(botReply);
      }, 1000);
    });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F5F5F5" }}
    >
      <View style={{ flex: 1, padding: 10 }}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.sender === "user" ? "#007AFF" : "#E0E0E0",
                padding: 10,
                marginVertical: 5,
                borderRadius: 10,
                maxWidth: "75%",
              }}
            >
              <Text
                style={{ color: msg.sender === "user" ? "white" : "black" }}
              >
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            backgroundColor: "white",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#F0F0F0",
              borderRadius: 20,
              paddingHorizontal: 15,
              paddingVertical: 10,
            }}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={{
              marginLeft: 10,
              padding: 10,
              backgroundColor: "#007AFF",
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatbotScreen;
