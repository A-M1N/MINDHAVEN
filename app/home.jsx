// Home.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "./UserContext";

const HomeScreen = () => {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <HeaderBar />
      <GreetingSection />
      <FeatureGrid router={router} />
      <ChallengesCard />
      <MoodWidget />
    </ScrollView>
  );
};

const HeaderBar = () => (
  <View style={styles.header}>
    <View style={styles.logoRow}>
      <Image source={require("../assets/images/logo.png")} style={styles.logo} />
      <Text style={styles.appName}>MindHaven</Text>
    </View>
    <View style={styles.headerIcons}>
      <TouchableOpacity>
        <Text style={styles.bell}>🔔</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Image source={require("../assets/images/no-profile.png")} style={styles.avatar} />
      </TouchableOpacity>
    </View>
  </View>
);

const GreetingSection = () => (
  <View style={styles.greetingSection}>
    <View>
      <Text style={styles.greeting}>Good evening, Sarah! <Text style={styles.emoji}>🌙</Text></Text>
      <Text style={styles.quote}>
        "You are enough, just as you are."
      </Text>
    </View>
    <View style={styles.dateWeather}>
      <Text style={styles.date}>Fri, May 23</Text>
      <Text style={styles.weather}>17°C</Text>
    </View>
  </View>
);

const FeatureGrid = ({ router }) => (
  <View style={styles.grid}>
    <FeatureCard label="Mood Tracker" color="#c7d2fe" onPress={() => router.push("/mood-tracker")} icon="😊" />
    <FeatureCard label="Chatbot" color="#e9d5ff" onPress={() => router.push("/chatbot")} icon="💬" />
    <FeatureCard label="Exercises" color="#fecaca" onPress={() => router.push("/exercises")} icon="❤️" />
    <FeatureCard label="Resources" color="#bae6fd" onPress={() => router.push("/resources")} icon="📖" />
    <FeatureCard label="Community" color="#bbf7d0" onPress={() => router.push("/community")} icon="👥" />
    <FeatureCard label="Journal" color="#fef9c3" onPress={() => router.push("/journal")} icon="📝" />
  </View>
);

const FeatureCard = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={[styles.featureCard, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureLabel}>{label}</Text>
  </TouchableOpacity>
);

const ChallengesCard = () => (
  <TouchableOpacity style={[styles.challengesCard, { backgroundColor: '#f3e8ff' }]}>
    <Text style={styles.challengesIcon}>🏆</Text>
    <Text style={styles.challengesLabel}>Challenges</Text>
  </TouchableOpacity>
);

const MoodWidget = () => (
  <View style={styles.moodWidget}>
    <Text style={styles.moodEmoji}>😊</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.moodPrompt}>How are you feeling?</Text>
      <TouchableOpacity style={styles.logMoodButton}>
        <Text style={styles.logMoodText}>Log Mood</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.streakBox}>
      <Text style={styles.streakLabel}>Streak</Text>
      <Text style={styles.streakCount}>5</Text>
      <Text style={styles.streakDays}>days</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: "#eef2ff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6366f1",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  bell: {
    fontSize: 22,
    marginRight: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c1a4a",
  },
  emoji: {
    fontSize: 20,
  },
  quote: {
    fontSize: 14,
    color: "#818cf8",
    marginTop: 2,
    fontStyle: "italic",
  },
  dateWeather: {
    alignItems: "flex-end",
  },
  date: {
    fontSize: 14,
    color: "#64748b",
  },
  weather: {
    fontSize: 14,
    color: "#64748b",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  featureCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c1a4a',
    textAlign: 'center',
  },
  challengesCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    flexDirection: 'row',
  },
  challengesIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  challengesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a21caf',
  },
  moodWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  moodPrompt: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c1a4a',
    marginBottom: 6,
  },
  logMoodButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  logMoodText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  streakBox: {
    alignItems: 'center',
    marginLeft: 18,
  },
  streakLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  streakCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6366f1',
    marginVertical: 2,
  },
  streakDays: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default HomeScreen;
