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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';
import { saveAnonymousUser, addParticipatedQuiz, getAnonymousUserByCpf } from '../services/anonymousStorage';

type JoinQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'JoinQuiz'
>;

interface Props {
  navigation: JoinQuizScreenNavigationProp;
}

const JoinQuizScreen: React.FC<Props> = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExistingUser, setHasExistingUser] = useState(false);

  // Busca usuário quando CPF fica válido (11 dígitos)
  const handleCpfChange = async (text: string) => {
    const formatted = formatCPF(text);
    setCpf(formatted);

    const cleaned = text.replace(/\D/g, '');

    // Quando CPF tiver 11 dígitos, buscar no storage
    if (cleaned.length === 11) {
      const user = await getAnonymousUserByCpf(cleaned);
      if (user) {
        setName(user.name);
        setHasExistingUser(true);
      } else {
        // CPF novo, limpar nome e permitir edição
        setName('');
        setHasExistingUser(false);
      }
    } else {
      // CPF incompleto, permitir edição do nome
      if (hasExistingUser) {
        setName('');
        setHasExistingUser(false);
      }
    }
  };

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(cleaned.charAt(10))) return false;

    return true;
  };

  const handleJoin = async () => {
    if (!code) {
      Alert.alert('Erro', 'Digite o código do quiz');
      return;
    }

    if (!cpf) {
      Alert.alert('Erro', 'Digite seu CPF');
      return;
    }

    if (!validateCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido');
      return;
    }

    if (!name || name.trim().length < 3) {
      Alert.alert('Erro', 'Digite seu nome completo (mínimo 3 caracteres)');
      return;
    }

    setLoading(true);
    try {
      const cleanedCpf = cpf.replace(/\D/g, '');
      const trimmedName = name.trim();

      const response = await api.post(`/quizzes/join/${code.toUpperCase()}`, {
        cpf: cleanedCpf,
        participant_name: trimmedName,
      });
      const quizId = response.data.data.quiz.id;
      const quizStatus = response.data.data.quiz.status;
      const quizStartedAt = response.data.data.quiz.started_at;
      const canContinue = response.data.data.canContinue;
      const timeExpired = response.data.data.timeExpired;

      // Salvar dados do usuário anônimo
      await saveAnonymousUser(cleanedCpf, trimmedName);

      // Salvar o quiz na lista de participados
      await addParticipatedQuiz(quizId, code.toUpperCase());

      // Verificar se o tempo do quiz expirou
      if (timeExpired) {
        Alert.alert(
          'Tempo Expirado',
          'O tempo deste quiz já expirou. Você não pode mais participar, mas pode ver o ranking.',
          [
            {
              text: 'Ver Ranking',
              onPress: () => navigation.navigate('Leaderboard', { quizId }),
            },
          ]
        );
        return;
      }

      // Verificar se é continuação de quiz já participado
      if (canContinue) {
        // Usuário já está participando, pode continuar
        if (quizStatus === 'in_progress' && quizStartedAt) {
          Alert.alert('Bem-vindo de volta!', 'Você já está participando deste quiz. Continue jogando!', [
            {
              text: 'Continuar',
              onPress: () => navigation.navigate('PlayQuiz', { quizId }),
            },
          ]);
        } else {
          Alert.alert(
            'Quiz não iniciado',
            'Você já está participando deste quiz. Aguarde o organizador iniciar.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('WaitingForQuiz', { quizId }),
              },
            ]
          );
        }
        return;
      }

      // Verificar se o quiz já foi iniciado
      if (quizStatus === 'in_progress' && quizStartedAt) {
        // Quiz em andamento, pode jogar
        Alert.alert('Sucesso', 'Você entrou no quiz!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PlayQuiz', { quizId }),
          },
        ]);
      } else {
        // Quiz não iniciado, aguardar
        Alert.alert(
          'Quiz não iniciado',
          'Você entrou no quiz com sucesso! O organizador ainda não iniciou o quiz. Aguarde na tela de espera.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('WaitingForQuiz', { quizId }),
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao entrar no quiz';

      // Verificar se é erro de quiz já completado
      if (errorMessage.includes('já participou e completou')) {
        Alert.alert(
          'Quiz já concluído',
          'Você já participou e completou este quiz. Não é possível jogar novamente.',
          [
            {
              text: 'Ver Meus Quizzes',
              onPress: () => navigation.navigate('MyQuizzes'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar no Quiz</Text>
      <Text style={styles.subtitle}>Preencha seus dados para participar</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase())}
        placeholder="Código do Quiz (Ex: ABC123)"
        autoCapitalize="characters"
        maxLength={6}
      />

      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={handleCpfChange}
        placeholder="CPF"
        keyboardType="numeric"
        maxLength={14}
      />

      <TextInput
        style={[styles.input, hasExistingUser && styles.inputDisabled]}
        value={name}
        onChangeText={setName}
        placeholder="Nome Completo"
        autoCapitalize="words"
        editable={!hasExistingUser}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar no Quiz</Text>
        )}
      </TouchableOpacity>

      {hasExistingUser ? (
        <Text style={styles.infoTextLocked}>
          📌 Seu nome foi recuperado automaticamente
        </Text>
      ) : (
        <Text style={styles.infoText}>
          Seu CPF será usado apenas para evitar participações duplicadas
        </Text>
      )}
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  button: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  infoTextLocked: {
    fontSize: 12,
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default JoinQuizScreen;
