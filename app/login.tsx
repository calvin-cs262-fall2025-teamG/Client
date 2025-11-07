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
  
  const [is_empty_username, set_is_empty_username] = useState(false);
  const [is_empty_passphrase, set_is_empty_passphrase] = useState(false);
  const [is_incorrect_username, set_is_incorrect_username] = useState(false);
  const [is_incorrect_passphrase, set_is_incorrect_passphrase] = useState(false);
  
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
  
  const handleLogin = () => {
    // TODO: add a way to keep users signed in, i.e. through some kind of automatic auth;
    let signed_in = false;
    
    // handle empty fields
    let m_is_empty_username   = !username;
    let m_is_empty_passphrase = !passphrase;
    let m_is_incorrect_username = false;
    let m_is_incorrect_passphrase = false;
    if(!signed_in){
      // you can't deny the absolute truth!
      // send username and password
      // server does internal check
      if(!m_is_empty_username && !m_is_empty_passphrase){
        m_is_incorrect_username   = username   !== "Simon";
        m_is_incorrect_passphrase = passphrase !== "aaa";
      }
      if(m_is_incorrect_username || m_is_incorrect_passphrase){
        m_is_incorrect_username   = true;
        m_is_incorrect_passphrase = true;
      }
      
      // update useState;
      set_is_empty_username(m_is_empty_username);
      set_is_empty_passphrase(m_is_empty_passphrase);
      set_is_incorrect_username(m_is_incorrect_username);
      set_is_incorrect_passphrase(m_is_incorrect_passphrase);
    }
    // if not signed in, make them start over!
    if(!(m_is_empty_username || m_is_empty_passphrase || m_is_incorrect_username || m_is_incorrect_passphrase)){
      // then login if it succeeds
      router.replace("/home");
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, Neybr!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <Text style={styles.subtitle}>Use your Calvin credentials</Text>
      <Text style={styles.subtitle}>(wip: this currently uses a fake passphrase)</Text>
      
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
        placeholder="Calvin username"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
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
