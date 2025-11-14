// =========================================================================
// SYSTELOS TUR - API OpenAI GPT-4
// Arquivo: /api/ai-google.js
// Descrição: API Vercel que usa OpenAI GPT-4 para gerar orçamentos
// =========================================================================

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

    // Construir prompt completo
    const promptCompleto = `
${prompt}

DADOS DO ORÇAMENTO:
${JSON.stringify(dadosOrcamento, null, 2)}

INSTRUÇÕES:
- Analise os dados fornecidos
- Gere um orçamento profissional e detalhado
- Use formatação clara e organizada
- Inclua todos os custos e serviços
- Seja preciso e objetivo
`;

    // Chamar OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em criar orçamentos de viagens profissionais e detalhados para a SYSTELOS TUR.'
          },
          {
            role: 'user',
            content: promptCompleto
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro OpenAI:', errorData);
      return res.status(response.status).json({ 
        error: 'Erro na API OpenAI',
        details: errorData 
      });
    }

    const data = await response.json();
    const orcamentoGerado = data.choices[0].message.content;

    // Retornar sucesso
    return res.status(200).json({
      success: true,
      orcamento: orcamentoGerado,
      tokens: data.usage,
      modelo: 'gpt-4'
    });

  } catch (error) {
    console.error('Erro no handler:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      message: error.message 
    });
  }
}