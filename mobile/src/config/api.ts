import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP do Windows para testar no iPhone (mesma rede Wi-Fi)
const API_URL = 'http://192.168.0.121:3000';

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
    const token = await AsyncStorage.getItem('@torcida:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('@torcida:token');
      await AsyncStorage.removeItem('@torcida:user');
      // Aqui você pode redirecionar para a tela de login
    }
    return Promise.reject(error);
  }
);

export default api;
