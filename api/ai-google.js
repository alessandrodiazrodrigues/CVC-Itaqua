// =========================================================================
// SYSTELOS TUR - API OpenAI Assistant
// Arquivo: /api/ai-google.js
// Descrição: API Vercel que usa OpenAI Assistant para gerar orçamentos
// =========================================================================

const ASSISTANT_ID = 'asst_gEubbhSzbBZF1p3l4vXDIrpu';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { prompt, dadosOrcamento } = req.body;

    // Validação
    if (!prompt || !dadosOrcamento) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        message: 'prompt e dadosOrcamento são obrigatórios' 
      });
    }

    // Pegar chave da OpenAI
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'Configuração inválida',
        message: 'OPENAI_API_KEY não configurada no Vercel' 
      });
    }

    // Construir mensagem completa
    const mensagemCompleta = `
${prompt}

DADOS DO ORÇAMENTO:
${JSON.stringify(dadosOrcamento, null, 2)}

Por favor, gere um orçamento detalhado, profissional e completo baseado nas informações fornecidas.
`;

    console.log('📤 Criando thread...');

    // PASSO 1: Criar Thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.json();
      console.error('❌ Erro ao criar thread:', error);
      throw new Error('Erro ao criar thread: ' + (error.error?.message || 'Desconhecido'));
    }

    const thread = await threadResponse.json();
    console.log('✅ Thread criada:', thread.id);

    // PASSO 2: Adicionar mensagem na thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: mensagemCompleta
      })
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      console.error('❌ Erro ao adicionar mensagem:', error);
      throw new Error('Erro ao adicionar mensagem: ' + (error.error?.message || 'Desconhecido'));
    }

    console.log('✅ Mensagem adicionada');

    // PASSO 3: Criar Run com o Assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    });

    if (!runResponse.ok) {
      const error = await runResponse.json();
      console.error('❌ Erro ao criar run:', error);
      throw new Error('Erro ao criar run: ' + (error.error?.message || 'Desconhecido'));
    }

    const run = await runResponse.json();
    console.log('✅ Run criado:', run.id);

    // PASSO 4: Aguardar conclusão do Run
    let runStatus = run;
    let attempts = 0;
    const maxAttempts = 60; // 60 tentativas = 2 minutos máximo

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Erro ao verificar status do run');
      }

      runStatus = await statusResponse.json();
      attempts++;
      
      console.log(`⏳ Status do run (tentativa ${attempts}):`, runStatus.status);

      // Verificar erros
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run falhou com status: ${runStatus.status}`);
      }
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Timeout: Assistant demorou muito para responder');
    }

    console.log('✅ Run completado!');

    // PASSO 5: Buscar mensagens da thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error('Erro ao buscar mensagens');
    }

    const messages = await messagesResponse.json();
    
    // Pegar a última mensagem do assistant
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('Nenhuma resposta do assistant');
    }

    // Extrair o texto da mensagem
    const orcamentoGerado = assistantMessage.content
      .filter(c => c.type === 'text')
      .map(c => c.text.value)
      .join('\n');

    console.log('✅ Orçamento gerado com sucesso!');

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      orcamento: orcamentoGerado,
      modelo: 'OpenAI Assistant',
      threadId: thread.id,
      runId: run.id
    });

  } catch (error) {
    console.error('❌ Erro no handler:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      message: error.message 
    });
  }
}