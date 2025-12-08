import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';

type AddQuestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddQuestion'
>;

type AddQuestionScreenRouteProp = RouteProp<RootStackParamList, 'AddQuestion'>;

interface Props {
  navigation: AddQuestionScreenNavigationProp;
  route: AddQuestionScreenRouteProp;
}

interface Option {
  text: string;
  is_correct: boolean;
}

const AddQuestionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { quizId } = route.params;
  const [questionText, setQuestionText] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [options, setOptions] = useState<Option[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setOptions([...options, { text: '', is_correct: false }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  const handleSubmit = async () => {
    if (!questionText) {
      Alert.alert('Erro', 'Digite o texto da pergunta');
      return;
    }

    if (!timeLimit || parseInt(timeLimit) <= 0) {
      Alert.alert('Erro', 'Digite um tempo limite válido');
      return;
    }

    const filledOptions = options.filter((opt) => opt.text.trim() !== '');
    if (filledOptions.length < 2) {
      Alert.alert('Erro', 'Adicione pelo menos 2 opções');
      return;
    }

    const hasCorrectAnswer = filledOptions.some((opt) => opt.is_correct);
    if (!hasCorrectAnswer) {
      Alert.alert('Erro', 'Marque pelo menos uma opção como correta');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/quizzes/${quizId}/questions`, {
        question_text: questionText,
        time_limit: parseInt(timeLimit),
        options: filledOptions,
      });

      Alert.alert('Sucesso', 'Pergunta adicionada!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Erro ao adicionar pergunta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Pergunta</Text>
      <TextInput
        style={styles.input}
        value={questionText}
        onChangeText={setQuestionText}
        placeholder="Digite a pergunta"
        multiline
      />

      <Text style={styles.label}>Tempo Limite</Text>
      <TextInput
        style={styles.input}
        value={timeLimit}
        onChangeText={setTimeLimit}
        placeholder="Tempo em segundos"
        keyboardType="number-pad"
      />
      <Text style={styles.hint}>Tempo em segundos para responder</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Opções de Resposta</Text>
      </View>

      {options.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TextInput
            style={[styles.input, styles.optionInput]}
            value={option.text}
            onChangeText={(text) => updateOption(index, 'text', text)}
            placeholder={`Opção ${index + 1}`}
          />
          <TouchableOpacity
            style={[
              styles.correctButton,
              option.is_correct && styles.correctButtonActive,
            ]}
            onPress={() => updateOption(index, 'is_correct', !option.is_correct)}
          >
            <Text style={styles.correctButtonText}>
              {option.is_correct ? '✓' : ' '}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
        <Text style={styles.addOptionButtonText}>+ Adicionar Opção</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Adicionar Pergunta</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: -5,
    marginBottom: 10,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  correctButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctButtonActive: {
    backgroundColor: '#34C759',
  },
  correctButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addOptionButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addOptionButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddQuestionScreen;
