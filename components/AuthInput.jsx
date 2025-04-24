import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }) => {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
});

export default AuthInput;
