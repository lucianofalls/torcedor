const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Token do usuário admin (pega do login)
let authToken = '';
let quizId = '';

async function login() {
  console.log('\n🔐 Fazendo login...');
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@torcida.com',
    password: 'Instagram2023'
  });
  authToken = response.data.data.token;
  console.log('✅ Login OK - Token:', authToken.substring(0, 20) + '...');
  return authToken;
}

async function listQuizzes() {
  console.log('\n📋 Listando quizzes...');
  const response = await axios.get(`${API_URL}/quizzes`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const quizzes = response.data.data;
  console.log(`✅ ${quizzes.length} quiz(zes) encontrado(s)`);
  if (quizzes.length > 0) {
    quizId = quizzes[0].id;
    console.log(`   Quiz selecionado: "${quizzes[0].title}" (ID: ${quizId})`);
  }
  return quizzes;
}

async function getQuizDetails() {
  console.log(`\n🔍 Carregando detalhes do quiz ${quizId}...`);
  const response = await axios.get(`${API_URL}/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const quiz = response.data.data;
  console.log(`✅ Quiz: "${quiz.title}"`);
  console.log(`   Perguntas: ${quiz.questions.length}`);
  quiz.questions.forEach((q, i) => {
    console.log(`   ${i+1}. ${q.question_text} (ID: ${q.id}) - ${q.options.length} opções`);
  });
  return quiz;
}

async function editQuiz(quiz) {
  console.log(`\n✏️  EDITANDO QUIZ "${quiz.title}"...`);

  // 1. Atualizar dados básicos
  console.log('   1️⃣  Atualizando dados básicos...');
  await axios.put(`${API_URL}/quizzes/${quizId}`, {
    title: quiz.title + ' (EDITADO)',
    description: quiz.description,
    max_participants: quiz.max_participants
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log('   ✅ Dados básicos atualizados');

  // 2. Deletar TODAS as perguntas antigas
  console.log(`   2️⃣  Deletando ${quiz.questions.length} pergunta(s) antiga(s)...`);
  const originalQuestionIds = quiz.questions.map(q => q.id);

  for (const questionId of originalQuestionIds) {
    try {
      await axios.delete(`${API_URL}/quizzes/${quizId}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`   ✅ Pergunta ${questionId} deletada`);
    } catch (err) {
      console.log(`   ⚠️  Erro ao deletar ${questionId}:`, err.response?.data?.message || err.message);
    }
  }

  // 3. Criar TODAS as perguntas novamente (simulando edição)
  console.log(`   3️⃣  Criando ${quiz.questions.length + 1} pergunta(s) (incluindo 1 nova)...`);
  const newQuestions = [
    ...quiz.questions.map(q => ({
      question_text: q.question_text + ' (editada)',
      time_limit: q.time_limit,
      options: q.options.map(o => ({
        text: o.option_text,
        is_correct: o.option_order === 0 // primeira como correta
      }))
    })),
    // Nova pergunta adicionada
    {
      question_text: 'NOVA PERGUNTA TESTE',
      time_limit: 30,
      options: [
        { text: 'Opção A', is_correct: true },
        { text: 'Opção B', is_correct: false }
      ]
    }
  ];

  const newQuestionIds = [];
  for (const question of newQuestions) {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/questions`, question, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    newQuestionIds.push(response.data.data.id);
    console.log(`   ✅ Pergunta criada: "${question.question_text}" (ID: ${response.data.data.id})`);
  }

  console.log(`\n✅ SUCESSO! Quiz editado com ${newQuestionIds.length} perguntas`);
  console.log(`   IDs das novas perguntas:`, newQuestionIds);
  return newQuestionIds;
}

async function verifyEdit() {
  console.log(`\n🔍 Verificando se edição foi salva...`);
  const quiz = await getQuizDetails();

  if (quiz.title.includes('(EDITADO)')) {
    console.log('✅ Título foi atualizado!');
  } else {
    console.log('❌ Título NÃO foi atualizado');
  }

  const hasNewQuestion = quiz.questions.some(q => q.question_text === 'NOVA PERGUNTA TESTE');
  if (hasNewQuestion) {
    console.log('✅ Nova pergunta foi adicionada!');
  } else {
    console.log('❌ Nova pergunta NÃO foi adicionada');
  }

  return quiz;
}

async function editAgain(quiz) {
  console.log(`\n✏️  EDITANDO NOVAMENTE (2ª VEZ) - TESTE DO BUG...`);

  // Repetir o processo de edição
  await editQuiz(quiz);

  console.log(`\n🎯 TESTE FINAL: Verificando se 2ª edição funcionou...`);
  await verifyEdit();
}

async function runTest() {
  try {
    await login();
    await listQuizzes();

    const quiz1 = await getQuizDetails();
    const newIds1 = await editQuiz(quiz1);

    const quiz2 = await verifyEdit();

    console.log('\n' + '='.repeat(60));
    console.log('🔥 TESTE CRÍTICO: EDITANDO PELA 2ª VEZ');
    console.log('='.repeat(60));

    await editAgain(quiz2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE COMPLETO! Se chegou aqui, o bug foi CORRIGIDO!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

runTest();
