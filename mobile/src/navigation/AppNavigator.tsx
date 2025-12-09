import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateQuizScreen from '../screens/CreateQuizScreen';
import QuizDetailsScreen from '../screens/QuizDetailsScreen';
import AddQuestionScreen from '../screens/AddQuestionScreen';
import JoinQuizScreen from '../screens/JoinQuizScreen';
import PlayQuizScreen from '../screens/PlayQuizScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MyQuizzesScreen from '../screens/MyQuizzesScreen';
import WaitingForQuizScreen from '../screens/WaitingForQuizScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  CreateQuiz: undefined;
  EditQuiz: { quizId: string };
  QuizDetails: { quizId: string };
  AddQuestion: { quizId: string };
  JoinQuiz: undefined;
  PlayQuiz: { quizId: string };
  Leaderboard: { quizId: string };
  MyQuizzes: undefined;
  WaitingForQuiz: { quizId: string };
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
          <Stack.Screen
            name="MyQuizzes"
            component={MyQuizzesScreen}
            options={{ title: 'Meus Quizzes' }}
          />
          <Stack.Screen
            name="JoinQuiz"
            component={JoinQuizScreen}
            options={{ title: 'Entrar no Quiz' }}
          />
          <Stack.Screen
            name="WaitingForQuiz"
            component={WaitingForQuizScreen}
            options={{ title: 'Aguardando Quiz' }}
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
          <Stack.Screen
            name="QuizDetails"
            component={QuizDetailsScreen}
            options={{ title: 'Detalhes do Quiz' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Meus Quizzes',
              headerLeft: () => null
            }}
          />
          <Stack.Screen
            name="CreateQuiz"
            component={CreateQuizScreen as React.ComponentType<any>}
            options={{ title: 'Criar Quiz' }}
          />
          <Stack.Screen
            name="EditQuiz"
            component={CreateQuizScreen as React.ComponentType<any>}
            options={{ title: 'Editar Quiz' }}
          />
          <Stack.Screen
            name="QuizDetails"
            component={QuizDetailsScreen}
            options={{ title: 'Detalhes do Quiz' }}
          />
          <Stack.Screen
            name="AddQuestion"
            component={AddQuestionScreen}
            options={{ title: 'Adicionar Pergunta' }}
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
          <Stack.Screen
            name="WaitingForQuiz"
            component={WaitingForQuizScreen}
            options={{ title: 'Aguardando Quiz' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
