import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const API_URL = "http://localhost:8000/api/user-profile/"; // Adjust this to your backend URL

const ProfileScreen = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

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
      <View style={styles.profileCard}>
        <Image
          source={{ uri: userProfile.profileImage }}
          style={styles.profileCardImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Mood Stats</Text>
        <View style={styles.statsBarContainer}>
          <View style={styles.statsBar}>
            <View
              style={[
                styles.statsBarFill,
                { width: `${userProfile.moodStats}%` },
              ]}
            />
          </View>
          <Text style={styles.statsPercentage}>{userProfile.moodStats}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  profileCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  statsContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5100F3",
    marginBottom: 10,
  },
  statsBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsBar: {
    flex: 1,
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  statsBarFill: {
    height: "100%",
    backgroundColor: "#5100F3",
  },
  statsPercentage: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#5100F3",
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
