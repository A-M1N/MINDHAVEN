import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import AuthScreenWrapper from "../components/AuthScreenWrapper";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://127.0.0.1:8000/api/login/";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    const payload = JSON.stringify({ email, password });
    console.log("Sending payload:", payload); // Log the payload

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      const data = await response.json();
      console.log("Response data:", data); // Log response

      if (response.ok) {
        if (data.user_id) {
          await AsyncStorage.setItem("user_id", data.user_id);
          Alert.alert("Success", "Logged in successfully");
          router.push("/home");
        } else {
          Alert.alert("Error", "User ID not received from server");
        }
      } else {
        Alert.alert("Error", data.error || "Email or password is incorrect");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthScreenWrapper>
      <AuthInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <AuthInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => alert("Forgot Password?")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <AuthButton title="Login" onPress={handleLogin} />

      <TouchableOpacity
        onPress={() => router.push("/signup")}
        style={styles.signUpContainer}
      >
        <Text style={styles.signUpText}>
          {"Don't have an account? "}
          <Text style={styles.signUpLink}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </AuthScreenWrapper>
  );
};

const styles = StyleSheet.create({
  forgotPassword: {
    color: "#007BFF",
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  signUpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  signUpText: {
    fontSize: 16,
    color: "#333",
  },
  signUpLink: {
    color: "#007BFF",
    fontWeight: "bold",
  },
});

export default LoginScreen;
