import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Svg, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { API_URLS } from "./config/apiConfig";
import { useUser } from "./UserContext";

const DEFAULT_AVATAR = require("../assets/images/no-profile.png");

const ProfileScreen = () => {
  const { user, loading, updateProfileImage, fetchUserProfile } = useUser();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Function to get CSRF token from cookies
  const getCSRFToken = () => {
    if (Platform.OS === 'web') {
      const name = 'csrftoken';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    return null;
  };

  const pickImageAndUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access media library is required!');
        return;
      }

      console.log('Opening image picker...');
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('Picker result:', pickerResult);

      if (pickerResult.canceled) {
        console.log('Image picker cancelled');
        return;
      }

      setUploading(true);
      const userId = await AsyncStorage.getItem('user_id');
      console.log('User ID:', userId);

      if (!userId) {
        throw new Error('User ID not found');
      }

      const uri = pickerResult.assets[0].uri;
      console.log('Image URI:', uri);

      // Get the file extension
      const fileName = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('File details:', {
        fileName,
        type,
      });

      // Create form data
      const formData = new FormData();

      // Important: append user_id as a string
      formData.append('user_id', userId.toString());

      // Handle image data differently for web platform
      if (Platform.OS === 'web') {
        // For web, we need to fetch the image and create a File object
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type });
        formData.append('profile_image', file);
      } else {
        // For mobile platforms
        formData.append('profile_image', {
          uri: uri,
          name: fileName,
          type: type
        });
      }

      // Get CSRF token for web platform
      const csrfToken = getCSRFToken();
      const headers = {
        'Accept': 'application/json',
      };

      // Only add CSRF token and Content-Type for web platform
      if (Platform.OS === 'web') {
        if (csrfToken) {
          headers['X-CSRFToken'] = csrfToken;
        }
        // Don't set Content-Type header - let the browser set it with the boundary
      }

      console.log('Uploading image...', {
        url: API_URLS.UPDATE_PROFILE_IMAGE(userId),
        userId: userId,
        fileName: fileName,
        type: type,
        headers: headers,
        formData: formData
      });

      const uploadResponse = await fetch(API_URLS.UPDATE_PROFILE_IMAGE(userId), {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include', // Important for cookies
      });

      console.log('Upload response status:', uploadResponse.status);
      const responseText = await uploadResponse.text();
      console.log('Upload response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      console.log('Upload response data:', data);

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Use the full image URL returned from backend
      const imageUrl = data.profile_image;
      console.log('New image URL:', imageUrl);

      // Update the user context/profile instantly
      if (typeof updateProfileImage === 'function') {
        updateProfileImage(imageUrl);
      }
      setImageError(false);
      Alert.alert('Success', 'Profile image updated!');
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

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
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
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
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageError ? DEFAULT_AVATAR : (user.profile_image || DEFAULT_AVATAR) }}
            style={styles.profileImage}
            onError={() => setImageError(true)}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={pickImageAndUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editButtonText}>Edit</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 20,
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
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;
