import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_USER_KEY = '@torcedor:anonymous_user';
const PARTICIPATED_QUIZZES_KEY = '@torcedor:participated_quizzes';

export interface AnonymousUser {
  cpf: string;
  name: string;
}

export interface ParticipatedQuiz {
  quizId: string;
  code: string;
  joinedAt: string;
}

export const saveAnonymousUser = async (cpf: string, name: string): Promise<void> => {
  try {
    const user: AnonymousUser = { cpf, name };
    await AsyncStorage.setItem(ANONYMOUS_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving anonymous user:', error);
    throw error;
  }
};

export const getAnonymousUser = async (): Promise<AnonymousUser | null> => {
  try {
    const userData = await AsyncStorage.getItem(ANONYMOUS_USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Error getting anonymous user:', error);
    return null;
  }
};

export const clearAnonymousUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
  } catch (error) {
    console.error('Error clearing anonymous user:', error);
    throw error;
  }
};

export const addParticipatedQuiz = async (quizId: string, code: string): Promise<void> => {
  try {
    const quizzes = await getParticipatedQuizzes();

    // Verificar se já existe
    const exists = quizzes.find(q => q.quizId === quizId);
    if (exists) {
      return; // Já existe, não adiciona novamente
    }

    const newQuiz: ParticipatedQuiz = {
      quizId,
      code,
      joinedAt: new Date().toISOString(),
    };

    quizzes.push(newQuiz);
    await AsyncStorage.setItem(PARTICIPATED_QUIZZES_KEY, JSON.stringify(quizzes));
  } catch (error) {
    console.error('Error adding participated quiz:', error);
    throw error;
  }
};

export const getParticipatedQuizzes = async (): Promise<ParticipatedQuiz[]> => {
  try {
    const quizzesData = await AsyncStorage.getItem(PARTICIPATED_QUIZZES_KEY);
    if (quizzesData) {
      return JSON.parse(quizzesData);
    }
    return [];
  } catch (error) {
    console.error('Error getting participated quizzes:', error);
    return [];
  }
};

export const clearParticipatedQuizzes = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PARTICIPATED_QUIZZES_KEY);
  } catch (error) {
    console.error('Error clearing participated quizzes:', error);
    throw error;
  }
};

export const clearAllAnonymousData = async (): Promise<void> => {
  try {
    await clearAnonymousUser();
    await clearParticipatedQuizzes();
  } catch (error) {
    console.error('Error clearing all anonymous data:', error);
    throw error;
  }
};
