// ================================================================================
// CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA - CONFIGURAÇÃO CENTRAL v8.03
// ================================================================================
// ⚡ ÚNICO ARQUIVO PARA ALTERAR QUANDO REIMPLANTAR GOOGLE APPS SCRIPT
// 🎯 Todos os HTMLs usam esta configuração automaticamente

const CVC_CONFIG = {
    // ✅ URL PRINCIPAL - ALTERAR APENAS AQUI quando reimplantar
    API_URL: 'https://script.google.com/macros/s/AKfycbwSpsWw4eskLgAGPCWQ7X0q1emDfSyzWbS6nAT-7nHZHB63Hd4Q1IKWWeTsEQUnwVi3zQ/exec',
    
    // 📊 INFORMAÇÕES DO SISTEMA - NOMENCLATURA ATUALIZADA
    VERSION: '8.03',
    SYSTEM_NAME: 'CVC Itaquá - Portal de Gestão da Loja',
    SYSTEM_FULL_NAME: 'CVC Itaquá - Portal de Gestão da Loja - Sistema de Gestão Integrado',
    SYSTEM_SHORT_NAME: 'Portal Itaquá',
    LAST_UPDATE: '2024-12-10',
    ENVIRONMENT: 'production',
    
    // 🏪 CONFIGURAÇÕES DA LOJA (FILIAL ÚNICA)
    FILIAL_PADRAO: '6220',
    NOME_FILIAL: 'Itaquaquecetuba',
    FILIAL_NOME_COMPLETO: 'CVC Itaquaquecetuba',
    FILIAL_UNICA: true, // Indica que só há uma filial ativa
    
    // 👥 VENDEDORES ATIVOS
    VENDEDORES: [
        'Alessandro',
        'Ana Paula', 
        'Adriana',
        'Adrielly',
        'Bia',
        'Conceição',
        'Jhully'
    ],
    
    // ✈️ COMPANHIAS AÉREAS
    COMPANHIAS_AEREAS: [
        'LATAM', 'AZUL', 'GOL', 'VOEPASS',
        '──────────────',
        'CRUZEIRO MSC', 'CRUZEIRO COSTA', 'CRUZEIRO TEMÁTICO', 'CRUZEIRO NCL', 
        'CRUZEIRO DISNEY', 'CRUZEIROS OUTROS',
        '──────────────',
        'Aerolíneas Argentinas', 'Aeroméxico', 'Air Canada', 'Air China', 
        'Air Europa', 'Air France', 'Alitalia', 'American Airlines', 
        'British Airways', 'Copa Airlines', 'Delta', 'Emirates', 
        'Iberia', 'KLM', 'Lufthansa', 'Swiss', 'TAP', 'Turkish Airlines', 
        'United Airlines', 'OUTRAS'
    ],
    
    // 📄 PÁGINAS DO SISTEMA
    PAGES: {
        DASHBOARD: {
            title: 'Dashboard Principal',
            subtitle: 'Visão geral das operações - CVC Itaquaquecetuba',
            icon: 'fas fa-tachometer-alt',
            file: 'index.html'
        },
        ORCAMENTOS: {
            title: 'Padronizador de Orçamentos',
            subtitle: 'Geração inteligente de propostas comerciais',
            icon: 'fas fa-calculator',
            file: 'orcamentos.html'
        },
        VENDAS: {
            title: 'Informe de Vendas',
            subtitle: 'Cadastro e acompanhamento de vendas realizadas',
            icon: 'fas fa-chart-line',
            file: 'vendas.html'
        },
        EMBARQUES: {
            title: 'Controle de Embarques',
            subtitle: 'Gestão de check-ins e conferências de viagem',
            icon: 'fas fa-plane-departure',
            file: 'embarques.html'
        },
        ORBIUNS: {
            title: 'Controle de Orbiuns',
            subtitle: 'Gestão e acompanhamento de processos internos',
            icon: 'fas fa-clipboard-list',
            file: 'orbiuns.html'
        },
        ADMIN: {
            title: 'Área do Gestor',
            subtitle: 'Gestão de usuários e configurações do sistema',
            icon: 'fas fa-crown',
            file: 'admin.html'
        }
    },
    
    // 🎨 CONFIGURAÇÕES VISUAIS (CONFORME MANUAL DA MARCA CVC)
    VISUAL: {
        COLORS: {
            PRIMARY_YELLOW: '#FFE600',    // PANTONE 102 C
            PRIMARY_BLUE: '#0A00B4',      // PANTONE 2736 C  
            PRIMARY_WHITE: '#FFFFFF',     // Branco oficial
            SECONDARY_GREEN: '#00D4AA',   // Degradê
            DARK_BLUE: '#1B365D',
            LIGHT_BLUE: '#E8F0FE',
            LIGHT_YELLOW: '#FFF9CC',
            GRAY: '#6C757D',
            LIGHT_GRAY: '#F8F9FA'
        },
        FONTS: {
            PRIMARY: 'Nunito, sans-serif',
            WEIGHTS: {
                LIGHT: 300,
                REGULAR: 400,
                SEMIBOLD: 600,
                BOLD: 700,
                EXTRABOLD: 800,
                BLACK: 900
            }
        }
    },
    
    // 🔧 CONFIGURAÇÕES TÉCNICAS
    DEBUG_MODE: false,
    CACHE_TIMEOUT: 300000, // 5 minutos
    REQUEST_TIMEOUT: 30000, // 30 segundos
    
    // 📱 CONFIGURAÇÕES DE INTERFACE
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 4000,
        LOADING_DELAY: 1000,
        AUTO_REFRESH: 300000 // 5 minutos
    }
};

// ================================================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ================================================================================

/**
 * 🌐 Obter URL da API (compatibilidade com versões antigas)
 */
function getApiUrl() {
    return CVC_CONFIG.API_URL;
}

/**
 * 📊 Obter configurações completas
 */
function getConfig() {
    return {
        ...CVC_CONFIG,
        current_environment: detectEnvironment(),
        is_mobile: isMobile(),
        browser_info: getBrowserInfo()
    };
}

/**
 * 🔍 Detectar ambiente de execução
 */
function detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('github.io')) {
        return 'github_pages';
    } else if (hostname.includes('netlify') || hostname.includes('vercel')) {
        return 'deploy_preview';
    }
    
    return 'production';
}

/**
 * 📱 Detectar dispositivo móvel
 */
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 🌐 Obter informações do navegador
 */
function getBrowserInfo() {
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
}

/**
 * 🎨 Aplicar tema CVC dinâmico
 */
function applyTheme() {
    const root = document.documentElement;
    const colors = CVC_CONFIG.VISUAL.COLORS;
    
    // Aplicar variáveis CSS
    root.style.setProperty('--cvc-amarelo', colors.PRIMARY_YELLOW);
    root.style.setProperty('--cvc-azul', colors.PRIMARY_BLUE);
    root.style.setProperty('--cvc-branco', colors.PRIMARY_WHITE);
    root.style.setProperty('--cvc-verde', colors.SECONDARY_GREEN);
    
    debugLog('🎨 Tema CVC aplicado dinamicamente', 'info');
}

/**
 * 📄 Obter informações da página atual
 */
function getCurrentPageInfo() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    
    // Encontrar página correspondente
    for (const [key, page] of Object.entries(CVC_CONFIG.PAGES)) {
        if (page.file === currentFile) {
            return {
                key: key,
                ...page,
                isActive: true
            };
        }
    }
    
    // Retorno padrão para Dashboard
    return {
        key: 'DASHBOARD',
        ...CVC_CONFIG.PAGES.DASHBOARD,
        isActive: true
    };
}

/**
 * 🔧 Sistema de debug melhorado
 */
function debugLog(message, level = 'log', data = null) {
    if (!CVC_CONFIG.DEBUG_MODE && level !== 'error') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `🏢 [CVC-${timestamp}]`;
    
    const styles = {
        log: 'color: #0A00B4; font-weight: bold;',
        info: 'color: #17a2b8; font-weight: bold;',
        warn: 'color: #ffc107; font-weight: bold;',
        error: 'color: #dc3545; font-weight: bold;',
        success: 'color: #28a745; font-weight: bold;'
    };
    
    if (data) {
        console.groupCollapsed(`%c${prefix} ${message}`, styles[level] || '');
        console.log('Dados:', data);
        console.groupEnd();
    } else {
        switch(level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️ ${message}`);
                break;
            case 'info':
                console.info(`${prefix} ℹ️ ${message}`);
                break;
            case 'success':
                console.log(`%c${prefix} ✅ ${message}`, styles.success);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }
}

/**
 * ✅ Verificar se a configuração está válida
 */
function validateConfig() {
    const errors = [];
    
    if (!CVC_CONFIG.API_URL || !CVC_CONFIG.API_URL.includes('script.google.com')) {
        errors.push('URL da API inválida ou não configurada');
    }
    
    if (!CVC_CONFIG.VENDEDORES || CVC_CONFIG.VENDEDORES.length === 0) {
        errors.push('Lista de vendedores vazia');
    }
    
    if (!CVC_CONFIG.SYSTEM_NAME) {
        errors.push('Nome do sistema não definido');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erros na configuração:', errors);
        return { valid: false, errors };
    }
    
    debugLog('✅ Configuração validada com sucesso', 'success');
    return { valid: true, errors: [] };
}

/**
 * 🔄 Atualizar título da página dinamicamente
 */
function updatePageTitle(customTitle = null) {
    const pageInfo = getCurrentPageInfo();
    const baseTitle = CVC_CONFIG.SYSTEM_NAME;
    
    if (customTitle) {
        document.title = `${baseTitle} - ${customTitle}`;
    } else {
        document.title = `${baseTitle} - ${pageInfo.title}`;
    }
    
    debugLog(`📄 Título atualizado: ${document.title}`, 'info');
}

/**
 * 🎯 Marcar navegação ativa
 */
function setActiveNavigation() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    
    // Remover active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar active no link correto
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentFile || (currentFile === 'index.html' && href === '#')) {
            link.classList.add('active');
        }
    });
    
    debugLog(`🎯 Navegação ativa definida para: ${currentFile}`, 'info');
}

// ================================================================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ================================================================================

// Validar configuração quando o arquivo carrega
document.addEventListener('DOMContentLoaded', function() {
    const validation = validateConfig();
    const config = getConfig();
    
    debugLog(`🚀 ${CVC_CONFIG.SYSTEM_NAME} v${CVC_CONFIG.VERSION} carregado`, 'success');
    debugLog(`🌍 Ambiente detectado: ${config.current_environment}`, 'info');
    debugLog(`📱 Dispositivo móvel: ${config.is_mobile ? 'Sim' : 'Não'}`, 'info');
    debugLog(`🌐 Navegador: ${config.browser_info.name}`, 'info');
    debugLog(`🔗 API URL: ${CVC_CONFIG.API_URL}`, 'info');
    debugLog(`🏪 Filial: ${CVC_CONFIG.FILIAL_PADRAO} - ${CVC_CONFIG.NOME_FILIAL}`, 'info');
    
    if (!validation.valid) {
        console.error('❌ Configuração inválida:', validation.errors);
        alert('Erro na configuração do sistema. Verifique o console.');
    } else {
        // Aplicar configurações se tudo estiver OK
        applyTheme();
        updatePageTitle();
        
        // Aguardar DOM estar pronto para navegação
        setTimeout(() => {
            setActiveNavigation();
        }, 100);
    }
});

// ================================================================================
// 🎨 CONFIGURAÇÕES DE TEMA PARA COMPATIBILIDADE
// ================================================================================

// Variáveis globais para compatibilidade com código existente
window.CVC_CONFIG = CVC_CONFIG;
window.getApiUrl = getApiUrl;
window.getConfig = getConfig;
window.debugLog = debugLog;

// ================================================================================
// 📝 LOGS INFORMATIVOS
// ================================================================================

console.log('%c🏢 CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('%c📊 Config v8.03 carregado com sucesso!', 'color: #FFE600; background: #0A00B4; padding: 4px 8px; font-weight: bold;');
console.log('🔧 Para alterar a URL da API, edite apenas este arquivo (config.js)');
console.log('🎯 URL atual:', CVC_CONFIG.API_URL);
console.log('🏪 Filial:', CVC_CONFIG.FILIAL_PADRAO, '-', CVC_CONFIG.NOME_FILIAL);
console.log('📋 Sistema:', CVC_CONFIG.SYSTEM_NAME);

// ================================================================================
// 🔄 FUNÇÕES DE COMPATIBILIDADE (MANTER PARA NÃO QUEBRAR CÓDIGO EXISTENTE)
// ================================================================================

// Alias para funções antigas (se existirem no código atual)
window.obterApiUrl = getApiUrl;
window.validarConfig = validateConfig;
window.atualizarTituloPagina = updatePageTitle;
