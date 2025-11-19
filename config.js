// ================================================================================
// ⚙️ SYSTELOS TUR - CONFIGURAÇÃO CENTRALIZADA v9.2 - ORBIUNS CORRIGIDO
// ================================================================================
// 🎯 ARQUIVO ÚNICO DE CONFIGURAÇÃO
// Todas as URLs, cores, APIs e configurações em UM SÓ LUGAR
// Se precisar mudar algo, muda APENAS aqui!
// 
// ✅ CORREÇÕES v9.2:
// - Planilha ORBIUNS agora aponta para planilha única (1dF8dfIh8EyvX...)
// - Aba "ORBIUNS" especificada (antes era "Dados")
// - Nova URL da API Google Apps Script atualizada (18/11/2025)
// - Sistema 100% funcional com planilha unificada
// ================================================================================

console.log('⚙️ Carregando SYSTELOS TUR - Configuração Centralizada v9.2 ORBIUNS CORRIGIDO...');

// ================================================================================
// 🏢 INFORMAÇÕES DO SISTEMA
// ================================================================================

const SYSTELOS_CONFIG = {
    // Identidade
    nome: 'SYSTELOS TUR',
    nomeCompleto: 'SYSTELOS TUR - Sistemas com Propósito',
    simbolo: '[S]',
    tagline: 'Sistemas com propósito',
    versao: '9.2',
    ambiente: 'production', // 'development' ou 'production'
    
    // 🏢 Configurações da Filial
    filial: '6220', // Filial Itaquaquecetuba
    
    // 👥 Vendedores Ativos (da aba USUARIOS)
    vendedores: [
        'ANA PAULA MUNIZ DE SOUZA',
        'ADRIELLY CORREA DE SOUSA',
        'DAINA ADRIANA SILVA DE BRITO',
        'ALESSANDRO DIAZ RODRIGUES',
        'CONCEPCION DIAZ RODRIGUES'
    ],
    
    // URLs e Endpoints
    urls: {
        // Frontend (Vercel)
        frontend: window.location.origin, // Pega automaticamente
        
        // 🆕 API Google Apps Script (PRODUÇÃO) - ATUALIZADO 18/11/2025
        apiGoogleScript: 'https://script.google.com/macros/s/AKfycbxGQLVaxk-pIybxl6qtogTEbMKlTyikLkWhErFSchc2vHCWgv1a4_jv8ITAhjsslupr/exec',
        
        // APIs do Backend (Vercel Serverless Functions)
        api: {
            orcamentos: '/api/ai-google',         // API principal de orçamentos com IA
            orbiuns: '/api/orbiuns',              // API de orbiuns/processos
            embarques: '/api/embarques',          // API de embarques (se existir)
            custos: '/api/custos',                // API de custos (se existir)
            openaiAssistant: '/api/openai-assistant', // OpenAI Assistant
            debug: '/api/debug-orbiuns'           // Debug API
        },
        
        // Google Sheets (PLANILHA ÚNICA)
        googleSheets: {
            // Planilha Principal (ÚNICA) - Contém TODAS as abas
            embarques: {
                planilhaId: '1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc',
                aba: 'EMBARQUES',
                urlBase: 'https://docs.google.com/spreadsheets/d/1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc'
            },
            
            // ✅ CORRIGIDO v9.2: ORBIUNS na mesma planilha, aba "ORBIUNS"
            orbiuns: {
                planilhaId: '1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc', // ← Mesma planilha!
                aba: 'ORBIUNS', // ← Aba específica (antes era "Dados")
                urlBase: 'https://docs.google.com/spreadsheets/d/1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc'
            },
            
            // Outras abas da planilha única
            usuarios: {
                planilhaId: '1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc',
                aba: 'USUARIOS',
                urlBase: 'https://docs.google.com/spreadsheets/d/1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc'
            },
            
            placarVendas: {
                planilhaId: '1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc',
                aba: 'PLACAR VENDAS',
                urlBase: 'https://docs.google.com/spreadsheets/d/1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc'
            }
        }
    }
};

// ================================================================================
// 🎨 IDENTIDADE VISUAL SYSTELOS TUR (conforme manual da marca)
// ================================================================================

const VISUAL_CONFIG = {
    // Cores Principais
    cores: {
        // Cor principal SYSTELOS
        azulPrincipal: '#0F1B3D',
        azul: '#0F1B3D',
        
        // Cores secundárias TUR
        amarelo: '#FFB800',        // Sol, viagens, energia
        verdeAgua: '#14B8A6',      // Praia, turismo
        
        // Cores neutras
        branco: '#FFFFFF',
        darkMode: '#1F2937',
        cinza: '#6C757D',
        cinzaClaro: '#F5F6FA'
    },
    
    // Tipografia (conforme manual)
    fontes: {
        titulos: 'Poppins, sans-serif',  // Para títulos e logo
        textos: 'Inter, sans-serif',      // Para textos gerais
        pesos: {
            light: 300,
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800
        }
    },
    
    // Logo e branding
    branding: {
        simbolo: '[S]',
        nome: 'SYSTELOS TUR',
        tagline: 'Sistemas com propósito',
        significado: 'SYS (sistema) + τέλος (telos: objetivo, em grego)',
        logoPath: 'assets/images/systelos-logo.png',
        faviconPath: 'assets/images/systelos-favicon.ico'
    },
    
    // Sombras
    sombras: {
        suave: '0 2px 8px rgba(15, 27, 61, 0.1)',
        media: '0 4px 15px rgba(15, 27, 61, 0.15)',
        forte: '0 8px 30px rgba(15, 27, 61, 0.2)'
    }
};

// ================================================================================
// 🤖 CONFIGURAÇÕES DE IA
// ================================================================================

const IA_CONFIG = {
    // Modelos disponíveis (baseado no ai-google.js)
    modelos: {
        padrao: 'claude-sonnet-4-20250514',
        alternativo: 'gpt-4o-mini',
        premium: 'claude-opus-4',
        haiku: 'claude-3-haiku-20240307'
    },
    
    // Configurações de processamento
    processamento: {
        maxTokens: 4000,
        temperatura: 0.7,
        timeout: 35000,     // 35 segundos
        retries: 3
    },
    
    // Custos estimados (para exibição ao usuário)
    custos: {
        'claude-sonnet-4-20250514': {
            input: 0.003,       // USD por 1K tokens
            output: 0.015,      // USD por 1K tokens
            nome: 'Claude Sonnet 4',
            recomendado: true
        },
        'gpt-4o-mini': {
            input: 0.00015,
            output: 0.0006,
            nome: 'GPT-4o Mini',
            economico: true
        },
        'claude-3-haiku-20240307': {
            input: 0.00025,
            output: 0.00125,
            nome: 'Claude Haiku',
            rapido: true
        }
    },
    
    // Conversão de moeda (atualizar periodicamente)
    moeda: {
        taxaUSDtoBRL: 5.2,
        ultimaAtualizacao: '2025-01-01',
        formatoBRL: 'R$ 0,000000'
    },
    
    // Templates disponíveis (baseado no ai-google.js v4.10)
    templates: {
        total: 14,
        tipos: [
            'AEREO_SIMPLES',
            'AEREO_SOMENTE_IDA',
            'MULTIPLAS_OPCOES_2',
            'MULTIPLAS_OPCOES_3',
            'MULTITRECHO',
            'HOTEIS_MULTIPLAS',
            'PACOTE_COMPLETO',
            'CRUZEIRO',
            'DICAS',
            'RANKING_HOTEIS',
            'MULTIPLAS_COMPANHIAS',
            'PASSEIOS',
            'SEGURO_VIAGEM'
        ]
    }
};

// ================================================================================
// 📋 CONFIGURAÇÕES DE ORÇAMENTOS
// ================================================================================

const ORCAMENTOS_CONFIG = {
    // Tipos de serviço disponíveis
    tiposServico: [
        { value: 'Aéreo', label: '✈️ Aéreo', icon: 'fa-plane' },
        { value: 'Hotel', label: '🏨 Hotel', icon: 'fa-hotel' },
        { value: 'Cruzeiro', label: '🚢 Cruzeiro', icon: 'fa-ship' },
        { value: 'Multitrechos', label: '🛤️ Multitrechos', icon: 'fa-route' },
        { value: 'Passeios', label: '🎡 Passeios', icon: 'fa-ticket' },
        { value: 'Seguro', label: '🛡️ Seguro Viagem', icon: 'fa-shield-alt' },
        { value: 'Dicas', label: '💡 Dicas de Destino', icon: 'fa-lightbulb' },
        { value: 'Ranking', label: '🏆 Ranking de Hotéis', icon: 'fa-star' }
    ],
    
    // Opções de parcelamento
    parcelamento: [
        { value: '', label: 'Sem parcelamento' },
        { value: '10', label: '10x sem juros' },
        { value: '12', label: '12x sem juros' },
        { value: '15', label: '15x sem juros' }
    ],
    
    // Limites
    limites: {
        maxAdultos: 10,
        maxCriancas: 5,
        maxIdadeCrianca: 17,
        maxFileSize: 10485760,      // 10MB em bytes
        maxPromptSize: 10000,        // caracteres
        maxImagens: 5
    },
    
    // Formatos aceitos
    formatos: {
        imagens: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        documentos: ['application/pdf'],
        aceitos: '.jpg,.jpeg,.png,.pdf,.webp'
    },
    
    // Destinos populares (para autocomplete)
    destinosPopulares: [
        'Orlando', 'Miami', 'Nova York', 'Las Vegas', 'Los Angeles',
        'Lisboa', 'Porto', 'Madrid', 'Barcelona', 'Paris', 'Roma', 'Londres',
        'Amsterdam', 'Buenos Aires', 'Santiago', 'Cancún',
        'Salvador', 'Fortaleza', 'Recife', 'Maceió', 'Natal', 'Porto Seguro'
    ]
};

// ================================================================================
// 💾 SISTEMA DE ESTADO (localStorage)
// ================================================================================

const ESTADO_CONFIG = {
    // Chaves do localStorage
    keys: {
        // Estado de orçamentos
        ultimoDestino: 'systelos_ultimo_destino',
        ultimosPassageiros: 'systelos_ultimos_passageiros',
        ultimoPeriodo: 'systelos_ultimo_periodo',
        ultimoTipo: 'systelos_ultimo_tipo',
        ultimoConteudo: 'systelos_ultimo_conteudo',

        // Custos e métricas
        custoDia: 'systelos_custos_dia_',      // + data
        custoMes: 'systelos_custos_mes',
        orcamentosHoje: 'systelos_orcamentos_hoje_', // + data

        // Preferências do usuário
        darkMode: 'systelos_dark_mode',
        nomeUsuario: 'systelos_nome_usuario',
        emailUsuario: 'systelos_email_usuario',
        usuario: 'systelos_user',               // Dados completos do usuário logado
        ultimoOrcamento: 'systelos_ultimo_orcamento' // Último orçamento gerado
    },
    
    // Tempo de expiração (em dias)
    expiracao: {
        cache: 7,           // Cache geral
        orcamentos: 30,     // Orçamentos salvos
        custos: 90          // Dados de custos
    },
    
    // ================================================================================
    // FUNÇÕES DE GERENCIAMENTO DE ESTADO (localStorage)
    // ================================================================================
    
    /**
     * Salvar dados no localStorage
     */
    salvar: function(chave, valor) {
        try {
            localStorage.setItem(chave, valor);
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    },
    
    /**
     * Carregar dados do localStorage
     */
    carregar: function(chave) {
        try {
            return localStorage.getItem(chave);
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return null;
        }
    },
    
    /**
     * Remover dados do localStorage
     */
    remover: function(chave) {
        try {
            localStorage.removeItem(chave);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    },
    
    /**
     * Limpar todo o localStorage do SYSTELOS
     */
    limparTudo: function() {
        try {
            const chaves = Object.values(this.keys);
            chaves.forEach(chave => {
                if (typeof chave === 'string') {
                    localStorage.removeItem(chave);
                }
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    }
};

// ================================================================================
// 🎨 CONFIGURAÇÕES DE UI
// ================================================================================

const UI_CONFIG = {
    // Animações
    animacoes: {
        duracao: 300,
        easing: 'ease-in-out'
    },
    
    // Mensagens
    mensagens: {
        carregando: 'Carregando...',
        processando: 'Processando sua solicitação...',
        erro: 'Ops! Algo deu errado.',
        sucesso: 'Operação realizada com sucesso!',
        semDados: 'Nenhum dado encontrado.',
        aguarde: 'Por favor, aguarde...'
    },
    
    // Toasts/Notificações
    notificacoes: {
        duracao: 3000,
        posicao: 'top-right'
    },
    
    // Loading
    loading: {
        tipo: 'spinner',
        mensagem: 'Processando...'
    }
};

// ================================================================================
// 🔧 CONFIGURAÇÕES TÉCNICAS
// ================================================================================

const TECH_CONFIG = {
    // Versões das dependências
    versoes: {
        bootstrap: '5.3.0',
        fontAwesome: '6.4.0',
        jquery: '3.6.0' // se usar
    },
    
    // Timeouts
    timeouts: {
        requisicao: 30000,      // 30 segundos
        debounce: 300,          // 300ms
        throttle: 1000          // 1 segundo
    },
    
    // Retry
    retry: {
        tentativas: 3,
        intervalo: 1000         // 1 segundo entre tentativas
    }
};

// ================================================================================
// 🛠️ UTILITÁRIOS
// ================================================================================

const CONFIG_UTILS = {
    /**
     * Obter URL da API baseado no tipo
     */
    getApiUrl: function(tipo) {
        // Se pedir API do Google Apps Script, retorna ela
        if (tipo === 'googleScript' || tipo === 'embarques' || tipo === 'vendas' || tipo === 'orbiuns') {
            return SYSTELOS_CONFIG.urls.apiGoogleScript;
        }
        
        // Senão, retorna API do Vercel
        return SYSTELOS_CONFIG.urls.api[tipo] || SYSTELOS_CONFIG.urls.frontend;
    },
    
    /**
     * Debug log padronizado
     */
    debugLog: function(mensagem, tipo = 'info') {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const prefixo = `[SYSTELOS ${timestamp}]`;
        
        switch(tipo) {
            case 'error':
                console.error(prefixo, '❌', mensagem);
                break;
            case 'warn':
                console.warn(prefixo, '⚠️', mensagem);
                break;
            case 'success':
                console.log(prefixo, '✅', mensagem);
                break;
            default:
                console.log(prefixo, 'ℹ️', mensagem);
        }
    },
    
    /**
     * Detectar ambiente
     */
    detectarAmbiente: function() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        if (hostname.includes('vercel.app') || hostname.includes('cvc-itaqua.vercel.app')) {
            return 'vercel';
        }
        
        return 'production';
    },
    
    /**
     * Verificar se é mobile
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Obter informações do navegador
     */
    getBrowserInfo: function() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'IE';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        
        return {
            name: browser,
            userAgent: ua
        };
    },
    
    /**
     * Aplicar tema (cores CSS variables)
     */
    aplicarTema: function() {
        const root = document.documentElement;
        
        // Aplicar cores SYSTELOS
        root.style.setProperty('--systelos-azul-principal', VISUAL_CONFIG.cores.azulPrincipal);
        root.style.setProperty('--systelos-amarelo', VISUAL_CONFIG.cores.amarelo);
        root.style.setProperty('--systelos-verde-agua', VISUAL_CONFIG.cores.verdeAgua);
        root.style.setProperty('--systelos-branco', VISUAL_CONFIG.cores.branco);
        root.style.setProperty('--systelos-dark-mode', VISUAL_CONFIG.cores.darkMode);
        
        // Aplicar sombras
        root.style.setProperty('--systelos-sombra-suave', VISUAL_CONFIG.sombras.suave);
        root.style.setProperty('--systelos-sombra-media', VISUAL_CONFIG.sombras.media);
        root.style.setProperty('--systelos-sombra-forte', VISUAL_CONFIG.sombras.forte);
        
        this.debugLog('Tema SYSTELOS aplicado', 'info');
    },
    
    /**
     * Calcular custo de tokens
     */
    calcularCusto: function(modelo, tokensInput, tokensOutput) {
        const config = IA_CONFIG.custos[modelo];
        if (!config) return { usd: 0, brl: 0 };
        
        const custoInputUSD = (tokensInput / 1000) * config.input;
        const custoOutputUSD = (tokensOutput / 1000) * config.output;
        const totalUSD = custoInputUSD + custoOutputUSD;
        const totalBRL = totalUSD * IA_CONFIG.moeda.taxaUSDtoBRL;
        
        return {
            usd: totalUSD.toFixed(6),
            brl: totalBRL.toFixed(6),
            input: custoInputUSD.toFixed(6),
            output: custoOutputUSD.toFixed(6)
        };
    },
    
    /**
     * Validar configuração
     */
    validar: function() {
        const erros = [];
        
        // Validar URLs essenciais
        if (!SYSTELOS_CONFIG.urls.apiGoogleScript) {
            erros.push('URL da API Google Apps Script não configurada');
        }
        
        if (!SYSTELOS_CONFIG.urls.googleSheets.embarques.planilhaId) {
            erros.push('ID da planilha EMBARQUES não configurado');
        }
        
        if (!SYSTELOS_CONFIG.urls.googleSheets.orbiuns.planilhaId) {
            erros.push('ID da planilha ORBIUNS não configurado');
        }
        
        // Validar vendedores
        if (!SYSTELOS_CONFIG.vendedores || SYSTELOS_CONFIG.vendedores.length === 0) {
            erros.push('Lista de vendedores vazia');
        }
        
        // Validar filial
        if (!SYSTELOS_CONFIG.filial) {
            erros.push('Código da filial não configurado');
        }
        
        return {
            valido: erros.length === 0,
            erros: erros
        };
    }
};

// ================================================================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 SYSTELOS TUR v9.2 - ORBIUNS CORRIGIDO');
    console.log('[S] Sistemas com Propósito');
    
    // Validar configuração
    const validacao = CONFIG_UTILS.validar();
    if (!validacao.valido) {
        console.error('❌ Configuração inválida:', validacao.erros);
        alert('Erro na configuração do sistema! Verifique o console.');
        return;
    }
    
    console.log('✅ Configuração validada');
    
    // Aplicar tema
    CONFIG_UTILS.aplicarTema();
    console.log('🎨 Tema SYSTELOS aplicado');
    
    // Logs informativos
    const ambiente = CONFIG_UTILS.detectarAmbiente();
    const mobile = CONFIG_UTILS.isMobile();
    const browser = CONFIG_UTILS.getBrowserInfo();
    
    CONFIG_UTILS.debugLog(`Ambiente: ${ambiente}`, 'info');
    CONFIG_UTILS.debugLog(`Mobile: ${mobile ? 'Sim' : 'Não'}`, 'info');
    CONFIG_UTILS.debugLog(`Navegador: ${browser.name}`, 'info');
    CONFIG_UTILS.debugLog(`API URL: ${CONFIG_UTILS.getApiUrl('googleScript')}`, 'info');
    
    console.log('✅ Sistema inicializado com sucesso!');
});

// ================================================================================
// 🌍 EXPOSIÇÃO GLOBAL
// ================================================================================

// Tornar todas as configurações disponíveis globalmente
window.SYSTELOS_CONFIG = SYSTELOS_CONFIG;
window.VISUAL_CONFIG = VISUAL_CONFIG;
window.IA_CONFIG = IA_CONFIG;
window.ORCAMENTOS_CONFIG = ORCAMENTOS_CONFIG;
window.ESTADO_CONFIG = ESTADO_CONFIG;
window.UI_CONFIG = UI_CONFIG;
window.TECH_CONFIG = TECH_CONFIG;
window.CONFIG_UTILS = CONFIG_UTILS;

// Aliases para facilitar uso
window.getApiUrl = CONFIG_UTILS.getApiUrl;
window.debugLog = CONFIG_UTILS.debugLog;
window.isMobile = CONFIG_UTILS.isMobile;
window.calcularCusto = CONFIG_UTILS.calcularCusto;

// ================================================================================
// 🔄 COMPATIBILIDADE RETROATIVA - ALIAS CVC_CONFIG
// ================================================================================
// IMPORTANTE: Este alias garante compatibilidade com código antigo que usa CVC_CONFIG
// Páginas como embarques.html e orbiuns.html dependem dele
// ================================================================================

window.CVC_CONFIG = {
    // URL da API principal (Google Apps Script)
    API_URL: SYSTELOS_CONFIG.urls.apiGoogleScript,
    
    // Filial padrão
    FILIAL_PADRAO: SYSTELOS_CONFIG.filial,
    
    // Lista de vendedores ativos
    VENDEDORES: SYSTELOS_CONFIG.vendedores,
    
    // Planilhas (CORRIGIDO: ambas apontam para planilha única)
    PLANILHA_EMBARQUES: SYSTELOS_CONFIG.urls.googleSheets.embarques.planilhaId,
    PLANILHA_ORBIUNS: SYSTELOS_CONFIG.urls.googleSheets.orbiuns.planilhaId,
    
    // Referência ao config completo
    _SYSTELOS: SYSTELOS_CONFIG
};

console.log('✅ Alias CVC_CONFIG criado para compatibilidade');
console.log('🔗 API URL:', CVC_CONFIG.API_URL);
console.log('🏢 Filial:', CVC_CONFIG.FILIAL_PADRAO);
console.log('👥 Vendedores:', CVC_CONFIG.VENDEDORES.length);
console.log('📊 Planilha EMBARQUES:', CVC_CONFIG.PLANILHA_EMBARQUES);
console.log('📋 Planilha ORBIUNS:', CVC_CONFIG.PLANILHA_ORBIUNS);

// ================================================================================
// 📝 LOGS FINAIS
// ================================================================================

console.log('========================================');
console.log('📋 Configurações carregadas:');
console.log('  🌐 APIs:', Object.keys(SYSTELOS_CONFIG.urls.api).length);
console.log('  🎨 Cores:', Object.keys(VISUAL_CONFIG.cores).length);
console.log('  🤖 Modelos IA:', Object.keys(IA_CONFIG.modelos).length);
console.log('  📋 Templates:', IA_CONFIG.templates.total);
console.log('  💾 Estado:', Object.keys(ESTADO_CONFIG.keys).length, 'chaves');
console.log('  👥 Vendedores:', SYSTELOS_CONFIG.vendedores.length);
console.log('  🏢 Filial:', SYSTELOS_CONFIG.filial);
console.log('✅ ORBIUNS v9.2: Planilha única configurada!');
console.log('   - Planilha ID:', SYSTELOS_CONFIG.urls.googleSheets.orbiuns.planilhaId);
console.log('   - Aba ORBIUNS:', SYSTELOS_CONFIG.urls.googleSheets.orbiuns.aba);
console.log('✅ Config SYSTELOS TUR v9.2 pronto para uso!');
console.log('========================================');