# CHANGELOG - Torcida Quiz Mobile App

---

## ⚠️ IMPORTANTE: Checklist de Versionamento para Deploy

**Antes de cada deploy no TestFlight/App Store, SEMPRE incrementar:**

| Arquivo | Campo | Descrição |
|---------|-------|-----------|
| `app.json` | `version` | Versão semântica (ex: 1.0.1 → 1.0.2) |
| `app.json` | `ios.buildNumber` | Build number iOS (ex: 2 → 3) |
| `app.json` | `android.versionCode` | Version code Android (ex: 2 → 3) |
| `ios/MinhaTorcida/Info.plist` | `CFBundleShortVersionString` | Mesma versão do app.json |
| `ios/MinhaTorcida/Info.plist` | `CFBundleVersion` | Mesmo buildNumber do app.json |

**Comandos para deploy:**
```bash
cd mobile
npx eas build --platform ios --profile production --non-interactive
npx eas submit --platform ios --latest
```

---

## [2025-12-11] - v1.0.1 - Fix de Network e CORS

### 🔧 Correções

#### Timeout de API aumentado
**Arquivo:** `src/config/api.ts`
**Problema:** App no TestFlight dava erro de network por timeout em cold start do Lambda
**Solução:** Timeout aumentado de 10s para 30s

```typescript
timeout: 30000, // era 10000
```

#### CORS melhorado no backend
**Arquivo:** `backend/src/utils/response.ts`
**Problema:** Headers CORS incompletos podiam causar problemas em alguns devices
**Solução:** Headers CORS completos adicionados

```typescript
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};
```

**Status:** ✅ Backend deployed na AWS

---

## [2025-11-24] - Atualização Major: SDK 52 e Correções de UX

### 🎯 Contexto
- App de quiz em tempo real para torcidas organizadas
- React Native + Expo com backend Node.js/PostgreSQL
- Usuario: admin@torcida.com / senha: admin123

### ✅ Compilação e Ambiente

#### Upgrade Completo do Expo SDK
**Problema:** App não abria no simulador com Xcode 26.1
**Solução:** Upgrade completo de dependências

**Mudanças em `package.json`:**
```json
{
  "expo": "~52.0.0" (antes: ~50.0.0),
  "react": "18.3.1" (antes: 18.2.0),
  "react-native": "0.76.5" (antes: 0.73.2),
  "@react-navigation/native": "^7.0.14",
  "@react-navigation/native-stack": "^7.1.13",
  "@react-navigation/bottom-tabs": "^7.2.1",
  "react-native-safe-area-context": "~4.12.0",
  "react-native-screens": "~4.4.0"
}
```

**Processo de Build:**
1. Limpeza total: `rm -rf ios/Pods ios/Podfile.lock node_modules package-lock.json`
2. `npm install` (1015 packages)
3. `npx expo prebuild --clean`
4. `npx expo install expo-asset` (dependência faltante)
5. `npx expo run:ios --device "iPhone 17 Pro"`

**Status:** ✅ Build bem-sucedido, app rodando no simulador

---

### 🎨 Correções de UX/UI

#### 1. Campo de Tempo com Indicação Clara
**Arquivo:** `src/screens/CreateQuizScreen.tsx`
**Problema:** Usuário não sabia que o tempo era em segundos
**Solução:** Adicionado label e hint explicativo

**Mudanças (linhas 171-179):**
```typescript
<Text style={styles.label}>Tempo Limite</Text>
<TextInput
  style={styles.input}
  value={question.time_limit}
  onChangeText={(text) => updateQuestion(qIndex, 'time_limit', text)}
  placeholder="Tempo em segundos"
  keyboardType="number-pad"
/>
<Text style={styles.hint}>Tempo em segundos para responder</Text>
```

**Estilo adicionado (linhas 252-257):**
```typescript
hint: {
  fontSize: 12,
  color: '#666',
  marginTop: -5,
  marginBottom: 10,
},
```

**Status:** ✅ Texto "segundos" agora aparece claramente

---

#### 2. Layout Melhorado do QuizDetailsScreen
**Arquivo:** `src/screens/QuizDetailsScreen.tsx`
**Problema:**
- Botão "Adicionar Pergunta" escondia perguntas existentes
- Layout confuso
- Perguntas não ficavam visíveis após adicionar novas

**Solução:** Reestruturação completa do layout

**Mudanças (linhas 100-133):**
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Perguntas ({quiz.questions?.length || 0})</Text>

  {quiz.status === 'active' && (
    <TouchableOpacity
      style={styles.addQuestionButton}
      onPress={handleAddQuestion}
    >
      <Text style={styles.buttonText}>+ Adicionar Pergunta</Text>
    </TouchableOpacity>
  )}
</View>

{quiz.questions && quiz.questions.length > 0 ? (
  quiz.questions.map((question, index) => (
    <View key={question.id} style={styles.questionCard}>
      <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
      <Text style={styles.questionText}>{question.question_text}</Text>
      <Text style={styles.timeLimit}>
        Tempo: {question.time_limit} segundos
      </Text>
    </View>
  ))
) : (
  <View style={styles.emptyQuestions}>
    <Text style={styles.emptyText}>Nenhuma pergunta adicionada ainda</Text>
  </View>
)}
```

**Estilos atualizados:**
- `section`: Agora usa flexDirection row para botão ficar ao lado do título
- `addQuestionButton`: Botão menor e compacto (paddingVertical: 8, paddingHorizontal: 15)
- `questionCard`: Adicionado marginHorizontal: 15 para melhor espaçamento
- Novos estilos: `emptyQuestions`, `emptyText`

**Status:** ✅ Perguntas sempre visíveis, botão compacto no header

---

#### 3. Auto-reload da Lista de Quizzes
**Arquivo:** `src/screens/HomeScreen.tsx`
**Problema:** Quiz criado não aparecia na lista até recarregar manualmente
**Solução:** Implementado `useFocusEffect` para recarregar automaticamente

**Mudanças:**

**Imports adicionados (linha 1):**
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
```

**Refatoração do loadQuizzes (linhas 29-45):**
```typescript
const loadQuizzes = useCallback(async () => {
  try {
    setLoading(true);
    const response = await api.get('/quizzes');
    setQuizzes(response.data.data);
  } catch (error: any) {
    Alert.alert('Erro', 'Não foi possível carregar os quizzes');
  } finally {
    setLoading(false);
  }
}, []);

useFocusEffect(
  useCallback(() => {
    loadQuizzes();
  }, [loadQuizzes])
);
```

**Status:** ✅ Lista recarrega automaticamente ao voltar para Home

---

### 📊 Estado Atual do App

#### Telas Implementadas
- ✅ LoginScreen
- ✅ RegisterScreen
- ✅ HomeScreen (com auto-reload)
- ✅ CreateQuizScreen (com hints de tempo)
- ✅ QuizDetailsScreen (layout melhorado)
- ✅ AddQuestionScreen
- ✅ JoinQuizScreen
- ✅ PlayQuizScreen
- ✅ LeaderboardScreen

#### Backend
- ✅ PostgreSQL rodando (container: torcida-postgres)
- ✅ Node.js API rodando (container: torcida-backend)
- ✅ Usuários no banco:
  - admin@torcida.com / admin123 (admin)
  - user1@test.com / test123
  - user2@test.com / test123
  - user3@test.com / test123

#### Funcionalidades Testadas
- ✅ Login/Registro
- ✅ Criar quiz
- ✅ Adicionar perguntas
- ✅ Visualizar perguntas em lista
- ✅ Auto-reload da lista

---

### 🔧 Ambiente Técnico

**Sistema:**
- macOS Darwin 25.1.0
- Xcode 26.1
- Node.js (via Docker para backend)
- PostgreSQL 15-alpine (via Docker)

**Simulador:**
- iPhone 17 Pro
- iOS 26.1

**Dependências Principais:**
- Expo SDK 52
- React Native 0.76.5
- React 18.3.1
- React Navigation 7.x
- Axios 1.7.9
- Socket.io-client 4.8.1

---

### 📝 Notas para Próximas Correções

#### Arquivos Principais do Projeto
```
mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx (auto-reload implementado)
│   │   ├── CreateQuizScreen.tsx (hints de tempo adicionados)
│   │   ├── QuizDetailsScreen.tsx (layout melhorado)
│   │   ├── AddQuestionScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── config/
│   │   └── api.ts
│   └── types/
│       └── index.ts
├── package.json (atualizado para SDK 52)
└── app.json
```

#### Como Rodar o App
```bash
# Backend (na raiz do projeto)
docker-compose up -d

# Mobile
cd mobile
npm install
npx expo run:ios --device "iPhone 17 Pro"
```

#### Problemas Conhecidos/Pendentes
- Nenhum problema crítico no momento
- App funcionando corretamente
- Todas as funcionalidades de criação e visualização de quiz operacionais

---

### 🎯 Próximos Passos Sugeridos
1. Testar fluxo completo de jogar quiz
2. Testar funcionalidade de ranking/leaderboard
3. Validar Socket.io para quiz em tempo real
4. Testar em dispositivo físico (se necessário)

---

**Última atualização:** 2025-12-11
**Status geral:** ✅ Estável e funcional
**Versão do app:** 1.0.1
