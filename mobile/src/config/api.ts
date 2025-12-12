import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API AWS Lambda - Produção
const API_URL = 'https://wtm7jm5p62.execute-api.us-east-1.amazonaws.com/prod';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Aumentado para suportar cold start do Lambda
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    console.log(`[API] Fazendo requisição para: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('[API] Dados:', config.data);
    const token = await AsyncStorage.getItem('@torcida:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('[API] Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    console.log('[API] Resposta recebida:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.log('[API] Erro na resposta:', error.message);
    console.log('[API] Detalhes do erro:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('@torcida:token');
      await AsyncStorage.removeItem('@torcida:user');
      // Aqui você pode redirecionar para a tela de login
    }
    return Promise.reject(error);
  }
);

export default api;
