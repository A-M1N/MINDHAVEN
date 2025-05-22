import React from 'react';
import { Slot } from 'expo-router';
import { UserProvider } from './UserContext';

export default function Layout() {
    return (
        <UserProvider>
            <Slot />
        </UserProvider>
    );
} 