import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';
import { LeaderboardEntry } from '../types';

type LeaderboardScreenRouteProp = RouteProp<RootStackParamList, 'Leaderboard'>;

interface Props {
  route: LeaderboardScreenRouteProp;
}

const LeaderboardScreen: React.FC<Props> = ({ route }) => {
  const { quizId } = route.params;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}/leaderboard`);
      setLeaderboard(response.data.data);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar o ranking');
    } finally {
      setLoading(false);
    }
  };

  const renderMedal = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}º`;
    }
  };

  // Formatar CPF para exibição: XXX.XXX.XXX-XX
  const formatCpf = (cpf: string | undefined) => {
    if (!cpf) return '';
    // Mostrar apenas os 3 primeiros e 2 últimos dígitos
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
    }
    return cpf;
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.position}>{renderMedal(item.position)}</Text>
      <View style={styles.itemInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.user_name}</Text>
          {item.cpf && <Text style={styles.cpfText}>{formatCpf(item.cpf)}</Text>}
        </View>
        <Text style={styles.stats}>
          {item.correct_answers}/{item.total_questions} corretas • {item.total_score}{' '}
          pontos
        </Text>
      </View>
      <Text style={styles.time}>{(item.total_time_ms / 1000).toFixed(1)}s</Text>
    </View>
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
        <Text style={styles.title}>Ranking</Text>
        <TouchableOpacity onPress={loadLeaderboard}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum participante ainda</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContainer}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshText: {
    color: '#007AFF',
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  position: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 60,
  },
  itemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cpfText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 14,
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

export default LeaderboardScreen;
