// ================================================================================
// ⚙️ SYSTELOS TUR - CONFIGURAÇÃO CENTRALIZADA v9.0
// ================================================================================
// 🎯 ARQUIVO ÚNICO DE CONFIGURAÇÃO
// Todas as URLs, cores, APIs e configurações em UM SÓ LUGAR
// Se precisar mudar algo, muda APENAS aqui!
// ================================================================================

console.log('⚙️ Carregando SYSTELOS TUR - Configuração Centralizada v9.0...');

// ================================================================================
// 🏢 INFORMAÇÕES DO SISTEMA
// ================================================================================

const SYSTELOS_CONFIG = {
    // Identidade
    nome: 'SYSTELOS TUR',
    nomeCompleto: 'SYSTELOS TUR - Sistemas com Propósito',
    simbolo: '[S]',
    tagline: 'Sistemas com propósito',
    versao: '9.0',
    ambiente: 'production', // 'development' ou 'production'
    
    // URLs e Endpoints
    urls: {
        // Frontend (Vercel)
        frontend: window.location.origin, // Pega automaticamente
        
        // APIs do Backend (Vercel Serverless Functions)
        api: {
            orcamentos: '/api/ai-google',         // API principal de orçamentos com IA
            orbiuns: '/api/orbiuns',              // API de orbiuns/processos
            embarques: '/api/embarques',          // API de embarques (se existir)
            custos: '/api/custos',                // API de custos (se existir)
            openaiAssistant: '/api/openai-assistant', // OpenAI Assistant
            debug: '/api/debug-orbiuns'           // Debug API
        },
        
        // Google Sheets (se precisar acesso direto)
        googleSheets: {
            planilhaId: '1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc',
            urlBase: 'https://docs.google.com/spreadsheets/d/1dF8dfIh8EyvX-5_sISpVc4dMsLNOqpwovQsbsxl9ywc'
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
        estadoOrcamento: 7,      // 7 dias
        custos: 90,              // 90 dias
        preferencias: 365        // 1 ano
    },
    
    // Funções auxiliares
    salvar: function(chave, valor) {
        try {
            const timestamp = new Date().toISOString();
            const dados = { valor, timestamp };
            localStorage.setItem(chave, JSON.stringify(dados));
            console.log(`💾 Estado salvo: ${chave}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
            return false;
        }
    },
    
    carregar: function(chave) {
        try {
            const item = localStorage.getItem(chave);
            if (!item) return null;
            
            const dados = JSON.parse(item);
            return dados.valor;
        } catch (error) {
            console.error('❌ Erro ao carregar estado:', error);
            return null;
        }
    },
    
    limpar: function(chave) {
        try {
            localStorage.removeItem(chave);
            console.log(`🗑️ Estado removido: ${chave}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao limpar estado:', error);
            return false;
        }
    }
};

// ================================================================================
// 📱 CONFIGURAÇÕES DE INTERFACE
// ================================================================================

const UI_CONFIG = {
    // Animações
    animacoes: {
        duracao: 300,           // ms
        easing: 'ease-in-out'
    },
    
    // Toasts/Notificações
    toast: {
        duracao: 4000,          // ms
        posicao: 'top-right'
    },
    
    // Loading
    loading: {
        delay: 1000,            // ms antes de mostrar loading
        minDuracao: 500         // duração mínima do loading
    },
    
    // Auto-refresh
    autoRefresh: {
        habilitado: false,
        intervalo: 300000       // 5 minutos
    },
    
    // Responsividade
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
    }
};

// ================================================================================
// 🔧 CONFIGURAÇÕES TÉCNICAS
// ================================================================================

const TECH_CONFIG = {
    // Debug
    debug: {
        habilitado: true,           // ✅ Sempre habilitado
        nivel: 'completo',          // 'basico', 'completo', 'detalhado'
        logCustos: true,
        logTokens: true,
        logAPI: true
    },
    
    // Cache
    cache: {
        habilitado: true,
        timeout: 300000             // 5 minutos
    },
    
    // Timeouts
    timeouts: {
        api: 30000,                 // 30 segundos
        upload: 60000,              // 60 segundos
        processamento: 35000        // 35 segundos
    },
    
    // Retry
    retry: {
        maxTentativas: 3,
        delayInicial: 1000,         // ms
        multiplicador: 2            // delay dobra a cada tentativa
    }
};

// ================================================================================
// 🛠️ FUNÇÕES AUXILIARES
// ================================================================================

const CONFIG_UTILS = {
    /**
     * Obtém URL completa da API
     */
    getApiUrl: function(apiName = 'orcamentos') {
        const apiPath = SYSTELOS_CONFIG.urls.api[apiName];
        if (!apiPath) {
            console.error(`❌ API "${apiName}" não encontrada`);
            return null;
        }
        
        // Se for caminho relativo, adiciona a base
        if (apiPath.startsWith('/')) {
            return `${SYSTELOS_CONFIG.urls.frontend}${apiPath}`;
        }
        
        return apiPath;
    },
    
    /**
     * Detecta ambiente
     */
    detectarAmbiente: function() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('vercel')) {
            return 'vercel';
        } else if (hostname.includes('github.io')) {
            return 'github';
        }
        
        return 'production';
    },
    
    /**
     * Verifica se é mobile
     */
    isMobile: function() {
        return window.innerWidth <= UI_CONFIG.breakpoints.mobile || 
               /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Info do navegador
     */
    getBrowserInfo: function() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        return {
            name: browser,
            userAgent: ua,
            language: navigator.language,
            platform: navigator.platform
        };
    },
    
    /**
     * Aplicar tema SYSTELOS
     */
    aplicarTema: function() {
        const root = document.documentElement;
        const cores = VISUAL_CONFIG.cores;
        
        // Aplicar cores como CSS variables
        root.style.setProperty('--systelos-azul', cores.azulPrincipal);
        root.style.setProperty('--systelos-amarelo', cores.amarelo);
        root.style.setProperty('--systelos-verde', cores.verdeAgua);
        root.style.setProperty('--systelos-branco', cores.branco);
        root.style.setProperty('--systelos-dark', cores.darkMode);
        
        // Aplicar fontes
        root.style.setProperty('--font-titulos', VISUAL_CONFIG.fontes.titulos);
        root.style.setProperty('--font-textos', VISUAL_CONFIG.fontes.textos);
        
        console.log('🎨 Tema SYSTELOS aplicado');
    },
    
    /**
     * Validar configuração
     */
    validar: function() {
        const erros = [];
        
        // Verificar URLs
        if (!SYSTELOS_CONFIG.urls.api.orcamentos) {
            erros.push('URL da API de orçamentos não definida');
        }
        
        // Verificar cores
        if (!VISUAL_CONFIG.cores.azulPrincipal) {
            erros.push('Cor principal não definida');
        }
        
        // Verificar IA
        if (!IA_CONFIG.modelos.padrao) {
            erros.push('Modelo de IA padrão não definido');
        }
        
        if (erros.length > 0) {
            console.error('❌ Erros na configuração:', erros);
            return { valido: false, erros };
        }
        
        console.log('✅ Configuração validada');
        return { valido: true, erros: [] };
    },
    
    /**
     * Debug log melhorado
     */
    debugLog: function(mensagem, tipo = 'info', dados = null) {
        if (!TECH_CONFIG.debug.habilitado) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[SYSTELOS ${timestamp}]`;
        
        const estilos = {
            info: 'color: #14B8A6; font-weight: bold;',
            success: 'color: #28a745; font-weight: bold;',
            warning: 'color: #FFB800; font-weight: bold;',
            error: 'color: #dc3545; font-weight: bold;'
        };
        
        if (dados) {
            console.groupCollapsed(`%c${prefix} ${mensagem}`, estilos[tipo] || '');
            console.log('Dados:', dados);
            console.groupEnd();
        } else {
            const emoji = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌'
            };
            
            console.log(`%c${prefix} ${emoji[tipo] || ''} ${mensagem}`, estilos[tipo] || '');
        }
    },
    
    /**
     * Calcular custo de uso da IA
     */
    calcularCusto: function(modelo, tokensInput, tokensOutput) {
        const config = IA_CONFIG.custos[modelo];
        if (!config) return null;
        
        const custoInput = (tokensInput / 1000) * config.input;
        const custoOutput = (tokensOutput / 1000) * config.output;
        const custoTotalUSD = custoInput + custoOutput;
        const custoTotalBRL = custoTotalUSD * IA_CONFIG.moeda.taxaUSDtoBRL;
        
        return {
            modelo: config.nome,
            tokensInput,
            tokensOutput,
            custoUSD: custoTotalUSD.toFixed(6),
            custoBRL: custoTotalBRL.toFixed(6),
            formatado: `R$ ${custoTotalBRL.toFixed(6)}`
        };
    }
};

// ================================================================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ================================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c🌟 SYSTELOS TUR v9.0', 'color: #0F1B3D; font-size: 16px; font-weight: bold; background: #FFB800; padding: 4px 8px;');
    console.log('%c[S] Sistemas com Propósito', 'color: #14B8A6; font-weight: bold;');
    
    // Validar configuração
    const validacao = CONFIG_UTILS.validar();
    if (!validacao.valido) {
        console.error('❌ Configuração inválida:', validacao.erros);
        alert('Erro na configuração do sistema! Verifique o console.');
        return;
    }
    
    // Aplicar tema
    CONFIG_UTILS.aplicarTema();
    
    // Logs informativos
    const ambiente = CONFIG_UTILS.detectarAmbiente();
    const mobile = CONFIG_UTILS.isMobile();
    const browser = CONFIG_UTILS.getBrowserInfo();
    
    CONFIG_UTILS.debugLog(`Ambiente: ${ambiente}`, 'info');
    CONFIG_UTILS.debugLog(`Mobile: ${mobile ? 'Sim' : 'Não'}`, 'info');
    CONFIG_UTILS.debugLog(`Navegador: ${browser.name}`, 'info');
    CONFIG_UTILS.debugLog(`API URL: ${CONFIG_UTILS.getApiUrl('orcamentos')}`, 'info');
    
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
// 📝 LOGS FINAIS
// ================================================================================

console.log('📋 Configurações carregadas:');
console.log('  🌐 APIs:', Object.keys(SYSTELOS_CONFIG.urls.api).length);
console.log('  🎨 Cores:', Object.keys(VISUAL_CONFIG.cores).length);
console.log('  🤖 Modelos IA:', Object.keys(IA_CONFIG.modelos).length);
console.log('  📋 Templates:', IA_CONFIG.templates.total);
console.log('  💾 Estado:', Object.keys(ESTADO_CONFIG.keys).length, 'chaves');
console.log('✅ Config SYSTELOS TUR v9.0 pronto para uso!');