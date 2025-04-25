import React, { useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const exerciseTypes = [
    {
        id: 1,
        title: "Breathing Exercises",
        description: "Calm your mind with controlled breathing techniques",
        image: require("../assets/images/brain.png"),
        color: "#e0e7ff",
        exercises: [
            {
                id: 101,
                title: "Box Breathing",
                duration: "5 minutes",
                description: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat.",
            },
            {
                id: 102,
                title: "4-7-8 Breathing",
                duration: "5 minutes",
                description: "Inhale for 4 counts, hold for 7, exhale for 8. Repeat to reduce anxiety.",
            },
            {
                id: 103,
                title: "Diaphragmatic Breathing",
                duration: "10 minutes",
                description: "Deep belly breathing to activate the parasympathetic nervous system.",
            },
        ],
    },
    {
        id: 2,
        title: "Meditation",
        description: "Guided and unguided meditation practices",
        image: require("../assets/images/heart-outline.jpg"),
        color: "#fae8ff",
        exercises: [
            {
                id: 201,
                title: "Body Scan Meditation",
                duration: "15 minutes",
                description: "Progressive relaxation by focusing attention throughout the body.",
            },
            {
                id: 202,
                title: "Loving-Kindness Meditation",
                duration: "10 minutes",
                description: "Develop feelings of goodwill, kindness and warmth towards others.",
            },
            {
                id: 203,
                title: "Mindfulness Meditation",
                duration: "10 minutes",
                description: "Focus on the present moment, observing thoughts without judgment.",
            },
        ],
    },
    {
        id: 3,
        title: "Grounding Techniques",
        description: "Connect with the present moment to reduce anxiety",
        image: require("../assets/images/Icon trophy.png"),
        color: "#dcfce7",
        exercises: [
            {
                id: 301,
                title: "5-4-3-2-1 Technique",
                duration: "5 minutes",
                description: "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.",
            },
            {
                id: 302,
                title: "Progressive Muscle Relaxation",
                duration: "15 minutes",
                description: "Tense and then release each muscle group from toes to head.",
            },
            {
                id: 303,
                title: "Cold Water Technique",
                duration: "2 minutes",
                description: "Splash cold water on your face to activate the parasympathetic nervous system.",
            },
        ],
    },
    {
        id: 4,
        title: "Cognitive Exercises",
        description: "Reshape negative thought patterns",
        image: require("../assets/images/Icon gear.png"),
        color: "#ffedd5",
        exercises: [
            {
                id: 401,
                title: "Thought Record",
                duration: "15 minutes",
                description: "Identify and challenge negative thoughts with evidence.",
            },
            {
                id: 402,
                title: "Positive Affirmations",
                duration: "5 minutes",
                description: "Practice repeating positive statements to build self-confidence.",
            },
            {
                id: 403,
                title: "Gratitude Journaling",
                duration: "10 minutes",
                description: "Write down things you're grateful for to shift focus to the positive.",
            },
        ],
    },
];

const ExerciseScreen = () => {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState(null);

    const handleGoBack = () => {
        if (selectedType) {
            setSelectedType(null);
        } else {
            router.push("/home");
        }
    };

    const handleExerciseTypeSelect = (type) => {
        setSelectedType(type);
    };

    const handleExerciseSelect = (exercise) => {
        // In a real app, this would navigate to the exercise details
        // For now, we'll just show an alert
        console.log(`Selected exercise: ${exercise.title}`);
        // Future implementation would route to a specific exercise page
        // router.push(`/exercise-detail/${exercise.id}`);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleGoBack}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    {selectedType ? selectedType.title : "Mental Health Exercises"}
                </Text>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {selectedType ? (
                    // Show exercises for the selected type
                    <>
                        <View style={[styles.typeBanner, { backgroundColor: selectedType.color }]}>
                            <Image source={selectedType.image} style={styles.bannerImage} />
                            <Text style={styles.bannerTitle}>{selectedType.title}</Text>
                            <Text style={styles.bannerDescription}>{selectedType.description}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Available Exercises</Text>

                        {selectedType.exercises.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={styles.exerciseItem}
                                onPress={() => handleExerciseSelect(exercise)}
                            >
                                <View style={styles.exerciseContent}>
                                    <View style={styles.exerciseHeader}>
                                        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                                        <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                                    </View>
                                    <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                                    <View style={styles.startButtonContainer}>
                                        <TouchableOpacity
                                            style={styles.startButton}
                                            onPress={() => handleExerciseSelect(exercise)}
                                        >
                                            <Text style={styles.startButtonText}>Start</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                ) : (
                    // Show exercise categories
                    <>
                        <Text style={styles.welcomeText}>
                            Choose from various exercises designed to improve your mental well-being
                        </Text>

                        {exerciseTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[styles.exerciseTypeCard, { backgroundColor: type.color }]}
                                onPress={() => handleExerciseTypeSelect(type)}
                            >
                                <Image source={type.image} style={styles.exerciseTypeImage} />
                                <View style={styles.exerciseTypeContent}>
                                    <Text style={styles.exerciseTypeTitle}>{type.title}</Text>
                                    <Text style={styles.exerciseTypeDescription}>{type.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        backgroundColor: "#1e293b",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: "white",
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    welcomeText: {
        fontSize: 16,
        color: "#475569",
        marginBottom: 20,
        textAlign: "center",
        lineHeight: 24,
    },
    exerciseTypeCard: {
        flexDirection: "row",
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    exerciseTypeImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    exerciseTypeContent: {
        flex: 1,
    },
    exerciseTypeTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 4,
    },
    exerciseTypeDescription: {
        fontSize: 14,
        color: "#475569",
    },
    typeBanner: {
        borderRadius: 12,
        marginBottom: 24,
        padding: 20,
        alignItems: "center",
    },
    bannerImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 8,
    },
    bannerDescription: {
        fontSize: 16,
        color: "#475569",
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 16,
    },
    exerciseItem: {
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    exerciseContent: {
        padding: 16,
    },
    exerciseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    exerciseTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
    },
    exerciseDuration: {
        fontSize: 14,
        color: "#5100F3",
        fontWeight: "500",
    },
    exerciseDescription: {
        fontSize: 14,
        color: "#475569",
        marginBottom: 16,
        lineHeight: 20,
    },
    startButtonContainer: {
        alignItems: "flex-end",
    },
    startButton: {
        backgroundColor: "#5100F3",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    startButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
});

export default ExerciseScreen; 