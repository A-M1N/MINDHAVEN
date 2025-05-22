import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from './config/apiConfig';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                setUser(null);
                setLoading(false);
                return;
            }
            const response = await fetch(`${API_URLS.USER_PROFILE}${userId}/`);
            if (!response.ok) throw new Error('Failed to fetch user profile');
            const data = await response.json();
            setUser(data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const updateProfileImage = (profile_image) => {
        setUser((prev) => ({ ...prev, profile_image }));
    };

    return (
        <UserContext.Provider value={{ user, loading, fetchUserProfile, updateProfileImage }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext); 