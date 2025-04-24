import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const AuthScreenWrapper = ({ children }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/Login.png')} style={styles.logo} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logo: {
    width: 300,
    height: 250,
    marginBottom: 30,
    resizeMode: 'contain',
  },
});

export default AuthScreenWrapper;
