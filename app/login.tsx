import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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

  let isEmpty = useState({username: false, passphrase: false,})[0];
  let isIncorrect = useState({username: false, passphrase: false,})[0];
  
  const r_style_ue = useRef([]);
  const r_style_ui = useRef([]);
  const r_style_pe = useRef([]);
  const r_style_pi = useRef([]);
  
  const handleLogin = () => {
    // TODO: add a way to keep users signed in, i.e. through some kind of automatic auth;
    let signed_in = false;
    
    if(!signed_in){
        // handle empty fields
        isEmpty.username   = !username;
        isEmpty.passphrase = !passphrase;
        // you can't deny the absolute truth!
        // send username and password
        // server does internal check
        isIncorrect.username   = (!!username   && username   !== "Simon");
        isIncorrect.passphrase = (!!passphrase && passphrase !== "is the best");
        if(isIncorrect.username) isIncorrect.passphrase = true;
    }
    // if not signed in, make them start over!
    if(!(isEmpty.username || isEmpty.passphrase || isIncorrect.username || isIncorrect.passphrase)){
      // then login if it succeeds
      router.replace("/home");
    }
    
    let o_style_ue = [
      styles.subtitle, styles.redInput,
      isEmpty.username ? styles.requiredNotice : styles.hidden
    ];
    let o_style_ui = [
      styles.subtitle, styles.redInput,
      isIncorrect.passphrase ? styles.requiredNotice : styles.hidden
    ];
    let o_style_pe = [
      styles.subtitle, styles.redInput,
      isEmpty.passphrase ? styles.requiredNotice : styles.hidden
    ];
    let o_style_pi = [
      styles.subtitle, styles.redInput,
      isIncorrect.passphrase ? styles.requiredNotice : styles.hidden
    ];
    
    if(r_style_ue.current !== null) r_style_ue.current[0] = r_style_ue;
    if(r_style_ui.current !== null) r_style_ui.current[0] = r_style_ui;
    if(r_style_pe.current !== null) r_style_pe.current[0] = r_style_pe;
    if(r_style_pi.current !== null) r_style_pi.current[0] = r_style_pi;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, Neybr!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <Text style={styles.subtitle}>Use your Calvin credentials</Text>
      <Text style={styles.subtitle}>(wip: this currently uses a fake passphrase)</Text>
      
      <Text ref={r_style_ue}>Field is required</Text>
      <Text ref={r_style_ui}>Incorrect username or password</Text>
      <TextInput
        style={[styles.input, isEmpty.username ? styles.redInput : undefined]}
        placeholder="Calvin username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <Text ref={r_style_pe}>Field is required</Text>
      <Text ref={r_style_pi}>Incorrect username or password</Text>
      <TextInput
        style={[styles.input, isEmpty.passphrase ? styles.redInput : undefined]}
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
