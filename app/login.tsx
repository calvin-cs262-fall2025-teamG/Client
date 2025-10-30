import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('');

  let isRed = {username: false, passphrase: false,}
  
  const handleLogin = () => {
    if (!username || !passphrase) {
      isRed.username = !username;
      isRed.passphrase = !passphrase;
      return;
    }
    // Example login action
    Alert.alert('Login Successful', `Welcome, ${username}!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, Neybr!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <Text style={styles.subtitle}>Use your Calvin credentials</Text>
      <Text style={styles.subtitle}>(wip: this currently uses a fake passphrase)</Text>

      <Text style={[isRed.passphrase ? styles.requiredNotice : styles.hidden]}>Field is required</Text>
      <TextInput
        style={[styles.input, isRed.username ? styles.redInput : undefined]}
        placeholder="Calvin username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      
      <Text style={[styles.subtitle, isRed.passphrase ? styles.requiredNotice : styles.hidden]}>Field is required</Text>
      <TextInput
        style={[styles.input, isRed.passphrase ? styles.redInput : undefined]}
        placeholder="Calvin passphrase"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={passphrase}
        onChangeText={setPassphrase}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  redInput: {
    borderColor: '#e51b00ff',
  },
  requiredNotice: {
    color: '#e51b00ff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
