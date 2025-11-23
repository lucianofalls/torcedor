import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizDetailsScreen from '../screens/QuizDetailsScreen';
import JoinQuizScreen from '../screens/JoinQuizScreen';
import PlayQuizScreen from '../screens/PlayQuizScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CreateQuiz: undefined;
  QuizDetails: { quizId: string };
  JoinQuiz: undefined;
  PlayQuiz: { quizId: string };
  Leaderboard: { quizId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // ou um loading screen
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Criar Conta' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Meus Quizzes' }}
          />
          <Stack.Screen
            name="CreateQuiz"
            component={CreateQuizScreen}
            options={{ title: 'Criar Quiz' }}
          />
          <Stack.Screen
            name="QuizDetails"
            component={QuizDetailsScreen}
            options={{ title: 'Detalhes do Quiz' }}
          />
          <Stack.Screen
            name="JoinQuiz"
            component={JoinQuizScreen}
            options={{ title: 'Entrar no Quiz' }}
          />
          <Stack.Screen
            name="PlayQuiz"
            component={PlayQuizScreen}
            options={{ title: 'Quiz', headerShown: false }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ title: 'Ranking' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
