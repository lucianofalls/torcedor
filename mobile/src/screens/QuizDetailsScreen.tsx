import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';
import { Quiz } from '../types';

type QuizDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizDetails'
>;

type QuizDetailsScreenRouteProp = RouteProp<RootStackParamList, 'QuizDetails'>;

interface Props {
  navigation: QuizDetailsScreenNavigationProp;
  route: QuizDetailsScreenRouteProp;
}

const QuizDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { quizId } = route.params;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      setQuiz(response.data.data);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      await api.post(`/quizzes/${quizId}/start`);
      Alert.alert('Sucesso', 'Quiz iniciado!');
      loadQuiz();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao iniciar quiz');
    }
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('Leaderboard', { quizId });
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{quiz.title}</Text>
        {quiz.description && (
          <Text style={styles.description}>{quiz.description}</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Código do Quiz</Text>
        <Text style={styles.code}>{quiz.code}</Text>

        <Text style={styles.infoLabel}>Status</Text>
        <Text style={styles.status}>{quiz.status}</Text>

        <Text style={styles.infoLabel}>Perguntas</Text>
        <Text style={styles.infoValue}>{quiz.questions?.length || 0}</Text>
      </View>

      {quiz.questions && quiz.questions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas</Text>
          {quiz.questions.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
              <Text style={styles.questionText}>{question.question_text}</Text>
              <Text style={styles.timeLimit}>
                Tempo: {question.time_limit} segundos
              </Text>
            </View>
          ))}
        </View>
      )}

      {quiz.status === 'active' && (
        <TouchableOpacity style={styles.startButton} onPress={handleStartQuiz}>
          <Text style={styles.buttonText}>Iniciar Quiz</Text>
        </TouchableOpacity>
      )}

      {(quiz.status === 'in_progress' || quiz.status === 'finished') && (
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={handleViewLeaderboard}
        >
          <Text style={styles.buttonText}>Ver Ranking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 18,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  questionText: {
    fontSize: 16,
    marginTop: 5,
  },
  timeLimit: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaderboardButton: {
    backgroundColor: '#FF9500',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizDetailsScreen;
