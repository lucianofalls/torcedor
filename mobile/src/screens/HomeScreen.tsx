import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { Quiz } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data.data);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar os quizzes');
    } finally {
      setLoading(false);
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => navigation.navigate('QuizDetails', { quizId: item.id })}
    >
      <Text style={styles.quizTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.quizDescription}>{item.description}</Text>
      )}
      <View style={styles.quizInfo}>
        <Text style={styles.quizCode}>Código: {item.code}</Text>
        <Text style={styles.quizStatus}>Status: {item.status}</Text>
      </View>
      {item.participant_count !== undefined && (
        <Text style={styles.participants}>
          Participantes: {item.participant_count}/{item.max_participants}
        </Text>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.welcomeText}>Olá, {user?.name}!</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={() => navigation.navigate('CreateQuiz')}
        >
          <Text style={styles.actionButtonText}>Criar Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => navigation.navigate('JoinQuiz')}
        >
          <Text style={styles.actionButtonText}>Entrar em Quiz</Text>
        </TouchableOpacity>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não criou nenhum quiz</Text>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadQuizzes}
        />
      )}
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  joinButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  quizCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quizCode: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  quizStatus: {
    fontSize: 14,
    color: '#666',
  },
  participants: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default HomeScreen;
