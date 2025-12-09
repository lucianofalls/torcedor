import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../config/api';

type CreateQuizScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateQuiz' | 'EditQuiz'
>;

type CreateQuizScreenRouteProp = RouteProp<RootStackParamList, 'EditQuiz'>;

interface Props {
  navigation: CreateQuizScreenNavigationProp;
  route?: CreateQuizScreenRouteProp;
}

interface QuestionData {
  id?: string; // ID da pergunta (quando editando)
  question_text: string;
  time_limit: string;
  options: { text: string; is_correct: boolean }[];
}

const CreateQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const quizId = route?.params?.quizId;
  const isEditMode = !!quizId;

  const scrollViewRef = useRef<ScrollView>(null);
  const questionRefs = useRef<{[key: number]: View | null}>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [timeLimit, setTimeLimit] = useState('30'); // Tempo limite por pergunta (em segundos)
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(isEditMode);
  const [originalQuestionIds, setOriginalQuestionIds] = useState<string[]>([]); // IDs originais para controle de deleção

  useEffect(() => {
    if (isEditMode) {
      loadQuizData();
    }
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      setLoadingQuiz(true);
      const response = await api.get(`/quizzes/${quizId}`);
      const quiz = response.data.data;

      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setMaxParticipants(quiz.max_participants?.toString() || '50');
      setTimeLimit(quiz.time_limit?.toString() || '30');

      if (quiz.questions && quiz.questions.length > 0) {
        const formattedQuestions = quiz.questions.map((q: any) => ({
          id: q.id, // Salvar o ID da pergunta para edição
          question_text: q.question_text,
          time_limit: q.time_limit?.toString() || '30',
          options: (q.options || []).map((opt: any) => ({
            text: opt.option_text || opt.text || '',
            is_correct: opt.is_correct || false,
          })),
        }));
        setQuestions(formattedQuestions);
        // Salvar IDs originais para controle de deleção
        setOriginalQuestionIds(quiz.questions.map((q: any) => q.id));
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
    } finally {
      setLoadingQuiz(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set<number>();
    if (!expandedQuestions.has(index)) {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const addQuestion = () => {
    const newIndex = questions.length;
    const newQuestion: QuestionData = {
      question_text: '',
      time_limit: '30',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ],
    };
    setQuestions([...questions, newQuestion]);

    // Fechar TODAS as perguntas anteriores e abrir apenas a nova
    const newExpanded = new Set<number>();
    newExpanded.add(newIndex);
    setExpandedQuestions(newExpanded);

    // Scroll automático para a nova pergunta após um pequeno delay
    setTimeout(() => {
      const questionRef = questionRefs.current[newIndex];
      if (questionRef) {
        questionRef.measureLayout(
          scrollViewRef.current?.getInnerViewNode() as any,
          (_left, top) => {
            scrollViewRef.current?.scrollTo({ y: top - 20, animated: true });
          },
          () => {}
        );
      }
    }, 100);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);

    // Atualizar índices expandidos
    const newExpanded = new Set<number>();
    expandedQuestions.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedQuestions(newExpanded);
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
    console.log('🔵 [CreateQuiz] handleCreate INICIADO');
    console.log('🔵 [CreateQuiz] isEditMode:', isEditMode);
    console.log('🔵 [CreateQuiz] quizId:', quizId);
    console.log('🔵 [CreateQuiz] title:', title);
    console.log('🔵 [CreateQuiz] questions.length:', questions.length);

    if (!title) {
      console.log('🔴 [CreateQuiz] ERRO: Título vazio');
      Alert.alert('Erro', 'Digite o título do quiz');
      return;
    }

    if (questions.length === 0) {
      console.log('🔴 [CreateQuiz] ERRO: Nenhuma pergunta');
      Alert.alert('Erro', 'Adicione pelo menos uma pergunta');
      return;
    }

    console.log('🔵 [CreateQuiz] Validando perguntas...');
    // Validar perguntas
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`🔵 [CreateQuiz] Validando pergunta ${i + 1}:`, q.question_text);

      if (!q.question_text.trim()) {
        console.log(`🔴 [CreateQuiz] ERRO: Pergunta ${i + 1} sem texto`);
        Alert.alert('Erro', `Pergunta ${i + 1}: Digite o texto da pergunta`);
        return;
      }
      const filledOptions = q.options.filter(opt => opt.text.trim() !== '');
      console.log(`🔵 [CreateQuiz] Pergunta ${i + 1} tem ${filledOptions.length} opções preenchidas`);
      console.log(`🔵 [CreateQuiz] filledOptions:`, JSON.stringify(filledOptions));

      if (filledOptions.length < 2) {
        console.log(`🔴 [CreateQuiz] ERRO: Pergunta ${i + 1} com menos de 2 opções`);
        Alert.alert('Erro', `Pergunta ${i + 1}: Adicione pelo menos 2 opções`);
        return;
      }

      console.log(`🔵 [CreateQuiz] Checando is_correct em ${filledOptions.length} opções`);
      const hasCorrectAnswer = filledOptions.some(opt => {
        console.log(`🔵 [CreateQuiz] Opção:`, JSON.stringify(opt));
        console.log(`🔵 [CreateQuiz] opt.is_correct =`, opt.is_correct);
        return opt.is_correct;
      });
      console.log(`🔵 [CreateQuiz] hasCorrectAnswer =`, hasCorrectAnswer);

      if (!hasCorrectAnswer) {
        console.log(`🔴 [CreateQuiz] ERRO: Pergunta ${i + 1} sem resposta correta`);
        Alert.alert('Erro', `Pergunta ${i + 1}: Marque pelo menos uma resposta correta`);
        return;
      }
    }

    console.log('✅ [CreateQuiz] Todas as validações passaram! Prosseguindo...');

    console.log('🔵 [CreateQuiz] setLoading(true)');
    setLoading(true);

    console.log('🔵 [CreateQuiz] Entrando no try block');
    try {
      if (isEditMode) {
        console.log('🟡 [CreateQuiz] MODO EDIÇÃO - Atualizando dados básicos do quiz...');
        console.log('🟡 [CreateQuiz] PUT /quizzes/' + quizId);

        // Editar quiz existente
        const putResponse = await api.put(`/quizzes/${quizId}`, {
          title,
          description,
          max_participants: parseInt(maxParticipants),
          time_limit: parseInt(timeLimit),
        });
        console.log('✅ [CreateQuiz] Dados básicos atualizados! Response:', putResponse.status);

        console.log('🟡 [CreateQuiz] Deletando TODAS as', originalQuestionIds.length, 'perguntas antigas do quiz');
        console.log('🟡 [CreateQuiz] IDs a deletar:', originalQuestionIds);

        // Deletar TODAS as perguntas antigas
        for (const questionId of originalQuestionIds) {
          console.log('[CreateQuiz] Deletando pergunta ID:', questionId);
          try {
            await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
          } catch (err) {
            console.log('[CreateQuiz] Erro ao deletar pergunta (pode já ter sido deletada):', err);
          }
        }

        console.log('[CreateQuiz] Criando todas as perguntas atuais');

        // Criar TODAS as perguntas atuais (antigas e novas)
        const newQuestionIds: string[] = [];
        for (const question of questions) {
          const filledOptions = question.options.filter(opt => opt.text.trim() !== '');
          if (filledOptions.length < 2) {
            Alert.alert('Erro', `A pergunta "${question.question_text}" precisa ter pelo menos 2 opções`);
            setLoading(false);
            return;
          }

          console.log('[CreateQuiz] Criando pergunta:', question.question_text);
          const questionResponse = await api.post(`/quizzes/${quizId}/questions`, {
            question_text: question.question_text,
            time_limit: parseInt(question.time_limit),
            options: filledOptions,
          });

          // Salvar o ID da nova pergunta
          if (questionResponse.data.data && questionResponse.data.data.id) {
            newQuestionIds.push(questionResponse.data.data.id);
            console.log('[CreateQuiz] Pergunta criada com ID:', questionResponse.data.data.id);
          }
        }

        // Atualizar os IDs originais para refletir as novas perguntas
        setOriginalQuestionIds(newQuestionIds);

        console.log('[CreateQuiz] ✅ Quiz atualizado com sucesso!');
        console.log('[CreateQuiz] Novos IDs das perguntas:', newQuestionIds);

        // Mostrar toast de sucesso no Android
        if (Platform.OS === 'android') {
          ToastAndroid.show('✅ Quiz atualizado com sucesso!', ToastAndroid.LONG);
        }

        Alert.alert(
          '✅ Sucesso',
          `Quiz atualizado com sucesso!\n\n` +
          `${questions.length} pergunta(s) salva(s)`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Criar quiz novo
        const quizResponse = await api.post('/quizzes', {
          title,
          description,
          max_participants: parseInt(maxParticipants),
          time_limit: parseInt(timeLimit),
        });

        const newQuizId = quizResponse.data.data.id;

        // Adicionar perguntas
        for (const question of questions) {
          const filledOptions = question.options.filter(opt => opt.text.trim() !== '');
          await api.post(`/quizzes/${newQuizId}/questions`, {
            question_text: question.question_text,
            time_limit: parseInt(question.time_limit),
            options: filledOptions,
          });
        }

        Alert.alert('Sucesso', 'Quiz criado com sucesso!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      console.log('🔴 [CreateQuiz] ERRO CAPTURADO NO CATCH!');
      console.log('🔴 [CreateQuiz] Tipo do erro:', typeof error);
      console.log('🔴 [CreateQuiz] error:', error);
      console.log('🔴 [CreateQuiz] error.message:', error.message);
      console.log('🔴 [CreateQuiz] error.response:', error.response);
      console.log('🔴 [CreateQuiz] error.response?.data:', error.response?.data);
      console.log('🔴 [CreateQuiz] error.response?.status:', error.response?.status);

      Alert.alert('Erro', error.response?.data?.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} quiz`);
    } finally {
      console.log('🔵 [CreateQuiz] FINALLY - setLoading(false)');
      setLoading(false);
    }

    console.log('🔵 [CreateQuiz] handleCreate FINALIZADO');
  };

  if (loadingQuiz) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10, color: '#666' }}>Carregando quiz...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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

        <Text style={styles.label}>Tempo por Pergunta (segundos)</Text>
        <TextInput
          style={styles.input}
          value={timeLimit}
          onChangeText={setTimeLimit}
          placeholder="30"
          keyboardType="number-pad"
        />
        <Text style={styles.hint}>Tempo que cada participante terá para responder cada pergunta</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas ({questions.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {questions.map((question, qIndex) => {
          const isExpanded = expandedQuestions.has(qIndex);
          const hasContent = question.question_text.trim() !== '';

          return (
            <View
              key={qIndex}
              style={styles.questionCard}
              ref={(ref) => {
                questionRefs.current[qIndex] = ref;
              }}
            >
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => toggleQuestion(qIndex)}
              >
                <View style={styles.questionHeaderLeft}>
                  <Text style={styles.questionNumber}>Pergunta {qIndex + 1}</Text>
                  {hasContent && !isExpanded && (
                    <Text style={styles.questionPreview} numberOfLines={1}>
                      {question.question_text}
                    </Text>
                  )}
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  <View style={styles.questionContent}>
                    <TextInput
                      style={styles.input}
                      value={question.question_text}
                      onChangeText={(text) => updateQuestion(qIndex, 'question_text', text)}
                      placeholder="Digite a pergunta"
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

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeQuestion(qIndex)}
                  >
                    <Text style={styles.removeButtonText}>🗑️ Remover Pergunta</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

        {/* Espaço para o botão fixo */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Botão fixo na parte inferior */}
      <View style={styles.fixedButtonContainer}>
        {loading && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator color="#007AFF" />
            <Text style={styles.savingText}>
              {isEditMode ? 'Salvando alterações...' : 'Criando quiz...'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            console.log('🟢 [CreateQuiz] BOTÃO PRESSIONADO!');
            console.log('🟢 [CreateQuiz] loading:', loading);
            console.log('🟢 [CreateQuiz] questions.length:', questions.length);
            console.log('🟢 [CreateQuiz] Chamando handleCreate...');
            handleCreate();
          }}
          disabled={loading || questions.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              {isEditMode ? 'Salvar Alterações' : 'Criar Quiz'} {questions.length > 0 && `(${questions.length} ${questions.length === 1 ? 'pergunta' : 'perguntas'})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: -5,
    marginBottom: 10,
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
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  questionHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  questionPreview: {
    fontSize: 14,
    color: '#666',
  },
  expandIcon: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  questionContent: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  removeButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  createButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  savingText: {
    marginLeft: 10,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateQuizScreen;

