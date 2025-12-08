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
import { Quiz, Question, AnswerResult } from '../types';
import { getAnonymousUser } from '../services/anonymousStorage';
import { useAuth } from '../contexts/AuthContext';

type PlayQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PlayQuiz'
>;

type PlayQuizScreenRouteProp = RouteProp<RootStackParamList, 'PlayQuiz'>;

interface Props {
  navigation: PlayQuizScreenNavigationProp;
  route: PlayQuizScreenRouteProp;
}

const PlayQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const { quizId } = route.params;
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [anonymousCpf, setAnonymousCpf] = useState<string | null>(null);

  useEffect(() => {
    loadAnonymousUserIfNeeded();
    loadQuiz();
  }, []);

  const loadAnonymousUserIfNeeded = async () => {
    if (!user) {
      const anonymousUser = await getAnonymousUser();
      if (anonymousUser) {
        setAnonymousCpf(anonymousUser.cpf);
      }
    }
  };

  useEffect(() => {
    // Verificar se o quiz foi iniciado antes de permitir jogar
    if (quiz && quiz.status !== 'in_progress') {
      Alert.alert(
        'Quiz não iniciado',
        'O quiz ainda não foi iniciado pelo organizador',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('WaitingForQuiz', { quizId }),
          },
        ]
      );
    }
  }, [quiz]);

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions[currentQuestionIndex]) {
      const question = quiz.questions[currentQuestionIndex];
      setTimeLeft(question.time_limit);
      setStartTime(Date.now());
      setSelectedOption(null);
    }
  }, [currentQuestionIndex, quiz]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading) {
      handleSubmit();
    }
  }, [timeLeft, loading]);

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

  const handleSubmit = async () => {
    // Quando o tempo acaba sem opção selecionada, pula para próxima pergunta
    if (!selectedOption && timeLeft === 0) {
      Alert.alert(
        'Tempo Esgotado!',
        'Você não respondeu a tempo. Próxima pergunta...',
        [
          {
            text: 'OK',
            onPress: handleNextQuestion,
          },
        ]
      );
      return;
    }

    // Se usuário clicar no botão sem selecionar opção
    if (!selectedOption) {
      Alert.alert('Aviso', 'Selecione uma opção');
      return;
    }

    setSubmitting(true);
    try {
      const timeTaken = Date.now() - startTime;
      const question = quiz!.questions![currentQuestionIndex];

      // Build request body - include CPF if anonymous user
      const requestBody: any = {
        question_id: question.id,
        option_id: selectedOption,
        time_taken_ms: timeTaken,
      };

      // Add CPF for anonymous users
      if (!user && anonymousCpf) {
        requestBody.cpf = anonymousCpf;
      }

      const response = await api.post(`/quizzes/${quizId}/answers`, requestBody);

      const result: AnswerResult = response.data.data;
      setScore(score + result.points_earned);

      Alert.alert(
        result.is_correct ? '✓ Correto!' : '✗ Incorreto!',
        `Você ganhou ${result.points_earned} pontos\n\nPontuação total: ${score + result.points_earned}`,
        [
          {
            text: 'Próxima',
            onPress: handleNextQuestion,
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      // Não mostrar erro se for problema de token/autenticação após salvar
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Pula para próxima mesmo com erro de autenticação
        handleNextQuestion();
      } else {
        Alert.alert('Erro', error.response?.data?.message || 'Erro ao enviar resposta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (quiz && quiz.questions && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      Alert.alert('Quiz Finalizado!', `Sua pontuação final: ${score} pontos`, [
        {
          text: 'Ver Ranking',
          onPress: () =>
            navigation.replace('Leaderboard', { quizId }),
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>Nenhuma pergunta disponível</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Pergunta {currentQuestionIndex + 1} de {quiz.questions.length}
        </Text>
        <Text style={styles.timer}>{timeLeft}s</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            {
              width: `${
                ((currentQuestionIndex + 1) / quiz.questions.length) * 100
              }%`,
            },
          ]}
        />
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Pontos: {score}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedOption === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => setSelectedOption(option.id)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.optionText,
                selectedOption === option.id && styles.optionTextSelected,
              ]}
            >
              {String.fromCharCode(65 + index)}. {option.option_text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedOption || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedOption || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Confirmar</Text>
        )}
      </TouchableOpacity>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  questionCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ddd',
  },
  progress: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  scoreContainer: {
    padding: 15,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  questionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 15,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PlayQuizScreen;
