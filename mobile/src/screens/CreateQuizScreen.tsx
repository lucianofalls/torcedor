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
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';

type CreateQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateQuiz'
>;

interface Props {
  navigation: CreateQuizScreenNavigationProp;
}

interface QuestionData {
  question_text: string;
  time_limit: string;
  options: { text: string; is_correct: boolean }[];
}

const CreateQuizScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        time_limit: '30',
        options: [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push({ text: '', is_correct: false });
    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = {
      ...updatedQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const handleCreate = async () => {
    if (!title) {
      Alert.alert('Erro', 'Digite o título do quiz');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma pergunta');
      return;
    }

    setLoading(true);
    try {
      // Criar quiz
      const quizResponse = await api.post('/quizzes', {
        title,
        description,
        max_participants: parseInt(maxParticipants),
      });

      const quizId = quizResponse.data.data.id;

      // Adicionar perguntas
      for (const question of questions) {
        await api.post(`/quizzes/${quizId}/questions`, {
          question_text: question.question_text,
          time_limit: parseInt(question.time_limit),
          options: question.options,
        });
      }

      // Ativar quiz
      await api.post(`/quizzes/${quizId}/start`);

      Alert.alert('Sucesso', 'Quiz criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Título do Quiz</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Digite o título"
      />

      <Text style={styles.label}>Descrição (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Digite a descrição"
        multiline
      />

      <Text style={styles.label}>Máximo de Participantes</Text>
      <TextInput
        style={styles.input}
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        placeholder="50"
        keyboardType="number-pad"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perguntas</Text>
        <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
          <Text style={styles.addButtonText}>+ Adicionar Pergunta</Text>
        </TouchableOpacity>
      </View>

      {questions.map((question, qIndex) => (
        <View key={qIndex} style={styles.questionCard}>
          <Text style={styles.questionNumber}>Pergunta {qIndex + 1}</Text>

          <TextInput
            style={styles.input}
            value={question.question_text}
            onChangeText={(text) => updateQuestion(qIndex, 'question_text', text)}
            placeholder="Digite a pergunta"
          />

          <TextInput
            style={styles.input}
            value={question.time_limit}
            onChangeText={(text) => updateQuestion(qIndex, 'time_limit', text)}
            placeholder="Tempo limite (segundos)"
            keyboardType="number-pad"
          />

          <Text style={styles.optionsLabel}>Opções:</Text>
          {question.options.map((option, oIndex) => (
            <View key={oIndex} style={styles.optionRow}>
              <TextInput
                style={[styles.input, styles.optionInput]}
                value={option.text}
                onChangeText={(text) => updateOption(qIndex, oIndex, 'text', text)}
                placeholder={`Opção ${oIndex + 1}`}
              />
              <TouchableOpacity
                style={[
                  styles.correctButton,
                  option.is_correct && styles.correctButtonActive,
                ]}
                onPress={() =>
                  updateOption(qIndex, oIndex, 'is_correct', !option.is_correct)
                }
              >
                <Text style={styles.correctButtonText}>
                  {option.is_correct ? '✓' : ' '}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addOptionButton}
            onPress={() => addOption(qIndex)}
          >
            <Text style={styles.addOptionButtonText}>+ Adicionar Opção</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Criar Quiz</Text>
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
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
  },
  addOptionButtonText: {
    color: '#007AFF',
  },
  createButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateQuizScreen;
