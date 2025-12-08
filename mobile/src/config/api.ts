import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Para simulador iOS e dispositivo físico: usar IP da máquina na rede
// localhost NÃO funciona no simulador iOS (aponta para o próprio simulador)
const API_URL = 'http://192.168.0.111:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
