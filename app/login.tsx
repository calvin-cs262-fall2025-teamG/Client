import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { login } from '../lib/supabase';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('');
  
  const [is_empty_username, set_is_empty_username] = useState(false);
  const [is_empty_passphrase, set_is_empty_passphrase] = useState(false);
  const [is_incorrect_username, set_is_incorrect_username] = useState(false);
  const [is_incorrect_passphrase, set_is_incorrect_passphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const r_style = StyleSheet.create({
    ue: {
      color: is_empty_username ? "red" : "black",
      // @ts-ignore
      display: is_empty_username ? "undefined" : "none",
    },
    ui: {
      color: is_incorrect_username ? "red" : "black",
      // @ts-ignore
      display: is_incorrect_username ? "undefined" : "none",
    },
    pe: {
      color: is_empty_passphrase ? "red" : "black",
      // @ts-ignore
      display: is_empty_passphrase ? "undefined" : "none",
    },
    pi: {
      color: is_incorrect_passphrase ? "red" : "black",
      // @ts-ignore
      display: is_incorrect_passphrase ? "undefined" : "none",
    },
  });
  
  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Reset error states
    set_is_empty_username(false);
    set_is_empty_passphrase(false);
    set_is_incorrect_username(false);
    set_is_incorrect_passphrase(false);

    // Validate empty fields
    if (!username) {
      set_is_empty_username(true);
      setIsLoading(false);
      return;
    }
    if (!passphrase) {
      set_is_empty_passphrase(true);
      setIsLoading(false);
      return;
    }

    try {
      // Call Supabase login
      const result = await login(username, passphrase);

      if (result.success) {
        // Login successful, navigate to home
        router.replace('/home');
      } else {
        // Show error
        setErrorMessage(result.error || 'Login failed');
        set_is_incorrect_username(true);
        set_is_incorrect_passphrase(true);
      }
    } catch (error: any) {
      setErrorMessage('An unexpected error occurred');
      set_is_incorrect_username(true);
      set_is_incorrect_passphrase(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, Neybr!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <Text style={styles.subtitle}>Use your Calvin credentials</Text>
      
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      
      <Text style={[
        // @ts-ignore
        r_style.ue,
        styles.lil_info_notice_warning_thingy,
      ]}>Field is required</Text>
      <Text style={[
        // @ts-ignore
        r_style.ui,
        styles.lil_info_notice_warning_thingy,
      ]}>Incorrect username or password</Text>
      <TextInput
        style={[
          styles.input,
          is_empty_username ? styles.redInput : undefined,
        ]}
        placeholder="Username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        editable={!isLoading}
        value={username}
        onChangeText={setUsername}
      />
      <Text style={[
        // @ts-ignore
        r_style.pe,
        styles.lil_info_notice_warning_thingy,
      ]}>Field is required</Text>
      <Text style={[
        // @ts-ignore
        r_style.pi,
        styles.lil_info_notice_warning_thingy,
      ]}>Incorrect username or password</Text>
      <TextInput
        style={[
          styles.input,
          is_empty_passphrase ? styles.redInput : undefined,
        ]}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        editable={!isLoading}
        value={passphrase}
        onChangeText={setPassphrase}
      />

      <TouchableOpacity 
        style={[styles.button, isLoading ? styles.buttonDisabled : null]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('../register')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  hidden: {
    // display: 'none',
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
  redInput:{
    color: '#c00726ff',
  },
  lil_info_notice_warning_thingy: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
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
  errorText: {
    color: '#c00726ff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
