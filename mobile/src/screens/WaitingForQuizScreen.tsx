import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';

type WaitingForQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'WaitingForQuiz'
>;

type WaitingForQuizScreenRouteProp = RouteProp<RootStackParamList, 'WaitingForQuiz'>;

interface Props {
  navigation: WaitingForQuizScreenNavigationProp;
  route: WaitingForQuizScreenRouteProp;
}

interface QuizStatus {
  id: string;
  title: string;
  description: string;
  status: string;
  started_at: string | null;
}

const WaitingForQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const { quizId } = route.params;
  const [quiz, setQuiz] = useState<QuizStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadQuizStatus();
  }, []);

  useEffect(() => {
    // Poll a cada 5 segundos checando se quiz foi iniciado
    const interval = setInterval(() => {
      checkQuizStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadQuizStatus = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/status`);
      const quizData = response.data.data;
      setQuiz(quizData);

      // Se já foi iniciado, navegar para PlayQuiz
      if (quizData.status === 'in_progress') {
        navigation.replace('PlayQuiz', { quizId });
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkQuizStatus = async () => {
    if (checking) return;

    setChecking(true);
    try {
      const response = await api.get(`/quizzes/${quizId}/status`);
      const quizData = response.data.data;
      setQuiz(quizData);

      // Se foi iniciado, navegar para PlayQuiz
      if (quizData.status === 'in_progress') {
        navigation.replace('PlayQuiz', { quizId });
      }
    } catch (error) {
      console.error('Error checking quiz status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleGoBack = () => {
    navigation.navigate('MyQuizzes');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⏳</Text>
      </View>

      <Text style={styles.title}>Aguardando Início</Text>
      <Text style={styles.message}>
        O quiz ainda não foi iniciado pelo organizador. Aguarde um momento...
      </Text>

      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        {quiz.description && (
          <Text style={styles.quizDescription}>{quiz.description}</Text>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator}>
          <View style={styles.pulsingDot} />
          <Text style={styles.statusText}>Verificando status...</Text>
        </View>
        <Text style={styles.statusSubtext}>
          Você será redirecionado automaticamente quando o quiz começar
        </Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>Voltar para Meus Quizzes</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        A página atualiza automaticamente a cada 5 segundos
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  quizInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#007AFF',
  },
  quizDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WaitingForQuizScreen;
