import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Alert
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data for previous mood entries
const previousMoodData = [
    {
        id: 1,
        date: "Jun 10, 2023",
        mood: "Happy",
        intensity: 8,
        note: "Had a great day at the park with friends."
    },
    {
        id: 2,
        date: "Jun 8, 2023",
        mood: "Stressed",
        intensity: 7,
        note: "Deadline approaching for work project."
    },
    {
        id: 3,
        date: "Jun 5, 2023",
        mood: "Calm",
        intensity: 5,
        note: "Meditation session helped me relax."
    }
];

// Mood options
const moodOptions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😌", label: "Calm" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😠", label: "Angry" },
    { emoji: "😰", label: "Anxious" },
    { emoji: "😩", label: "Stressed" },
    { emoji: "😴", label: "Tired" }
];

const MOOD_API_URL = "http://127.0.0.1:8000/api/add_mood_log/";
const MOOD_HISTORY_API_URL = "http://127.0.0.1:8000/api/get_user_mood_logs/";

const MoodTrackerScreen = () => {
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState(null);
    const [intensity, setIntensity] = useState(5);
    const [note, setNote] = useState("");
    const [moodEntries, setMoodEntries] = useState([]);
    const [activeTab, setActiveTab] = useState("new"); // "new" or "history"
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === "history") {
            fetchMoodHistory();
        }
    }, [activeTab]);

    const fetchMoodHistory = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                Alert.alert('Error', 'User not logged in');
                router.push("/login");
                return;
            }

            setIsLoading(true);
            const response = await fetch(`${MOOD_HISTORY_API_URL}${userId}/`);
            const data = await response.json();

            if (response.ok && data.mood_logs) {
                setMoodEntries(data.mood_logs.map(entry => ({
                    id: entry._id,
                    date: new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }),
                    mood: entry.mood,
                    intensity: entry.score,
                    note: entry.notes
                })));
            } else {
                Alert.alert('Error', data.error || 'Failed to fetch mood history');
            }
        } catch (err) {
            console.error("Error fetching mood history:", err);
            Alert.alert('Error', 'Failed to fetch mood history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        router.push("/home");
    };

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
    };

    const handleIntensityChange = (value) => {
        setIntensity(value);
    };

    const handleSaveMood = async () => {
        if (!selectedMood) {
            Alert.alert("Missing Information", "Please select a mood before saving.");
            return;
        }

        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                Alert.alert('Error', 'User not logged in');
                router.push("/login");
                return;
            }

            const payload = {
                user_id: userId,
                date: new Date().toISOString(),
                mood: selectedMood.label,
                score: intensity,
                notes: note,
            };

            const response = await fetch(MOOD_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'Your mood has been recorded and saved!');
                setSelectedMood(null);
                setIntensity(5);
                setNote("");

                // Refresh mood history if we're on the history tab
                if (activeTab === "history") {
                    fetchMoodHistory();
                }
            } else {
                Alert.alert('Error', data.error || 'Failed to save mood');
            }
        } catch (err) {
            console.error("Error saving mood:", err);
            Alert.alert('Error', 'Failed to save mood');
        }
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

                <Text style={styles.headerTitle}>Mood Tracker</Text>

                <View style={{ width: 40 }} />
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "new" && styles.activeTab]}
                    onPress={() => setActiveTab("new")}
                >
                    <Text style={[styles.tabText, activeTab === "new" && styles.activeTabText]}>
                        New Entry
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "history" && styles.activeTab]}
                    onPress={() => setActiveTab("history")}
                >
                    <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView}>
                    {activeTab === "new" ? (
                        // New Entry Form
                        <View style={styles.newEntryContainer}>
                            <Text style={styles.sectionTitle}>How are you feeling today?</Text>

                            <View style={styles.moodOptionsContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {moodOptions.map((mood) => (
                                        <TouchableOpacity
                                            key={mood.label}
                                            style={[
                                                styles.moodOption,
                                                selectedMood?.label === mood.label && styles.selectedMoodOption
                                            ]}
                                            onPress={() => handleMoodSelect(mood)}
                                        >
                                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                            <Text style={styles.moodLabel}>{mood.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <Text style={styles.sectionTitle}>How intense is your mood?</Text>
                            <View style={styles.sliderContainer}>
                                <View style={styles.sliderValueContainer}>
                                    <Text style={styles.sliderLabel}>Mild</Text>
                                    <Text style={styles.intensityValue}>{intensity}</Text>
                                    <Text style={styles.sliderLabel}>Intense</Text>
                                </View>
                                <View style={styles.sliderTrack}>
                                    <View style={[styles.sliderFill, { width: `${(intensity / 10) * 100}%` }]} />
                                </View>
                                <View style={styles.sliderMarkers}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
                                        <TouchableOpacity
                                            key={mark}
                                            style={[
                                                styles.sliderMarker,
                                                intensity >= mark && styles.activeSliderMarker
                                            ]}
                                            onPress={() => setIntensity(mark)}
                                        />
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>Add a note (optional)</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="How was your day? What triggered this mood?"
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMood}>
                                <Text style={styles.saveButtonText}>Save Mood</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // History View
                        <View style={styles.historyContainer}>
                            <Text style={styles.historyTitle}>Your Mood History</Text>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Loading your mood history...</Text>
                                </View>
                            ) : moodEntries.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No mood entries yet</Text>
                                    <Text style={styles.emptySubText}>Start tracking your mood by adding a new entry</Text>
                                </View>
                            ) : (
                                moodEntries.map((entry) => (
                                    <View key={entry.id} style={styles.historyCard}>
                                        <View style={styles.historyCardHeader}>
                                            <Text style={styles.historyDate}>{entry.date}</Text>
                                            <View style={styles.moodBadge}>
                                                <Text style={styles.moodBadgeText}>{entry.mood}</Text>
                                                <Text style={styles.intensityBadge}>
                                                    {entry.intensity}/10
                                                </Text>
                                            </View>
                                        </View>
                                        {entry.note ? (
                                            <Text style={styles.historyNote}>{entry.note}</Text>
                                        ) : (
                                            <Text style={styles.noNote}>No notes added</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
    tabContainer: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: "#5100F3",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#64748b",
    },
    activeTabText: {
        color: "#5100F3",
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    newEntryContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 16,
        marginTop: 16,
    },
    moodOptionsContainer: {
        marginBottom: 24,
    },
    moodOption: {
        backgroundColor: "#f2f2f2",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#f2f2f2",
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 80,
    },
    selectedMoodOption: {
        backgroundColor: "rgba(81, 0, 243, 0.1)",
        borderColor: "#5100F3",
    },
    moodEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    moodLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    sliderContainer: {
        marginBottom: 24,
    },
    sliderValueContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sliderLabel: {
        fontSize: 14,
        color: "#64748b",
    },
    intensityValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#5100F3",
    },
    sliderTrack: {
        height: 10,
        backgroundColor: "#e2e8f0",
        borderRadius: 5,
        marginBottom: 8,
    },
    sliderFill: {
        height: 10,
        backgroundColor: "#5100F3",
        borderRadius: 5,
    },
    sliderMarkers: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sliderMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#e2e8f0",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    activeSliderMarker: {
        backgroundColor: "#5100F3",
        borderColor: "#5100F3",
    },
    noteInput: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: "top",
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: "#5100F3",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        shadowColor: "#5100F3",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 30,
    },
    saveButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    historyContainer: {
        padding: 20,
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 16,
    },
    historyCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    historyCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    moodBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    moodBadgeText: {
        fontSize: 14,
        color: "#5100F3",
        fontWeight: "600",
        marginRight: 8,
    },
    intensityBadge: {
        backgroundColor: "#e0e7ff",
        color: "#5100F3",
        fontSize: 12,
        fontWeight: "500",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyNote: {
        fontSize: 14,
        color: "#4b5563",
        lineHeight: 20,
    },
    noNote: {
        fontSize: 14,
        color: "#94a3b8",
        fontStyle: "italic",
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});

export default MoodTrackerScreen; 