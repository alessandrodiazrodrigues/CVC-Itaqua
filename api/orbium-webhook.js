// ============================================================================
// SYSTELOS TUR - WEBHOOK ORBIUNS
// ============================================================================
// Arquivo: /api/orbium-webhook.js
// Versão: 1.0
// Autor: Alessandro Diaz Rodrigues
// Data: Novembro 2025
//
// FUNÇÃO:
// Recebe webhooks do Gmail (Script_MonitorarEmailOrbiuns.gs)
// Valida autenticação
// Repassa para backend Google Apps Script (Mod_WebhookOrbiuns.gs)
// Retorna confirmação
//
// ============================================================================

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CONFIG = {
  // Token de autenticação (deve ser o mesmo do script Gmail)
  AUTH_TOKEN: 'Bearer SYSTELOS_2025',
  
  // URL do Google Apps Script backend
  GAS_BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxw0y2qTzQFdnHsOwLqoVJjV00GtqNnftr4dK6LYiLK/dev',
  
  // Timeout para chamadas ao backend
  TIMEOUT_MS: 30000, // 30 segundos
  
  // Debug
  DEBUG_MODE: true
};

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

export default async function handler(req, res) {
  // Log da requisição
  debugLog('=== WEBHOOK RECEBIDO ===');
  debugLog('Method:', req.method);
  debugLog('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Tratar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    debugLog('✅ Preflight request (OPTIONS)');
    return res.status(200).json({ ok: true });
  }
  
  // Só aceitar POST
  if (req.method !== 'POST') {
    debugLog('❌ Método não permitido:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.'
    });
  }
  
  try {
    // 1. Validar autenticação
    const authResult = validarAutenticacao(req);
    if (!authResult.valid) {
      debugLog('❌ Autenticação falhou:', authResult.error);
      return res.status(401).json({
        success: false,
        error: authResult.error
      });
    }
    
    debugLog('✅ Autenticação válida');
    
    // 2. Validar corpo da requisição
    const dados = req.body;
    
    if (!dados) {
      debugLog('❌ Corpo da requisição vazio');
      return res.status(400).json({
        success: false,
        error: 'Corpo da requisição vazio'
      });
    }
    
    debugLog('📦 Dados recebidos:', JSON.stringify(dados, null, 2));
    
    // 3. Validar estrutura dos dados
    const validacao = validarDados(dados);
    if (!validacao.valid) {
      debugLog('❌ Dados inválidos:', validacao.error);
      return res.status(400).json({
        success: false,
        error: validacao.error
      });
    }
    
    debugLog('✅ Dados válidos');
    
    // 4. Enviar para backend Google Apps Script
    debugLog('🌐 Enviando para backend Google Apps Script...');
    
    const backendResult = await enviarParaBackend(dados);
    
    if (!backendResult.success) {
      debugLog('❌ Erro no backend:', backendResult.error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar no backend',
        details: backendResult.error
      });
    }
    
    debugLog('✅ Backend processou com sucesso!');
    debugLog('📄 Resposta do backend:', JSON.stringify(backendResult, null, 2));
    
    // 5. Retornar sucesso
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      data: {
        numeroOrbium: dados.dados?.numeroOrbium,
        status: dados.dados?.status,
        timestamp: new Date().toISOString(),
        backendResponse: backendResult.data
      }
    });
    
  } catch (error) {
    debugLog('❌ ERRO CRÍTICO:', error.message);
    debugLog('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}

// ============================================================================
// VALIDAR AUTENTICAÇÃO
// ============================================================================

/**
 * Valida o token de autenticação
 * @param {Object} req - Request object
 * @returns {Object} {valid: boolean, error: string}
 */
function validarAutenticacao(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) {
    return {
      valid: false,
      error: 'Header Authorization não encontrado'
    };
  }
  
  if (authHeader !== CONFIG.AUTH_TOKEN) {
    return {
      valid: false,
      error: 'Token inválido'
    };
  }
  
  return { valid: true };
}

// ============================================================================
// VALIDAR DADOS
// ============================================================================

/**
 * Valida estrutura dos dados recebidos
 * @param {Object} dados - Dados do webhook
 * @returns {Object} {valid: boolean, error: string}
 */
function validarDados(dados) {
  // Verificar campos obrigatórios
  if (!dados.tipo) {
    return {
      valid: false,
      error: 'Campo "tipo" é obrigatório'
    };
  }
  
  if (dados.tipo !== 'atualizacao_orbium') {
    return {
      valid: false,
      error: `Tipo inválido: ${dados.tipo}. Esperado: "atualizacao_orbium"`
    };
  }
  
  if (!dados.dados) {
    return {
      valid: false,
      error: 'Campo "dados" é obrigatório'
    };
  }
  
  // Validar estrutura de dados.dados
  const dadosOrbium = dados.dados;
  
  if (!dadosOrbium.numeroOrbium) {
    return {
      valid: false,
      error: 'Campo "dados.numeroOrbium" é obrigatório'
    };
  }
  
  if (!dadosOrbium.status) {
    return {
      valid: false,
      error: 'Campo "dados.status" é obrigatório'
    };
  }
  
  return { valid: true };
}

// ============================================================================
// ENVIAR PARA BACKEND
// ============================================================================

/**
 * Envia dados para backend Google Apps Script
 * @param {Object} dados - Dados a enviar
 * @returns {Object} {success: boolean, data: Object, error: string}
 */
async function enviarParaBackend(dados) {
  try {
    // Preparar payload para o backend
    const payload = {
      action: 'registrar_atualizacao_orbium',
      ...dados
    };
    
    debugLog('📤 Payload para backend:', JSON.stringify(payload, null, 2));
    
    // Fazer requisição POST para o Google Apps Script
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
    
    const response = await fetch(CONFIG.GAS_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    debugLog('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLog('❌ Response error:', errorText);
      
      return {
        success: false,
        error: `Backend retornou status ${response.status}: ${errorText}`
      };
    }
    
    const responseData = await response.json();
    debugLog('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (!responseData.success) {
      return {
        success: false,
        error: responseData.message || 'Backend retornou success=false'
      };
    }
    
    return {
      success: true,
      data: responseData.data || {}
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Timeout ao chamar backend (>${CONFIG.TIMEOUT_MS}ms)`
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// DEBUG LOG
// ============================================================================

/**
 * Log de debug com timestamp
 */
function debugLog(...args) {
  if (!CONFIG.DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// ============================================================================
// HEALTH CHECK (GET)
// ============================================================================

/**
 * Endpoint de health check (GET)
 * Acessar: https://cvc-itaqua.vercel.app/api/orbium-webhook
 */
export async function get(req, res) {
  return res.status(200).json({
    service: 'SYSTELOS TUR - Webhook Orbiuns',
    version: '1.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /api/orbium-webhook',
      health: 'GET /api/orbium-webhook'
    }
  });
}