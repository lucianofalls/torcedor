import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';
import { getAnonymousUser } from '../services/anonymousStorage';

type MyQuizzesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MyQuizzes'
>;

interface Props {
  navigation: MyQuizzesScreenNavigationProp;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  code: string;
  status: string;
  started_at: string | null;
  question_count: number;
  participant_count: number;
  canPlay: boolean;
  statusMessage: string;
}

const MyQuizzesScreen: React.FC<Props> = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadQuizzes();
    });
    return unsubscribe;
  }, [navigation]);

  const loadQuizzes = async () => {
    try {
      const user = await getAnonymousUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não encontrado');
        navigation.replace('Login');
        return;
      }

      setUserName(user.name);

      const response = await api.get(`/participants/${user.cpf}/quizzes`);
      setQuizzes(response.data.data);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar seus quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuizzes();
  };

  const handleQuizPress = (quiz: Quiz) => {
    if (quiz.canPlay) {
      // Quiz em andamento, pode jogar
      navigation.navigate('PlayQuiz', { quizId: quiz.id });
    } else if (quiz.status === 'active' && !quiz.started_at) {
      // Quiz aguardando início
      navigation.navigate('WaitingForQuiz', { quizId: quiz.id });
    } else if (quiz.status === 'finished') {
      // Quiz finalizado, mostrar ranking
      Alert.alert(
        'Quiz Finalizado',
        'Este quiz já foi concluído. Deseja ver o ranking?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Ranking', onPress: () => navigation.navigate('Leaderboard', { quizId: quiz.id }) },
        ]
      );
    }
  };

  const handleJoinNewQuiz = () => {
    navigation.navigate('JoinQuiz');
  };

  const getStatusColor = (statusMessage: string) => {
    if (statusMessage === 'Em andamento') return '#34C759';
    if (statusMessage === 'Aguardando início') return '#FF9500';
    if (statusMessage === 'Finalizado') return '#999';
    return '#666';
  };

  const getStatusIcon = (statusMessage: string) => {
    if (statusMessage === 'Em andamento') return '🎮';
    if (statusMessage === 'Aguardando início') return '⏳';
    if (statusMessage === 'Finalizado') return '✅';
    return '❓';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Quizzes</Text>
        <Text style={styles.headerSubtitle}>Olá, {userName}!</Text>
      </View>

      <TouchableOpacity style={styles.joinButton} onPress={handleJoinNewQuiz}>
        <Text style={styles.joinButtonText}>+ Entrar em Novo Quiz</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {quizzes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Nenhum quiz encontrado</Text>
            <Text style={styles.emptyText}>
              Você ainda não participou de nenhum quiz.
            </Text>
            <Text style={styles.emptyText}>
              Toque em "Entrar em Novo Quiz" para começar!
            </Text>
          </View>
        ) : (
          quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => handleQuizPress(quiz)}
            >
              <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(quiz.statusMessage) },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getStatusIcon(quiz.statusMessage)} {quiz.statusMessage}
                  </Text>
                </View>
              </View>

              {quiz.description && (
                <Text style={styles.quizDescription} numberOfLines={2}>
                  {quiz.description}
                </Text>
              )}

              <View style={styles.quizInfo}>
                <Text style={styles.quizInfoText}>
                  Código: <Text style={styles.quizCode}>{quiz.code}</Text>
                </Text>
                <Text style={styles.quizInfoText}>
                  {quiz.question_count} pergunta{quiz.question_count !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.quizInfoText}>
                  {quiz.participant_count} participante{quiz.participant_count !== 1 ? 's' : ''}
                </Text>
              </View>

              {quiz.canPlay && (
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>▶ Jogar Agora</Text>
                </View>
              )}

              {quiz.status === 'active' && !quiz.started_at && (
                <View style={styles.waitingButton}>
                  <Text style={styles.waitingButtonText}>⏳ Aguardando</Text>
                </View>
              )}

              {quiz.status === 'finished' && (
                <View style={styles.finishedButton}>
                  <Text style={styles.finishedButtonText}>📊 Ver Ranking</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  joinButton: {
    backgroundColor: '#34C759',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  quizCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quizInfoText: {
    fontSize: 12,
    color: '#666',
  },
  quizCode: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  playButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  waitingButton: {
    backgroundColor: '#FF9500',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  waitingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  finishedButton: {
    backgroundColor: '#999',
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  finishedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MyQuizzesScreen;
