import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAnonymousUser } from '../services/anonymousStorage';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@torcida.com');
  const [password, setPassword] = useState('Instagram2023');
  const [loading, setLoading] = useState(false);
  const [hasAnonymousUser, setHasAnonymousUser] = useState(false);

  useEffect(() => {
    checkAnonymousUser();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAnonymousUser();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAnonymousUser = async () => {
    const user = await getAnonymousUser();
    setHasAnonymousUser(!!user);
  };

  const handleLogin = async () => {
    console.log('[LoginScreen] handleLogin chamado');
    console.log('[LoginScreen] Email:', email);
    console.log('[LoginScreen] Password length:', password.length);

    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      console.log('[LoginScreen] Chamando signIn...');
      await signIn(email, password);
      console.log('[LoginScreen] signIn concluído com sucesso!');
    } catch (error: any) {
      console.log('[LoginScreen] Erro no signIn:', error);
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Torcida Quiz</Text>
      <Text style={styles.subtitle}>Bem-vindo!</Text>

      {/* Botão Meus Quizzes - só aparece se existir usuário anônimo */}
      {hasAnonymousUser && (
        <TouchableOpacity
          style={styles.myQuizzesButton}
          onPress={() => navigation.navigate('MyQuizzes')}
        >
          <Text style={styles.myQuizzesButtonText}>📋 Meus Quizzes</Text>
          <Text style={styles.myQuizzesSubtext}>Ver quizzes que você participou</Text>
        </TouchableOpacity>
      )}

      {/* Botão Destacado para Participar */}
      <TouchableOpacity
        style={styles.participateButton}
        onPress={() => navigation.navigate('JoinQuiz')}
      >
        <Text style={styles.participateButtonText}>🎮 Participar de um Quiz</Text>
        <Text style={styles.participateSubtext}>Não precisa fazer login</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OU</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Seção de Login para Administradores */}
      <Text style={styles.loginLabel}>Login de Administrador</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  myQuizzesButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  myQuizzesButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  myQuizzesSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  participateButton: {
    backgroundColor: '#34C759',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  participateButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  participateSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  loginLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default LoginScreen;
