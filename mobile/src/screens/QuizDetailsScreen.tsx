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

  // Recarregar quando a tela recebe foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadQuiz();
    });
    return unsubscribe;
  }, [navigation]);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      const quizData = response.data.data;
      console.log('📱 QUIZ LOADED:', { id: quizData.id, title: quizData.title, status: quizData.status, questions: quizData.questions?.length });
      setQuiz(quizData);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleActivateQuiz = () => {
    Alert.alert(
      'Ativar Quiz',
      'Tem certeza que deseja ativar este quiz? Participantes poderão se inscrever.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Ativar',
          onPress: async () => {
            try {
              await api.post(`/quizzes/${quizId}/activate`);
              Alert.alert('Sucesso', 'Quiz ativado! Participantes podem se inscrever.');
              loadQuiz();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao ativar quiz');
            }
          },
        },
      ]
    );
  };

  const handleStartQuiz = () => {
    Alert.alert(
      'Iniciar Quiz',
      'Tem certeza que deseja iniciar este quiz? Todos os participantes poderão começar a jogar.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              await api.post(`/quizzes/${quizId}/start`);
              Alert.alert('Sucesso', 'Quiz iniciado! Os participantes já podem jogar.');
              loadQuiz();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao iniciar quiz');
            }
          },
        },
      ]
    );
  };

  const handleFinishQuiz = () => {
    Alert.alert(
      'Finalizar Quiz',
      'Tem certeza que deseja finalizar este quiz? Esta ação encerrará o quiz.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/quizzes/${quizId}/finish`);
              Alert.alert('Sucesso', 'Quiz finalizado!');
              loadQuiz();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao finalizar quiz');
            }
          },
        },
      ]
    );
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('Leaderboard', { quizId });
  };

  const handleAddQuestion = () => {
    navigation.navigate('AddQuestion', { quizId });
  };

  const handleEditQuiz = () => {
    navigation.navigate('EditQuiz', { quizId });
  };

  const handleDeleteQuiz = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/quizzes/${quizId}`);
              Alert.alert('Sucesso', 'Quiz excluído com sucesso!');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir quiz');
            }
          },
        },
      ]
    );
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

  console.log('🎨 RENDERING BUTTONS FOR STATUS:', quiz.status);

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perguntas ({quiz.questions?.length || 0})</Text>

        {(quiz.status === 'inactive' || quiz.status === 'active') && (
          <TouchableOpacity
            style={styles.addQuestionButton}
            onPress={handleAddQuestion}
          >
            <Text style={styles.buttonText}>+ Adicionar Pergunta</Text>
          </TouchableOpacity>
        )}
      </View>

      {quiz.questions && quiz.questions.length > 0 ? (
        quiz.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
            <Text style={styles.questionText}>{question.question_text}</Text>
            <Text style={styles.timeLimit}>
              Tempo: {question.time_limit} segundos
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyQuestions}>
          <Text style={styles.emptyText}>Nenhuma pergunta adicionada ainda</Text>
        </View>
      )}

      {quiz.status === 'inactive' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditQuiz}>
            <Text style={styles.buttonText}>✏️ Editar Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteQuiz}>
            <Text style={styles.buttonText}>🗑️ Excluir Quiz</Text>
          </TouchableOpacity>
        </View>
      )}

      {quiz.status === 'inactive' && (
        <TouchableOpacity style={styles.activateButton} onPress={handleActivateQuiz}>
          <Text style={styles.buttonText}>Ativar Quiz</Text>
        </TouchableOpacity>
      )}

      {quiz.status === 'active' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditQuiz}>
            <Text style={styles.buttonText}>✏️ Editar Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteQuiz}>
            <Text style={styles.buttonText}>🗑️ Excluir Quiz</Text>
          </TouchableOpacity>
        </View>
      )}

      {quiz.status === 'active' && quiz.questions && quiz.questions.length > 0 && (
        <TouchableOpacity style={styles.startButton} onPress={handleStartQuiz}>
          <Text style={styles.buttonText}>Iniciar Quiz</Text>
        </TouchableOpacity>
      )}

      {quiz.status === 'in_progress' && (
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishQuiz}>
          <Text style={styles.buttonText}>Finalizar Quiz</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyQuestions: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
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
  addQuestionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    marginTop: 5,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
    margin: 15,
    marginTop: 5,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#FF3B30',
    margin: 15,
    marginTop: 5,
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
