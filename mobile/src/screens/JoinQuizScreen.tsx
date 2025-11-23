import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';

type JoinQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'JoinQuiz'
>;

interface Props {
  navigation: JoinQuizScreenNavigationProp;
}

const JoinQuizScreen: React.FC<Props> = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code) {
      Alert.alert('Erro', 'Digite o código do quiz');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/quizzes/${code.toUpperCase()}/join`);
      const quizId = response.data.data.quiz.id;

      Alert.alert('Sucesso', 'Você entrou no quiz!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('PlayQuiz', { quizId }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao entrar no quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digite o código do Quiz</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase())}
        placeholder="Ex: ABC123"
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default JoinQuizScreen;
