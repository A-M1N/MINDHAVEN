// Home.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const Home = () => {
  const router = useRouter();

  const handleServicePress = (service) => {
    router.push(`/${service.toLowerCase().replace(" ", "-")}`);
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const handleMoodTrackerPress = () => {
    router.push("/mood-tracker");
  };

  return (
    <View style={styles.container}>
      <Header onProfilePress={handleProfilePress} />
      <Text style={styles.welcomeText}>Welcome To MindHaven</Text>
      <ButtonContainer />
      <TouchableOpacity onPress={handleMoodTrackerPress}>
        <MoodTracker />
      </TouchableOpacity>
      <Text style={styles.servicesTitle}>Services</Text>
      <ServicesContainer onServicePress={handleServicePress} />
    </View>
  );
};

const Header = ({ onProfilePress }) => (
  <View style={styles.header}>
    <View style={styles.logoAndTitle}>
      <Image
        source={require("../assets/images/logo.png")} // Replace with your logo
        style={styles.logo}
      />
      <Text style={styles.title}>MindHaven</Text>
    </View>
    <TouchableOpacity onPress={onProfilePress}>
      <Image
        source={require("../assets/images/profile.jpg")} // Replace with user's profile image
        style={styles.profileImage}
      />
    </TouchableOpacity>
  </View>
);

const ButtonContainer = () => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>Get Started</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>Community</Text>
    </TouchableOpacity>
  </View>
);

const MoodTracker = () => (
  <View style={styles.moodTracker}>
    <View style={styles.moodTrackerText}>
      <Text style={styles.moodTrackerTitle}>Track Your Mood</Text>
      <Text style={styles.moodTrackerSubtitle}>
        Monitor your daily emotional well-being
      </Text>
    </View>
    <Image
      source={require("../assets/images/puzzle.png")} // Replace with your mood icon
      style={styles.moodIcon}
    />
    <Text style={styles.percentage}>76%</Text>
    <View style={styles.progressBar}>
      <View style={[styles.progress, { width: "76%" }]} />
    </View>
  </View>
);

const ServicesContainer = ({ onServicePress }) => (
  <View style={styles.servicesContainer}>
    <ServiceBox
      icon={require("../assets/images/chatbot.png")} // Replace with your icon
      title="Chatbot"
      onPress={() => onServicePress("chatbot")}
    />
    <ServiceBox
      icon={require("../assets/images/knowledge.png")} // Replace with your icon
      title="Resources"
      onPress={() => onServicePress("Resources")}
    />
    <ServiceBox
      icon={require("../assets/images/brain.png")} // Replace with your icon
      title="Exercises"
      onPress={() => onServicePress("exercises")}
    />
    <ServiceBox
      icon={require("../assets/images/message.png")} // Replace with your icon
      title="Support Groups"
      onPress={() => onServicePress("blog")}
    />
  </View>
);

const ServiceBox = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.serviceBox} onPress={onPress}>
    <View style={styles.serviceContent}>
      <Image source={icon} style={styles.serviceIcon} />
      <Text style={styles.serviceTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c1a4a",
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c1a4a", // Updated to the specified color
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#5100F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  moodTracker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  moodTrackerText: {
    flex: 1,
  },
  moodTrackerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c1a4a", // Updated to the specified color
  },
  moodTrackerSubtitle: {
    fontSize: 14,
    color: "#2c1a4a",
  },
  moodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  percentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5100F3", // Updated to the specified color
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: "#5100F3",
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#5100F3", // Updated to the specified color
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceBox: {
    backgroundColor: "#e4d8f0",
    borderRadius: 15, // Increased border radius for a more rounded look
    padding: 20,
    width: "48%",
    marginBottom: 15, // Increased margin for better spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  serviceContent: {
    alignItems: "center",
  },
  serviceIcon: {
    width: 60, // Increased icon size
    height: 60, // Increased icon size
    marginBottom: 15, // Increased margin for better spacing
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c1a4a", // Updated to the specified color
    textAlign: "center",
  },
});

export default Home;
