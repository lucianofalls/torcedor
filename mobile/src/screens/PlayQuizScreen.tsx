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
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // null = não iniciado ainda
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [anonymousCpf, setAnonymousCpf] = useState<string | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [readyToPlay, setReadyToPlay] = useState(false); // Flag para indicar que todas as verificações terminaram

  useEffect(() => {
    initializeQuiz();
  }, []);

  // Função que coordena todas as operações assíncronas na ordem correta
  const initializeQuiz = async () => {
    try {
      // 1. Primeiro carrega o quiz
      const quizData = await loadQuiz();
      if (!quizData) return;

      // 2. Depois verifica se usuário anônimo pode continuar
      const canContinue = await loadAnonymousUserAndCheckCompletion(quizData);
      if (!canContinue) return;

      // 3. Só agora marca como pronto para jogar (timer vai iniciar)
      setReadyToPlay(true);
    } catch (error) {
      console.error('Error initializing quiz:', error);
    }
  };

  // Retorna true se pode continuar, false se deve parar (já completou, tempo expirou, etc)
  const loadAnonymousUserAndCheckCompletion = async (quizData: Quiz): Promise<boolean> => {
    if (!user) {
      const anonymousUser = await getAnonymousUser();
      if (anonymousUser) {
        setAnonymousCpf(anonymousUser.cpf);

        // Verificar se o participante já completou este quiz ou pode retomar
        try {
          const response = await api.get(`/participants/${anonymousUser.cpf}/quizzes`);
          const quizzes = response.data.data;
          const thisQuiz = quizzes.find((q: any) => q.id === quizId);

          if (thisQuiz) {
            if (thisQuiz.isCompleted) {
              Alert.alert(
                'Quiz já concluído',
                'Você já participou e completou este quiz. Não é possível jogar novamente.',
                [
                  {
                    text: 'Ver Ranking',
                    onPress: () => navigation.replace('Leaderboard', { quizId }),
                  },
                ]
              );
              return false;
            } else if (thisQuiz.answeredQuestions && thisQuiz.answeredQuestions > 0) {
              // Participante pode retomar - buscar primeira pergunta não respondida
              console.log('📱 RESUMING QUIZ: Participant has answered', thisQuiz.answeredQuestions, 'questions');
              try {
                const progressResponse = await api.get(`/quizzes/${quizId}/progress?cpf=${anonymousUser.cpf}`);
                const progress = progressResponse.data.data;
                if (progress && progress.nextQuestionIndex !== undefined) {
                  console.log('📱 RESUMING FROM QUESTION INDEX:', progress.nextQuestionIndex);
                  setCurrentQuestionIndex(progress.nextQuestionIndex);
                  setScore(progress.currentScore || 0);
                }
              } catch (progressError: any) {
                console.error('Erro ao buscar progresso:', progressError);
                const status = progressError.response?.status;
                const errorData = progressError.response?.data;

                // Tempo do quiz expirou (HTTP 410)
                if (status === 410 || errorData?.data?.timeExpired) {
                  Alert.alert(
                    'Tempo Expirado',
                    'O tempo total do quiz já expirou. Você não pode mais continuar.',
                    [
                      {
                        text: 'Ver Ranking',
                        onPress: () => navigation.replace('Leaderboard', { quizId }),
                      },
                    ]
                  );
                  return false;
                }

                // Participante já completou (HTTP 400 com isCompleted)
                if (errorData?.data?.isCompleted) {
                  Alert.alert(
                    'Quiz já concluído',
                    'Você já completou este quiz.',
                    [
                      {
                        text: 'Ver Ranking',
                        onPress: () => navigation.replace('Leaderboard', { quizId }),
                      },
                    ]
                  );
                  return false;
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status do quiz:', error);
        }
      }
    }
    return true;
  };

  useEffect(() => {
    // Verificar se o quiz foi iniciado antes de permitir jogar
    console.log('📱 QUIZ STATUS CHECK:', {
      quizExists: !!quiz,
      status: quiz?.status,
      isInProgress: quiz?.status === 'in_progress'
    });
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
    // Só configurar timer se:
    // 1. readyToPlay = true (todas as verificações assíncronas terminaram)
    // 2. quiz existe e está em progresso
    // 3. tem perguntas disponíveis
    if (readyToPlay && quiz && quiz.status === 'in_progress' && quiz.questions && quiz.questions[currentQuestionIndex]) {
      const question = quiz.questions[currentQuestionIndex];
      // Usar time_limit do quiz (único para todas as perguntas)
      // Fallback para 30 segundos se time_limit não estiver definido
      const quizTimeLimit = quiz.time_limit || 30;
      console.log('⏱️ TIMER SETUP (readyToPlay=true):', {
        questionId: question.id,
        quizTimeLimit: quizTimeLimit,
        questionText: question.question_text?.substring(0, 30),
        quizStatus: quiz.status,
        questionIndex: currentQuestionIndex
      });
      // Iniciar o tempo da pergunta a partir de quando ela é exibida
      setTimeLeft(quizTimeLimit);
      setStartTime(Date.now());
      setSelectedOption(null);
      setTimerStarted(true);
    }
  }, [currentQuestionIndex, quiz, readyToPlay]);

  useEffect(() => {
    // Só iniciar o timer se ele foi efetivamente iniciado e timeLeft não é null
    if (timeLeft !== null && timerStarted) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (timeLeft === 0 && !loading && !submitting) {
        handleSubmit();
      }
    }
  }, [timeLeft, loading, timerStarted, submitting]);

  // Retorna o quiz carregado ou null se falhou
  const loadQuiz = async (): Promise<Quiz | null> => {
    try {
      console.log('📱 LOADING QUIZ:', quizId);
      const response = await api.get(`/quizzes/${quizId}`);
      const quizData = response.data.data;
      console.log('📱 QUIZ LOADED:', {
        id: quizData.id,
        title: quizData.title,
        status: quizData.status,
        questionsCount: quizData.questions?.length,
        firstQuestionTimeLimit: quizData.questions?.[0]?.time_limit
      });
      setQuiz(quizData);
      setLoading(false);
      return quizData;
    } catch (error: any) {
      console.error('📱 ERROR LOADING QUIZ:', error);
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
      setLoading(false);
      return null;
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
      const errorMessage = error.response?.data?.message || '';

      // Não mostrar erro se for problema de token/autenticação após salvar
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Pula para próxima mesmo com erro de autenticação
        handleNextQuestion();
      } else if (errorMessage.includes('já respondeu') || errorMessage.includes('already answered')) {
        // Pergunta já foi respondida - pular para próxima
        Alert.alert(
          'Pergunta já respondida',
          'Você já respondeu esta pergunta. Avançando para a próxima...',
          [{ text: 'OK', onPress: handleNextQuestion }]
        );
      } else if (errorMessage.includes('tempo') || errorMessage.includes('expirou') || errorMessage.includes('expired')) {
        // Tempo expirado - ir para leaderboard
        Alert.alert(
          'Tempo Expirado',
          'O tempo deste quiz já expirou.',
          [{ text: 'Ver Ranking', onPress: () => navigation.replace('Leaderboard', { quizId }) }]
        );
      } else {
        Alert.alert('Erro', errorMessage || 'Erro ao enviar resposta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (quiz && quiz.questions && currentQuestionIndex < quiz.questions.length - 1) {
      // Resetar timer para próxima pergunta
      setTimerStarted(false);
      setTimeLeft(null);
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

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Tempo restante:</Text>
        <Text style={[styles.timerValue, timeLeft !== null && timeLeft <= 5 && styles.timerWarning]}>
          {timeLeft !== null ? `${timeLeft}s` : '--'}
        </Text>
      </View>
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  questionCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timerWarning: {
    color: '#FF3B30',
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
