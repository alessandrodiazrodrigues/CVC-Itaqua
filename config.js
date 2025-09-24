// ================================================================================
// CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA - CONFIGURAÇÃO CENTRAL v8.05
// ================================================================================
// ⚡ CORREÇÃO: Adicionados TIPOS_SERVICO e outras listas em falta

const CVC_CONFIG = {
    // ✅ URL PRINCIPAL - ALTERAR APENAS AQUI quando reimplantar
    API_URL: 'https://script.google.com/macros/s/AKfycbx8vTz17267nRKCF7tp9Udq0tlvQxX5dTLur-dcGCQ7y_QGTi3QeVMg5xjNpVUCYYUYDA/exec',
    
    // 📊 INFORMAÇÕES DO SISTEMA
    VERSION: '8.05',
    SYSTEM_NAME: 'CVC Itaquá - Portal de Gestão da Loja',
    SYSTEM_FULL_NAME: 'CVC Itaquá - Portal de Gestão da Loja - Sistema de Gestão Integrado',
    SYSTEM_SHORT_NAME: 'Portal Itaquá',
    LAST_UPDATE: '2024-12-10',
    ENVIRONMENT: 'production',
    
    // 🏪 CONFIGURAÇÕES DA LOJA (FILIAL ÚNICA)
    FILIAL_PADRAO: '6220',
    NOME_FILIAL: 'Itaquaquecetuba',
    FILIAL_NOME_COMPLETO: 'CVC Itaquaquecetuba',
    FILIAL_UNICA: true,
    
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
    
    // 🎫 TIPOS DE SERVIÇO - CORREÇÃO DO ERRO "Cannot read properties of undefined"
    TIPOS_SERVICO: [
        'Aéreo',
        'Aéreo Facial',
        'A+H',
        'A+H+S',
        'Terrestre',
        'Marítimo',
        'Seguro',
        'Câmbio',
        'Chip',
        'Transfer',
        'Passeio',
        'Ingresso',
        'Outros'
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
    
    // 🏢 DEPARTAMENTOS - Para orbiuns.html
    DEPARTAMENTOS: [
        'Vendas',
        'Pós-Vendas',
        'Financeiro',
        'Operacional',
        'Marketing',
        'Recursos Humanos',
        'Tecnologia',
        'Gerência'
    ],
    
    // 📋 STATUS ORBIUM - Para controle de status
    STATUS_ORBIUM: [
        'Pendente',
        'Em Andamento',
        'Aguardando Aprovação',
        'Aprovado',
        'Rejeitado',
        'Concluído',
        'Cancelado'
    ],
    
    // 🔄 PRIORIDADES
    PRIORIDADES: [
        'Baixa',
        'Média',
        'Alta',
        'Urgente',
        'Crítica'
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
            PRIMARY_YELLOW: '#FFE600',
            PRIMARY_BLUE: '#0A00B4',
            PRIMARY_WHITE: '#FFFFFF',
            SECONDARY_GREEN: '#00D4AA',
            DARK_BLUE: '#1B365D',
            LIGHT_BLUE: '#E8F0FE',
            LIGHT_YELLOW: '#FFF9CC',
            GRAY: '#6C757D',
            LIGHT_GRAY: '#f5f6fa'
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
    CACHE_TIMEOUT: 300000,
    REQUEST_TIMEOUT: 30000,
    
    // 📱 CONFIGURAÇÕES DE INTERFACE
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 4000,
        LOADING_DELAY: 1000,
        AUTO_REFRESH: 300000
    }
};

// ================================================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ================================================================================

/**
 * 🌐 Obter URL da API (compatibilidade)
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
 * 🔍 Detectar ambiente
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
 * 📱 Detectar móvel
 */
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 🌐 Info do navegador
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
 * 🎨 Aplicar tema
 */
function applyTheme() {
    const root = document.documentElement;
    const colors = CVC_CONFIG.VISUAL.COLORS;
    
    root.style.setProperty('--cvc-amarelo', colors.PRIMARY_YELLOW);
    root.style.setProperty('--cvc-azul', colors.PRIMARY_BLUE);
    root.style.setProperty('--cvc-branco', colors.PRIMARY_WHITE);
    root.style.setProperty('--cvc-verde', colors.SECONDARY_GREEN);
    
    debugLog('🎨 Tema CVC aplicado dinamicamente', 'info');
}

/**
 * 📄 Info da página atual
 */
function getCurrentPageInfo() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    
    for (const [key, page] of Object.entries(CVC_CONFIG.PAGES)) {
        if (page.file === currentFile) {
            return {
                key: key,
                ...page,
                isActive: true
            };
        }
    }
    
    return {
        key: 'DASHBOARD',
        ...CVC_CONFIG.PAGES.DASHBOARD,
        isActive: true
    };
}

/**
 * 🔧 Sistema de debug
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
 * ✅ Validar configuração - CORRIGIDA
 */
function validateConfig() {
    const errors = [];
    
    if (!CVC_CONFIG.API_URL || !CVC_CONFIG.API_URL.includes('script.google.com')) {
        errors.push('URL da API inválida ou não configurada');
    }
    
    if (!CVC_CONFIG.VENDEDORES || CVC_CONFIG.VENDEDORES.length === 0) {
        errors.push('Lista de vendedores vazia');
    }
    
    // CORREÇÃO: Verificar se TIPOS_SERVICO existe
    if (!CVC_CONFIG.TIPOS_SERVICO || CVC_CONFIG.TIPOS_SERVICO.length === 0) {
        errors.push('Lista TIPOS_SERVICO não encontrada - isso causará erro no vendas.html');
    }
    
    // CORREÇÃO: Verificar se DEPARTAMENTOS existe
    if (!CVC_CONFIG.DEPARTAMENTOS || CVC_CONFIG.DEPARTAMENTOS.length === 0) {
        errors.push('Lista DEPARTAMENTOS não encontrada - isso causará erro no orbiuns.html');
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
 * 🔄 Atualizar título
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
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
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

document.addEventListener('DOMContentLoaded', function() {
    const validation = validateConfig();
    const config = getConfig();
    
    debugLog(`🚀 ${CVC_CONFIG.SYSTEM_NAME} v${CVC_CONFIG.VERSION} carregado`, 'success');
    debugLog(`🌍 Ambiente detectado: ${config.current_environment}`, 'info');
    debugLog(`📱 Dispositivo móvel: ${config.is_mobile ? 'Sim' : 'Não'}`, 'info');
    debugLog(`🌐 Navegador: ${config.browser_info.name}`, 'info');
    debugLog(`🔗 API URL: ${CVC_CONFIG.API_URL}`, 'info');
    debugLog(`🏪 Filial: ${CVC_CONFIG.FILIAL_PADRAO} - ${CVC_CONFIG.NOME_FILIAL}`, 'info');
    
    // CORREÇÃO: Verificar listas essenciais
    debugLog(`🎫 TIPOS_SERVICO: ${CVC_CONFIG.TIPOS_SERVICO?.length || 0} itens`, 'info');
    debugLog(`🏢 DEPARTAMENTOS: ${CVC_CONFIG.DEPARTAMENTOS?.length || 0} itens`, 'info');
    debugLog(`👥 VENDEDORES: ${CVC_CONFIG.VENDEDORES?.length || 0} itens`, 'info');
    
    if (!validation.valid) {
        console.error('❌ Configuração inválida:', validation.errors);
        alert('Erro na configuração do sistema. Verifique o console.');
    } else {
        applyTheme();
        updatePageTitle();
        
        setTimeout(() => {
            setActiveNavigation();
        }, 100);
    }
});

// ================================================================================
// 🎨 COMPATIBILIDADE
// ================================================================================

window.CVC_CONFIG = CVC_CONFIG;
window.getApiUrl = getApiUrl;
window.getConfig = getConfig;
window.debugLog = debugLog;

// Aliases para compatibilidade
window.obterApiUrl = getApiUrl;
window.validarConfig = validateConfig;
window.atualizarTituloPagina = updatePageTitle;

// ================================================================================
// 📝 LOGS INFORMATIVOS
// ================================================================================

console.log('%c🏢 CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('%c📊 Config v8.05 carregado com TIPOS_SERVICO!', 'color: #FFE600; background: #0A00B4; padding: 4px 8px; font-weight: bold;');
console.log('🔧 Para alterar a URL da API, edite apenas este arquivo (config.js)');
console.log('🎯 URL atual:', CVC_CONFIG.API_URL);
console.log('🏪 Filial:', CVC_CONFIG.FILIAL_PADRAO, '-', CVC_CONFIG.NOME_FILIAL);
console.log('📋 Sistema:', CVC_CONFIG.SYSTEM_NAME);
console.log('🎫 TIPOS_SERVICO adicionados:', CVC_CONFIG.TIPOS_SERVICO?.length || 0, 'itens');
console.log('🏢 DEPARTAMENTOS adicionados:', CVC_CONFIG.DEPARTAMENTOS?.length || 0, 'itens');
