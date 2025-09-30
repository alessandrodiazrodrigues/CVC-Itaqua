// ================================================================================
// 🏢 CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA - CONFIGURAÇÃO CENTRAL v10.0
// ================================================================================
// 🚨 CORREÇÃO CRÍTICA: Compatibilidade total com vendas-automatizado.html v10.0

const CVC_CONFIG = {
    // ✅ URL PRINCIPAL - ATUALIZADA COM A NOVA API
    API_URL: 'https://script.google.com/macros/s/AKfycbxxvt5eY2L5DpI2yFCyqvHBA_sYkteDPCkxgEyb4QeF597J-CP0WE7hHJWCWlsBGLRCrA/exec',
    
    // 📊 INFORMAÇÕES DO SISTEMA
    VERSION: '10.0',
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
    
    // 👥 VENDEDORES ATIVOS - OBRIGATÓRIO PARA O SISTEMA
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
        VENDAS_AUTOMATIZADO: {
            title: 'Vendas Automatizado',
            subtitle: 'Sistema de vendas com dados em tempo real',
            icon: 'fas fa-robot',
            file: 'vendas-automatizado.html'
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
        IMPORTACAO: {
            title: 'Sistema de Importação',
            subtitle: 'Importação inteligente de dados com IA',
            icon: 'fas fa-upload',
            file: 'importacao.html'
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
    DEBUG_MODE: true, // ✅ ATIVADO PARA DIAGNÓSTICO
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
// 🔧 FUNÇÕES UTILITÁRIAS OBRIGATÓRIAS
// ================================================================================

/**
 * 🌐 Obter URL da API (FUNÇÃO PRINCIPAL)
 */
function getApiUrl() {
    if (!CVC_CONFIG.API_URL) {
        console.error('❌ API_URL não definida no CVC_CONFIG!');
        return null;
    }
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
 * 🔧 Sistema de debug OBRIGATÓRIO
 */
function debugLog(message, level = 'log', data = null) {
    // ✅ SEMPRE EXIBIR LOGS PARA DIAGNÓSTICO
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
 * ✅ Validar configuração - VERSÃO RIGOROSA
 */
function validateConfig() {
    const errors = [];
    
    // Verificação obrigatória da API
    if (!CVC_CONFIG.API_URL) {
        errors.push('API_URL não está definida');
    } else if (!CVC_CONFIG.API_URL.includes('script.google.com')) {
        errors.push('URL da API deve ser do Google Apps Script');
    }
    
    // Verificação obrigatória dos vendedores
    if (!CVC_CONFIG.VENDEDORES || !Array.isArray(CVC_CONFIG.VENDEDORES) || CVC_CONFIG.VENDEDORES.length === 0) {
        errors.push('Lista de VENDEDORES vazia ou inválida');
    }
    
    // Verificação obrigatória dos tipos de serviço
    if (!CVC_CONFIG.TIPOS_SERVICO || !Array.isArray(CVC_CONFIG.TIPOS_SERVICO) || CVC_CONFIG.TIPOS_SERVICO.length === 0) {
        errors.push('Lista TIPOS_SERVICO vazia ou inválida');
    }
    
    // Verificação obrigatória dos departamentos
    if (!CVC_CONFIG.DEPARTAMENTOS || !Array.isArray(CVC_CONFIG.DEPARTAMENTOS) || CVC_CONFIG.DEPARTAMENTOS.length === 0) {
        errors.push('Lista DEPARTAMENTOS vazia ou inválida');
    }
    
    // Verificação do nome do sistema
    if (!CVC_CONFIG.SYSTEM_NAME) {
        errors.push('SYSTEM_NAME não está definido');
    }
    
    // Log detalhado dos resultados
    debugLog('🔍 Iniciando validação da configuração...', 'info');
    debugLog(`📊 API_URL: ${CVC_CONFIG.API_URL ? 'DEFINIDA' : 'INDEFINIDA'}`, CVC_CONFIG.API_URL ? 'success' : 'error');
    debugLog(`👥 VENDEDORES: ${CVC_CONFIG.VENDEDORES?.length || 0} itens`, CVC_CONFIG.VENDEDORES?.length > 0 ? 'success' : 'error');
    debugLog(`🎫 TIPOS_SERVICO: ${CVC_CONFIG.TIPOS_SERVICO?.length || 0} itens`, CVC_CONFIG.TIPOS_SERVICO?.length > 0 ? 'success' : 'error');
    debugLog(`🏢 DEPARTAMENTOS: ${CVC_CONFIG.DEPARTAMENTOS?.length || 0} itens`, CVC_CONFIG.DEPARTAMENTOS?.length > 0 ? 'success' : 'error');
    debugLog(`📋 SYSTEM_NAME: ${CVC_CONFIG.SYSTEM_NAME ? 'DEFINIDO' : 'INDEFINIDO'}`, CVC_CONFIG.SYSTEM_NAME ? 'success' : 'error');
    
    if (errors.length > 0) {
        debugLog('❌ CONFIGURAÇÃO INVÁLIDA!', 'error', errors);
        console.error('❌ Erros na configuração:', errors);
        return { valid: false, errors };
    }
    
    debugLog('✅ Configuração validada com sucesso!', 'success');
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
// 🚀 INICIALIZAÇÃO AUTOMÁTICA E CRÍTICA
// ================================================================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('🚀 Iniciando sistema CVC Portal Itaquá...', 'info');
    
    const validation = validateConfig();
    const config = getConfig();
    
    debugLog(`🏢 ${CVC_CONFIG.SYSTEM_NAME} v${CVC_CONFIG.VERSION}`, 'info');
    debugLog(`🌍 Ambiente: ${config.current_environment}`, 'info');
    debugLog(`📱 Mobile: ${config.is_mobile ? 'Sim' : 'Não'}`, 'info');
    debugLog(`🌐 Navegador: ${config.browser_info.name}`, 'info');
    debugLog(`🔗 API URL: ${CVC_CONFIG.API_URL}`, 'info');
    debugLog(`🏪 Filial: ${CVC_CONFIG.FILIAL_PADRAO} - ${CVC_CONFIG.NOME_FILIAL}`, 'info');
    
    if (!validation.valid) {
        debugLog('❌ FALHA NA CONFIGURAÇÃO!', 'error');
        console.error('❌ Configuração inválida:', validation.errors);
        alert('❌ Erro crítico na configuração do sistema!\n\nVerifique o console para detalhes.');
        return;
    }
    
    debugLog('✅ Sistema configurado corretamente!', 'success');
    
    // Aplicar tema e configurações
    applyTheme();
    updatePageTitle();
    
    setTimeout(() => {
        setActiveNavigation();
    }, 100);
});

// ================================================================================
// 🎨 EXPOSIÇÃO GLOBAL OBRIGATÓRIA
// ================================================================================

// Tornar tudo disponível globalmente
window.CVC_CONFIG = CVC_CONFIG;
window.getApiUrl = getApiUrl;
window.getConfig = getConfig;
window.debugLog = debugLog;
window.validateConfig = validateConfig;
window.updatePageTitle = updatePageTitle;
window.setActiveNavigation = setActiveNavigation;
window.applyTheme = applyTheme;
window.getCurrentPageInfo = getCurrentPageInfo;

// Aliases para compatibilidade com versões antigas
window.obterApiUrl = getApiUrl;
window.validarConfig = validateConfig;
window.atualizarTituloPagina = updatePageTitle;

// ================================================================================
// 📝 LOGS INFORMATIVOS DE INICIALIZAÇÃO
// ================================================================================

console.log('%c🏢 CVC ITAQUÁ - PORTAL DE GESTÃO DA LOJA v10.0', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('%c📊 Config v10.0 - COMPATÍVEL COM VENDAS-AUTOMATIZADO!', 'color: #FFE600; background: #0A00B4; padding: 4px 8px; font-weight: bold;');
console.log('🔧 Para alterar a URL da API, edite apenas este arquivo (config.js)');
console.log('🎯 URL atual:', CVC_CONFIG.API_URL);
console.log('🏪 Filial:', CVC_CONFIG.FILIAL_PADRAO, '-', CVC_CONFIG.NOME_FILIAL);
console.log('📋 Sistema:', CVC_CONFIG.SYSTEM_NAME);
console.log('🎫 TIPOS_SERVICO:', CVC_CONFIG.TIPOS_SERVICO?.length || 0, 'itens');
console.log('🏢 DEPARTAMENTOS:', CVC_CONFIG.DEPARTAMENTOS?.length || 0, 'itens');
console.log('👥 VENDEDORES:', CVC_CONFIG.VENDEDORES?.length || 0, 'itens');
console.log('✅ Todas as funções expostas globalmente para compatibilidade');
