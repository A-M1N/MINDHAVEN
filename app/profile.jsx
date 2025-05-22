import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Svg, Path } from 'react-native-svg';
import { API_URLS } from "./config/apiConfig";

const API_URL = "http://localhost:8000/api/user-profile/";
const DEFAULT_AVATAR = require("../assets/images/no-profile.png");

const ProfileScreen = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user_id = await AsyncStorage.getItem("user_id");
        if (!user_id) {
          Alert.alert("Error", "User not logged in");
          return;
        }

        const response = await fetch(`${API_URLS.USER_PROFILE}${user_id}/`);
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        Alert.alert("Error", "Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user profile found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5100F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={{ uri: imageError || !userProfile.profile_image ? DEFAULT_AVATAR : userProfile.profile_image }}
          style={styles.profileCardImage}
          onError={() => setImageError(true)}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEF6',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5100F3',
  },
  profileCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCardImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5100F3",
  },
  profileEmail: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: '#E53E3E',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: "#5100F3",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ProfileScreen;
