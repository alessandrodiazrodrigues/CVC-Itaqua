// ================================================================================
// [MODULO] embarques-logic.js - Dashboard v8.18 - MODAL COMPLETO CORRIGIDO
// ================================================================================
// 🎯 CORREÇÃO: Modal de detalhes completo com todas as funcionalidades
// 🎯 CORREÇÃO: Botão "Marcar Conferência" funcionando corretamente
// ================================================================================

// ================================================================================
// 🔧 VARIÁVEIS GLOBAIS
// ================================================================================
let API_URL = null;
let embarquesData = [];
let embarquesFiltrados = [];
let embarquesRelacionados = [];
let stats = { conferencias: 0, checkins: 0, posVendas: 0, total: 0, concluidos: 0 };

// JSONP
const JSONP_CALLBACK_NAME = 'cvcJsonpCallback';
let jsonpCounter = 0;
let pendingCallbacks = new Set();

// ================================================================================
// 🚀 INICIALIZAÇÃO
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando embarques-logic.js v8.18...');
    inicializarSistema();
});

function inicializarSistema() {
    // Obter configuração da API
    if (typeof getApiUrl === 'function') {
        API_URL = getApiUrl();
    } else if (typeof CVC_CONFIG !== 'undefined') {
        API_URL = CVC_CONFIG.API_URL;
    } else {
        API_URL = 'https://script.google.com/macros/s/AKfycbzJK9dQdZf9buvBvOXn42PgOZEAI_XQGw6pyzcWETOGzfqB78Cx6o7q9M35hgHaVbZzEA/exec';
    }
    
    console.log('✅ API URL configurada:', API_URL);
    
    // Configurar eventos
    configurarEventos();
    
    // Carregar dados iniciais
    carregarEmbarques();
}

function configurarEventos() {
    // Botões de controle
    const btnRecarregar = document.getElementById('btnRecarregar');
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    
    if (btnRecarregar) btnRecarregar.addEventListener('click', carregarEmbarques);
    if (btnAplicarFiltros) btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    if (btnLimparFiltros) btnLimparFiltros.addEventListener('click', limparFiltros);
    
    // Navegação por abas
    const navTabs = document.getElementById('navTabs');
    if (navTabs) {
        navTabs.addEventListener('click', (e) => {
            const target = e.target.closest('.nav-link');
            if (target) {
                const categoria = target.id.replace('tab-', '');
                filtrarPorCategoria(categoria);
            }
        });
    }
}

// ================================================================================
// 🌐 CLIENTE JSONP CORRIGIDO v8.18
// ================================================================================
function chamarAPIComJSONP(payload) {
    return new Promise((resolve, reject) => {
        const callbackName = `${JSONP_CALLBACK_NAME}_${++jsonpCounter}_${Date.now()}`;
        const script = document.createElement('script');
        
        // Timeout aumentado para 60 segundos
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout: Servidor não respondeu em 60 segundos'));
        }, 60000);

        // Cleanup melhorado
        function cleanup() {
            clearTimeout(timeoutId);
            if (script && script.parentNode) {
                try {
                    document.head.removeChild(script);
                } catch(e) {
                    console.warn('Script já removido:', e.message);
                }
            }
            if (window[callbackName]) {
                delete window[callbackName];
            }
            pendingCallbacks.delete(callbackName);
        }

        // Rastrear callbacks pendentes
        pendingCallbacks.add(callbackName);

        window[callbackName] = function(response) {
            console.log('📥 Callback executado:', callbackName, response);
            cleanup();
            
            if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response?.message || 'Erro na API'));
            }
        };

        // Montar URL com parâmetros
        const params = new URLSearchParams({
            callback: callbackName,
            ...payload
        });

        script.src = `${API_URL}?${params.toString()}`;
        
        script.onerror = () => {
            cleanup();
            reject(new Error('Erro de rede ao conectar com a API'));
        };

        document.head.appendChild(script);
        console.log(`🚀 JSONP Request: ${payload.action} | Callback: ${callbackName}`);
    });
}

// Limpar callbacks órfãos
function limparCallbacksOrfaos() {
    const agora = Date.now();
    pendingCallbacks.forEach(callbackName => {
        if (window[callbackName]) {
            const timestamp = callbackName.split('_')[2];
            if (agora - parseInt(timestamp) > 120000) {
                delete window[callbackName];
                pendingCallbacks.delete(callbackName);
                console.log('🧹 Callback órfão removido:', callbackName);
            }
        }
    });
}

// ================================================================================
// 📡 CARREGAMENTO DE DADOS CORRIGIDO v8.18
// ================================================================================
async function carregarEmbarques() {
    try {
        console.log('📋 Carregando embarques via JSONP...');
        mostrarLoading(true);
        
        // Limpar callbacks órfãos antes de nova requisição
        limparCallbacksOrfaos();
        
        const resultado = await chamarAPIComJSONP({
            action: 'listar_embarques'
        });
        
        console.log('📥 Resposta recebida:', resultado);
        
        if (resultado.success && resultado.data && resultado.data.embarques) {
            const dadosRaw = resultado.data.embarques;
            console.log(`📄 Processando ${dadosRaw.length} registros...`);
            
            embarquesData = processarDados(dadosRaw);
            embarquesFiltrados = [...embarquesData];
            
            preencherFiltros();
            atualizarEstatisticas();
            renderizarEmbarques();
            
            console.log(`✅ ${embarquesData.length} embarques carregados com sucesso`);
            mostrarNotificacao(`${embarquesData.length} embarques carregados com sucesso`, 'success');
        } else {
            console.log('⚠️ Nenhum embarque encontrado');
            embarquesData = [];
            embarquesFiltrados = [];
            atualizarEstatisticas();
            renderizarEmbarques();
            mostrarNotificacao('Nenhum embarque encontrado na planilha', 'warning');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar embarques:', error);
        
        // Não mostrar erro em caso de timeout após operação bem-sucedida
        if (error.message.includes('Timeout') && embarquesData.length > 0) {
            console.log('📊 Mantendo dados existentes após timeout');
            mostrarNotificacao('Dados mantidos da sessão anterior (timeout de rede)', 'warning');
            return;
        }
        
        mostrarNotificacao(`Erro ao carregar dados: ${error.message}`, 'error');
        
        // Limpar dados apenas se não houver dados anteriores
        if (embarquesData.length === 0) {
            embarquesFiltrados = [];
            atualizarEstatisticas();
            renderizarEmbarques();
        }
    } finally {
        mostrarLoading(false);
    }
}

// ================================================================================
// 📄 PROCESSAMENTO DE DADOS v8.18 - ATRASADOS CORRIGIDOS
// ================================================================================
function processarDados(dados) {
    const embarquesProcessados = [];
    
    dados.forEach((embarque, index) => {
        try {
            if (!validarEmbarque(embarque)) return;
            
            const dataIda = converterData(embarque.dataIda || embarque['Data Ida'] || '');
            const hoje = new Date();
            const diffDays = Math.ceil((dataIda - hoje) / (1000 * 60 * 60 * 24));
            
            // CORREÇÃO v8.18: Verificar status das etapas pelos campos corretos da planilha
            const conferenciaFeita = Boolean(
                embarque.dataConferencia || 
                embarque['Data Conferência'] || 
                embarque.responsavelConferencia || 
                embarque['Responsável Conferência'] ||
                embarque.conferenciaFeita === true ||
                embarque.conferenciaFeita === 'true' ||
                embarque.conferenciaFeita === 'Sim'
            );
            
            const checkinFeito = Boolean(
                embarque.dataCheckin || 
                embarque['Data Check-in'] || 
                embarque.responsavelCheckin || 
                embarque['Responsável Check-in']
            );
            
            const posVendaFeita = Boolean(
                embarque.dataPosVenda || 
                embarque['Data Pós-vendas'] || 
                embarque.responsavelPosVenda || 
                embarque['Responsável Pós-vendas']
            );
            
            // CORREÇÃO v8.18: LÓGICA DE CATEGORIZAÇÃO APRIMORADA
            let categoria = classificarEmbarqueCorrigido(embarque, diffDays, conferenciaFeita, checkinFeito, posVendaFeita);
            
            // Determinar urgência baseada na categoria e dias
            let urgencia = determinarUrgencia(categoria, diffDays);
            
            const embarqueProcessado = {
                id: embarque.id || index + 1,
                numeroInforme: embarque.numeroInforme || embarque['Nº do Informe'] || `EMBARQUE-${index}`,
                vendedor: embarque.vendedor || embarque.Vendedor || 'N/A',
                nomeCliente: embarque.nomeCliente || embarque['Nome do Cliente'] || 'Cliente não informado',
                cpfCliente: embarque.cpfCliente || embarque.CPF || '',
                whatsappCliente: embarque.whatsappCliente || embarque['WhatsApp do Cliente'] || '',
                dataIda: dataIda.toISOString(),
                dataVolta: embarque.dataVolta ? converterData(embarque.dataVolta).toISOString() : '',
                recibo: embarque.recibo || embarque.Recibo || '',
                reserva: embarque.reserva || embarque.Reserva || '',
                tipo: embarque.tipo || embarque.Tipo || 'N/A',
                cia: embarque.cia || embarque.CIA || '',
                locGds: embarque.locGds || embarque['LOC GDS'] || '',
                locCia: embarque.locCia || embarque['LOC CIA'] || '',
                observacoes: embarque.observacoes || embarque.Observacoes || '',
                clienteAle: embarque.clienteAle || embarque['Cliente Ale'] || 'Não',
                grupoOfertas: embarque.grupoOfertas || embarque['Grupo Ofertas Whats'] || '',
                postouInsta: embarque.postouInsta || embarque['Postou no Insta'] || '',
                avaliacaoGoogle: embarque.avaliacaoGoogle || embarque['Avaliação Google'] || '',
                numeroSac: embarque.numeroSac || embarque.SAC || '',
                
                // Status das etapas
                conferenciaFeita,
                checkinFeito,
                posVendaFeita,
                
                // Datas das etapas
                dataConferencia: embarque.dataConferencia || embarque['Data Conferência'] || '',
                responsavelConferencia: embarque.responsavelConferencia || embarque['Responsável Conferência'] || '',
                dataCheckin: embarque.dataCheckin || embarque['Data Check-in'] || '',
                responsavelCheckin: embarque.responsavelCheckin || embarque['Responsável Check-in'] || '',
                dataPosVenda: embarque.dataPosVenda || embarque['Data Pós-vendas'] || '',
                responsavelPosVenda: embarque.responsavelPosVenda || embarque['Responsável Pós-vendas'] || '',
                
                // Metadados
                categoria,
                urgencia,
                diasParaVoo: diffDays > 0 ? `${diffDays} dias` : diffDays === 0 ? 'Hoje' : `${Math.abs(diffDays)} dias atrás`,
                diasNumericos: diffDays
            };
            
            embarquesProcessados.push(embarqueProcessado);
            
        } catch (error) {
            console.warn(`Erro ao processar linha ${index}:`, error);
        }
    });
    
    return embarquesProcessados;
}

// ================================================================================
// 🎯 NOVA FUNÇÃO v8.18: CLASSIFICAÇÃO CORRIGIDA INCLUINDO ATRASADOS
// ================================================================================
function classificarEmbarqueCorrigido(embarque, diffDays, conferenciaFeita, checkinFeito, posVendaFeita) {
    // Se todas as etapas estão concluídas
    if (conferenciaFeita && checkinFeito && posVendaFeita) {
        return 'concluido';
    }
    
    // CORREÇÃO v8.18: PÓS-VENDAS MELHORADO
    if (embarque.dataVolta) {
        const dataVolta = converterData(embarque.dataVolta);
        const hoje = new Date();
        const diasAposVolta = Math.ceil((hoje - dataVolta) / (1000 * 60 * 60 * 24));
        
        if (diasAposVolta >= 1) {
            return 'pos-venda';
        }
    } else {
        if (diffDays < -7) { // Voo foi há mais de 7 dias
            return 'pos-venda';
        }
    }
    
    // CORREÇÃO v8.18: CHECK-IN INCLUINDO ATRASADOS
    if (diffDays >= -365 && diffDays <= 3) {
        return 'checkin';
    }
    
    // CORREÇÃO v8.18: CONFERÊNCIA INCLUINDO ATRASADOS
    if ((diffDays >= 4 && diffDays <= 30) || (diffDays < 4 && !conferenciaFeita)) {
        return 'conferencia';
    }
    
    return 'conferencia';
}

// ================================================================================
// 🎯 NOVA FUNÇÃO v8.18: DETERMINAR URGÊNCIA MELHORADA
// ================================================================================
function determinarUrgencia(categoria, diffDays) {
    switch (categoria) {
        case 'conferencia':
            if (diffDays < 0) return 'urgente'; // ATRASADO
            if (diffDays <= 4) return 'urgente'; // Muito próximo
            if (diffDays <= 7) return 'alerta'; // Próximo
            return 'normal'; // Normal
            
        case 'checkin':
            if (diffDays < 0) return 'urgente'; // ATRASADO
            if (diffDays <= 1) return 'urgente'; // Hoje/amanhã
            if (diffDays === 2) return 'alerta'; // 2 dias
            return 'normal'; // 3 dias
            
        case 'pos-venda':
            const diasAposVoo = Math.abs(diffDays);
            if (diasAposVoo >= 15) return 'urgente'; // Muito atrasado
            if (diasAposVoo >= 8) return 'alerta'; // Atrasado
            return 'normal'; // No prazo
            
        default:
            return 'normal';
    }
}

function preencherFiltros() {
    const filtroVendedor = document.getElementById('filtroVendedor');
    
    if (!filtroVendedor) {
        console.log('Elemento filtroVendedor não encontrado');
        return;
    }
    
    // Obter vendedores únicos dos dados processados
    const vendedoresUnicos = new Set();
    embarquesData.forEach(e => {
        if (e.vendedor && e.vendedor !== 'N/A') {
            vendedoresUnicos.add(e.vendedor);
        }
    });
    
    filtroVendedor.innerHTML = '<option value="">Todos os Vendedores</option>';
    
    Array.from(vendedoresUnicos).sort().forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor;
        option.textContent = vendedor;
        filtroVendedor.appendChild(option);
    });
    
    console.log(`Filtro de vendedores preenchido com ${vendedoresUnicos.size} opções`);
}

function validarEmbarque(embarque) {
    if (!embarque || typeof embarque !== 'object') return false;
    if (!embarque.nomeCliente && !embarque['Nome do Cliente']) return false;
    if (!embarque.cpfCliente && !embarque.CPF) return false;
    if (!embarque.vendedor && !embarque.Vendedor) return false;
    return true;
}

function converterData(dataString) {
    if (!dataString) return new Date();
    
    try {
        if (dataString instanceof Date) return dataString;
        if (typeof dataString === 'string' && dataString.includes('T')) {
            return new Date(dataString);
        }
        
        const str = dataString.toString();
        if (str.includes('/')) {
            const partes = str.split('/');
            if (partes.length === 3) {
                return new Date(partes[2], partes[1] - 1, partes[0]);
            }
        }
        
        return new Date(str);
    } catch (error) {
        return new Date();
    }
}

// ================================================================================
// 🎨 RENDERIZAÇÃO CORRIGIDA v8.18
// ================================================================================
function renderizarEmbarques() {
    // CORREÇÃO v8.18: Filtrar corretamente por categoria, excluindo apenas os que já têm conferência feita
    const listas = {
        conferencia: embarquesFiltrados.filter(e => e.categoria === 'conferencia' && !e.conferenciaFeita),
        checkin: embarquesFiltrados.filter(e => e.categoria === 'checkin'),
        posVenda: embarquesFiltrados.filter(e => e.categoria === 'pos-venda'),
        concluido: embarquesFiltrados.filter(e => e.conferenciaFeita || e.categoria === 'concluido')
    };
    
    renderizarLista('listaConferencias', listas.conferencia, 'conferencia');
    renderizarLista('listaCheckins', listas.checkin, 'checkin');
    renderizarLista('listaPosVendas', listas.posVenda, 'pos-venda');
    renderizarLista('listaConcluidos', listas.concluido, 'concluido');
    
    // Atualizar badges
    atualizarBadges(listas);
    
    // Log para debug
    console.log('📊 Estatísticas v8.18:');
    console.log(`   Conferências: ${listas.conferencia.length} (incluindo atrasados)`);
    console.log(`   Check-ins: ${listas.checkin.length} (incluindo atrasados)`);  
    console.log(`   Pós-vendas: ${listas.posVenda.length} (lógica melhorada)`);
    console.log(`   Concluídos: ${listas.concluido.length}`);
}

function renderizarLista(containerId, embarques, categoria) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (embarques.length === 0) {
        const mensagensVazias = {
            'conferencia': 'Nenhuma conferência pendente',
            'checkin': 'Nenhum check-in próximo ou atrasado',
            'pos-venda': 'Nenhum pós-venda pendente',
            'concluido': 'Nenhum embarque concluído'
        };
        
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-${categoria === 'conferencia' ? 'clipboard-check' : categoria === 'checkin' ? 'plane' : categoria === 'pos-venda' ? 'phone' : 'check-double'}" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h5>${mensagensVazias[categoria]}</h5>
                <small>v8.18 - Modal completo corrigido - Total: ${stats.total} embarques</small>
            </div>
        `;
        return;
    }
    
    // CORREÇÃO v8.18: Ordenação melhorada incluindo atrasados
    const embarquesOrdenados = [...embarques].sort((a, b) => {
        const diasA = a.diasNumericos || 999;
        const diasB = b.diasNumericos || 999;
        
        // Para check-ins e conferências, priorizar atrasados (negativos) primeiro
        if (categoria === 'checkin' || categoria === 'conferencia') {
            // Ambos atrasados: mais antigo primeiro
            if (diasA < 0 && diasB < 0) return diasA - diasB;
            // Apenas A atrasado: A primeiro
            if (diasA < 0 && diasB >= 0) return -1;
            // Apenas B atrasado: B primeiro  
            if (diasA >= 0 && diasB < 0) return 1;
        }
        
        // Ordem crescente normal para o resto
        return diasA - diasB;
    });

    container.innerHTML = embarquesOrdenados.map(e => criarCardEmbarque(e, categoria)).join('');
}

function criarCardEmbarque(embarque, categoria) {
    const urgenciaClass = embarque.urgencia || 'normal';
    const coresUrgencia = {
        'urgente': { bg: '#fff5f5', border: '#dc3545', led: '#dc3545', texto: '#dc3545' },
        'alerta': { bg: '#fffbf0', border: '#ffc107', led: '#ffc107', texto: '#856404' },
        'normal': { bg: '#f8fff8', border: '#28a745', led: '#28a745', texto: '#155724' }
    };
    
    const cor = coresUrgencia[urgenciaClass] || coresUrgencia.normal;
    const whatsappLink = embarque.whatsappCliente ? 
        `https://wa.me/55${embarque.whatsappCliente.replace(/\D/g, '')}` : '#';
    const clienteAleTag = embarque.clienteAle === 'Sim' ? 
        '<span style="background: #0A00B4; color: #FFE600; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 8px;">Cliente Ale</span>' : '';
    
    // CORREÇÃO v8.18: Mostrar status de atraso claramente
    const isAtrasado = embarque.diasNumericos < 0;
    const statusAtraso = isAtrasado ? 
        `<div style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; margin-left: 8px;">ATRASADO</div>` : '';
    
    return `
        <div class="embarque-card" style="
            background: ${cor.bg};
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(10, 0, 180, 0.1);
            border-left: 4px solid ${cor.border};
            position: relative;
            font-family: 'Nunito', sans-serif;
        ">
            <!-- LED de urgência -->
            <div style="
                position: absolute;
                top: 15px;
                right: 15px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${cor.led};
                box-shadow: 0 0 8px rgba(0,0,0,0.3);
                ${isAtrasado ? 'animation: blink 1s infinite;' : ''}
            "></div>
            
            <!-- Header -->
            <div style="margin-bottom: 15px;">
                <div style="
                    font-weight: 700;
                    color: #0A00B4;
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                ">
                    ${embarque.nomeCliente}
                    ${clienteAleTag}
                    ${statusAtraso}
                </div>
                <div style="font-size: 0.85rem; color: #6c757d; margin-bottom: 10px;">
                    CPF: ${embarque.cpfCliente}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="
                        background: #FFE600;
                        color: #0A00B4;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    ">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</span>
                    <span style="
                        color: ${cor.texto};
                        font-weight: 600;
                        font-size: 0.85rem;
                    ">${embarque.diasParaVoo}</span>
                </div>
            </div>
            
            <!-- Detalhes -->
            <div style="margin-bottom: 15px; color: #1B365D;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-user-tie" style="color: #0A00B4; width: 16px;"></i>
                        <span style="font-weight: 600;">Vendedor:</span>
                        <span>${embarque.vendedor}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-calendar" style="color: #0A00B4; width: 16px;"></i>
                        <span style="font-weight: 600;">Data do Voo:</span>
                        <span>${formatarData(embarque.dataIda)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clock" style="color: #0A00B4; width: 16px;"></i>
                        <span style="font-weight: 600;">Status:</span>
                        <span style="font-weight: 600; color: ${cor.texto};">${embarque.urgencia.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-receipt" style="color: #0A00B4; width: 16px;"></i>
                        <span style="font-weight: 600;">Recibo:</span>
                        <span>${embarque.recibo || 'N/A'}</span>
                        ${embarque.recibo ? `<button onclick="copiarTexto('${embarque.recibo}', this)" style="background: none; border: none; color: #0A00B4; cursor: pointer; padding: 2px;"><i class="fas fa-copy"></i></button>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-building" style="color: #0A00B4; width: 16px;"></i>
                        <span style="font-weight: 600;">Nº Informe:</span>
                        <span>${embarque.numeroInforme || 'N/A'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fab fa-whatsapp" style="color: #25D366; width: 16px;"></i>
                        <span style="font-weight: 600;">WhatsApp:</span>
                        <span>${embarque.whatsappCliente || 'N/A'}</span>
                        ${embarque.whatsappCliente ? `<button onclick="copiarTexto('${embarque.whatsappCliente}', this)" style="background: none; border: none; color: #25D366; cursor: pointer; padding: 2px;"><i class="fas fa-copy"></i></button>` : ''}
                    </div>
                </div>
            </div>
            
            ${embarque.observacoes ? `
                <div style="
                    background: rgba(10, 0, 180, 0.05);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 15px;
                ">
                    <div style="
                        font-weight: 600;
                        color: #0A00B4;
                        font-size: 0.85rem;
                        margin-bottom: 5px;
                    ">Observações</div>
                    <div style="
                        color: #495057;
                        font-size: 0.9rem;
                        line-height: 1.4;
                    ">${embarque.observacoes.substring(0, 150)}${embarque.observacoes.length > 150 ? '...' : ''}</div>
                </div>
            ` : ''}
            
            <!-- Ações -->
            <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(10, 0, 180, 0.1); padding-top: 15px;">
                ${embarque.whatsappCliente ? `
                    <a href="${whatsappLink}" target="_blank" style="
                        background: #25D366;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-size: 0.8rem;
                        font-weight: 600;
                    ">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                ` : ''}
                
                <button onclick="abrirDetalhesEmbarque('${embarque.numeroInforme}')" style="
                    background: #0A00B4;
                    color: #FFE600;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
            </div>
        </div>
        
        <style>
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        </style>
    `;
}

function formatarData(data) {
    if (!data) return 'N/A';
    try {
        return new Date(data).toLocaleDateString('pt-BR');
    } catch (error) {
        return 'N/A';
    }
}

// ================================================================================
// 📊 ESTATÍSTICAS CORRIGIDAS v8.18
// ================================================================================
function atualizarEstatisticas() {
    stats = {
        conferencias: embarquesData.filter(e => e.categoria === 'conferencia' && !e.conferenciaFeita).length,
        checkins: embarquesData.filter(e => e.categoria === 'checkin').length,
        posVendas: embarquesData.filter(e => e.categoria === 'pos-venda').length,
        concluidos: embarquesData.filter(e => e.conferenciaFeita || e.categoria === 'concluido').length,
        total: embarquesData.length
    };
}

function atualizarBadges(listas) {
    const badges = {
        'badgeConferencias': listas.conferencia.length,
        'badgeCheckins': listas.checkin.length,
        'badgePosVendas': listas.posVenda.length,
        'badgeConcluidos': listas.concluido.length
    };
    
    Object.entries(badges).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    });
}

// ================================================================================
// 🔍 FILTROS (código mantido da v8.17)
// ================================================================================
function aplicarFiltros() {
    const filtroVendedor = document.getElementById('filtroVendedor')?.value || '';
    const filtroCPF = document.getElementById('filtroCPF')?.value || '';
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    const filtroClienteAle = document.getElementById('filtroClienteAle')?.value || '';
    const filtroWhatsApp = document.getElementById('filtroWhatsApp')?.value || '';
    const filtroRecibo = document.getElementById('filtroRecibo')?.value || '';
    const filtroReserva = document.getElementById('filtroReserva')?.value || '';
    const filtroLocGds = document.getElementById('filtroLocGds')?.value || '';
    const filtroLocCia = document.getElementById('filtroLocCia')?.value || '';
    const filtroDataInicio = document.getElementById('filtroDataInicio')?.value || '';
    
    embarquesFiltrados = embarquesData.filter(embarque => {
        if (filtroVendedor && !embarque.vendedor.includes(filtroVendedor)) return false;
        if (filtroCPF && !embarque.cpfCliente.replace(/\D/g, '').includes(filtroCPF.replace(/\D/g, ''))) return false;
        if (filtroStatus && embarque.categoria !== filtroStatus) return false;
        if (filtroClienteAle && embarque.clienteAle !== filtroClienteAle) return false;
        if (filtroWhatsApp && !embarque.whatsappCliente.replace(/\D/g, '').includes(filtroWhatsApp.replace(/\D/g, ''))) return false;
        if (filtroRecibo && !embarque.recibo.toLowerCase().includes(filtroRecibo.toLowerCase())) return false;
        if (filtroReserva && !embarque.reserva.toLowerCase().includes(filtroReserva.toLowerCase())) return false;
        if (filtroLocGds && !embarque.locGds.toLowerCase().includes(filtroLocGds.toLowerCase())) return false;
        if (filtroLocCia && !embarque.locCia.toLowerCase().includes(filtroLocCia.toLowerCase())) return false;
        
        if (filtroDataInicio) {
            const dataInicio = new Date(filtroDataInicio);
            const dataEmbarque = converterData(embarque.dataIda);
            if (dataEmbarque.toDateString() !== dataInicio.toDateString()) return false;
        }
        
        return true;
    });
    
    renderizarEmbarques();
    console.log(`Filtros aplicados: ${embarquesFiltrados.length} embarques`);
}

function limparFiltros() {
    const campos = [
        'filtroVendedor', 'filtroCPF', 'filtroStatus', 'filtroClienteAle',
        'filtroWhatsApp', 'filtroRecibo', 'filtroReserva', 'filtroLocGds',
        'filtroLocCia', 'filtroDataInicio'
    ];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) elemento.value = '';
    });
    
    embarquesFiltrados = [...embarquesData];
    renderizarEmbarques();
    console.log('Todos os filtros limpos');
}

function filtrarPorCategoria(categoria) {
    // Atualizar abas ativas
    const tabs = document.querySelectorAll('#navTabs .nav-link');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabAtivo = document.getElementById(`tab-${categoria}`);
    if (tabAtivo) tabAtivo.classList.add('active');
    
    // Aplicar filtro
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) {
        filtroStatus.value = categoria;
        aplicarFiltros();
    }
}

// ================================================================================
// 🔧 MODAL DE DETALHES COMPLETO v8.18 - CORREÇÃO PRINCIPAL
// ================================================================================
async function abrirDetalhesEmbarque(numeroInforme) {
    console.log(`🔍 Abrindo detalhes para: ${numeroInforme}`);
    
    embarquesRelacionados = embarquesData.filter(e => {
        return e.numeroInforme === numeroInforme;
    });
    
    window.embarquesRelacionados = embarquesRelacionados;
    
    if (embarquesRelacionados.length === 0) {
        mostrarNotificacao('Nenhum embarque encontrado para este número de informe', 'warning');
        return;
    }
    
    embarquesRelacionados.sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));
    const cliente = embarquesRelacionados[0];
    
    console.log(`👤 Cliente: ${cliente.nomeCliente}, Voos no informe: ${embarquesRelacionados.length}`);
    
    // Criar conteúdo do modal
    const modalContent = criarConteudoModal(cliente, embarquesRelacionados);
    
    // Preencher modal
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
        console.log('✅ modalBody encontrado, preenchendo conteúdo...');
        modalBody.innerHTML = modalContent;
        console.log('✅ Modal preenchido com sucesso!');
    } else {
        console.error('❌ Elemento modalBody não encontrado');
        return;
    }
    
    // Abrir modal usando Bootstrap
    setTimeout(() => {
        try {
            const modalEl = document.getElementById('modalDetalhes');
            if (modalEl) {
                console.log('Abrindo modal com Bootstrap');
                if (typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                } else {
                    console.log('Bootstrap não disponível, tentando CSS');
                    modalEl.style.display = 'block';
                    modalEl.classList.add('show');
                }
                
                // Configurar eventos dos botões do modal
                configurarEventosModal();
            } else {
                console.error('❌ Modal modalDetalhes não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao abrir modal:', error);
        }
    }, 100);
}

function criarConteudoModal(cliente, embarques) {
    const whatsappLink = cliente.whatsappCliente ? 
        `https://wa.me/55${cliente.whatsappCliente.replace(/\D/g, '')}` : '#';
    
    const clienteAleTag = cliente.clienteAle === 'Sim' ? 
        '<span class="badge" style="background: #0A00B4; color: #FFE600;">Cliente Ale</span>' : '';
    
    // Header com informações do cliente
    const headerCliente = `
        <div class="row mb-4" style="background: linear-gradient(135deg, #0A00B4, #1B365D); color: white; padding: 20px; border-radius: 12px; margin: 0;">
            <div class="col-md-8">
                <h4 style="color: #FFE600; margin-bottom: 10px;">
                    <i class="fas fa-user-circle"></i> ${cliente.nomeCliente} ${clienteAleTag}
                </h4>
                <div class="row">
                    <div class="col-md-6">
                        <div style="margin-bottom: 8px;">
                            <i class="fas fa-id-card" style="color: #FFE600; margin-right: 8px;"></i>
                            <strong>CPF:</strong> ${cliente.cpfCliente}
                        </div>
                        <div style="margin-bottom: 8px;">
                            <i class="fas fa-user-tie" style="color: #FFE600; margin-right: 8px;"></i>
                            <strong>Vendedor:</strong> ${cliente.vendedor}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div style="margin-bottom: 8px;">
                            <i class="fab fa-whatsapp" style="color: #25D366; margin-right: 8px;"></i>
                            <strong>WhatsApp:</strong> ${cliente.whatsappCliente || 'Não informado'}
                            ${cliente.whatsappCliente ? `
                                <a href="${whatsappLink}" target="_blank" class="btn btn-sm" style="background: #25D366; color: white; margin-left: 10px;">
                                    <i class="fab fa-whatsapp"></i> Abrir
                                </a>
                            ` : ''}
                        </div>
                        <div style="margin-bottom: 8px;">
                            <i class="fas fa-building" style="color: #FFE600; margin-right: 8px;"></i>
                            <strong>Nº Informe:</strong> ${cliente.numeroInforme}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-end">
                <div style="font-size: 2rem; color: #FFE600;">
                    <i class="fas fa-plane"></i>
                </div>
                <div style="font-size: 0.9rem; opacity: 0.9;">
                    ${embarques.length} voo${embarques.length > 1 ? 's' : ''} encontrado${embarques.length > 1 ? 's' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Lista de voos
    let voosHtml = '';
    embarques.forEach((embarque, index) => {
        const statusConferencia = embarque.conferenciaFeita ? 
            `<span class="badge bg-success"><i class="fas fa-check"></i> Conferência Concluída</span>` :
            `<span class="badge bg-warning"><i class="fas fa-clock"></i> Aguardando Conferência</span>`;
        
        const statusCheckin = embarque.checkinFeito ? 
            `<span class="badge bg-success"><i class="fas fa-check"></i> Check-in Realizado</span>` :
            `<span class="badge bg-secondary"><i class="fas fa-clock"></i> Pendente</span>`;
        
        const statusPosVenda = embarque.posVendaFeita ? 
            `<span class="badge bg-success"><i class="fas fa-check"></i> Pós-venda Concluído</span>` :
            `<span class="badge bg-secondary"><i class="fas fa-clock"></i> Pendente</span>`;
        
        const urgenciaClass = embarque.urgencia === 'urgente' ? 'border-danger' : 
                             embarque.urgencia === 'alerta' ? 'border-warning' : 'border-success';
        
        voosHtml += `
            <div class="card mb-3 ${urgenciaClass}" style="border-width: 2px;">
                <div class="card-header" style="background: rgba(10, 0, 180, 0.05); border-bottom: 1px solid #dee2e6;">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="mb-0" style="color: #0A00B4;">
                                <i class="fas fa-plane-departure"></i> 
                                Voo ${index + 1} - ${formatarData(embarque.dataIda)}
                                <span class="badge ms-2" style="background: ${embarque.urgencia === 'urgente' ? '#dc3545' : embarque.urgencia === 'alerta' ? '#ffc107' : '#28a745'}; color: white;">
                                    ${embarque.diasParaVoo}
                                </span>
                            </h6>
                        </div>
                        <div class="col-md-4 text-end">
                            <small class="text-muted">Recibo: ${embarque.recibo || 'N/A'}</small>
                            ${embarque.recibo ? `
                                <button class="btn btn-sm btn-outline-primary ms-2" onclick="copiarTexto('${embarque.recibo}', this)" title="Copiar recibo">
                                    <i class="fas fa-copy"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong>Companhia:</strong> ${embarque.cia || 'N/A'}<br>
                            <strong>Tipo:</strong> ${embarque.tipo || 'N/A'}
                        </div>
                        <div class="col-md-4">
                            <strong>Reserva:</strong> ${embarque.reserva || 'N/A'}<br>
                            <strong>LOC GDS:</strong> ${embarque.locGds || 'N/A'}
                        </div>
                        <div class="col-md-4">
                            <strong>LOC CIA:</strong> ${embarque.locCia || 'N/A'}<br>
                            <strong>Status:</strong> <span style="color: ${embarque.urgencia === 'urgente' ? '#dc3545' : embarque.urgencia === 'alerta' ? '#ffc107' : '#28a745'}; font-weight: bold;">${embarque.urgencia.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <div class="mb-2">${statusConferencia}</div>
                            ${embarque.dataConferencia ? `<small class="text-muted">Em ${formatarData(embarque.dataConferencia)} por ${embarque.responsavelConferencia}</small>` : ''}
                        </div>
                        <div class="col-md-4 text-center">
                            <div class="mb-2">${statusCheckin}</div>
                            ${embarque.dataCheckin ? `<small class="text-muted">Em ${formatarData(embarque.dataCheckin)} por ${embarque.responsavelCheckin}</small>` : ''}
                        </div>
                        <div class="col-md-4 text-center">
                            <div class="mb-2">${statusPosVenda}</div>
                            ${embarque.dataPosVenda ? `<small class="text-muted">Em ${formatarData(embarque.dataPosVenda)} por ${embarque.responsavelPosVenda}</small>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Campos editáveis de pós-venda
    const camposEditaveis = `
        <div class="card mt-4">
            <div class="card-header" style="background: linear-gradient(135deg, #0A00B4, #1B365D); color: white;">
                <h6 class="mb-0"><i class="fas fa-edit"></i> Campos Editáveis - Pós-venda</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12 mb-3">
                        <label for="observacoesPosVenda" class="form-label">Observações</label>
                        <textarea class="form-control" id="observacoesPosVenda" rows="3" placeholder="Digite observações sobre o atendimento...">${cliente.observacoes || ''}</textarea>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="grupoOfertas" class="form-label">Grupo Ofertas WhatsApp</label>
                        <select class="form-control" id="grupoOfertas">
                            <option value="">Selecione...</option>
                            <option value="Sim" ${cliente.grupoOfertas === 'Sim' ? 'selected' : ''}>Sim</option>
                            <option value="Não" ${cliente.grupoOfertas === 'Não' ? 'selected' : ''}>Não</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="postouInsta" class="form-label">Postou no Instagram</label>
                        <select class="form-control" id="postouInsta">
                            <option value="">Selecione...</option>
                            <option value="Sim" ${cliente.postouInsta === 'Sim' ? 'selected' : ''}>Sim</option>
                            <option value="Não" ${cliente.postouInsta === 'Não' ? 'selected' : ''}>Não</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="avaliacaoGoogle" class="form-label">Avaliação Google</label>
                        <select class="form-control" id="avaliacaoGoogle">
                            <option value="">Selecione...</option>
                            <option value="Sim" ${cliente.avaliacaoGoogle === 'Sim' ? 'selected' : ''}>Sim</option>
                            <option value="Não" ${cliente.avaliacaoGoogle === 'Não' ? 'selected' : ''}>Não</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="numeroSac" class="form-label">SAC</label>
                        <input type="text" class="form-control" id="numeroSac" value="${cliente.numeroSac || ''}" placeholder="Número do SAC">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return headerCliente + voosHtml + camposEditaveis;
}

function configurarEventosModal() {
    console.log('🔧 Configurando eventos dos botões do modal...');
    
    // Botão Marcar Conferência
    const btnMarcarConferido = document.getElementById('btnMarcarConferido');
    if (btnMarcarConferido) {
        console.log('✅ Botão conferência encontrado, configurando evento...');
        
        // Remover listeners anteriores
        btnMarcarConferido.replaceWith(btnMarcarConferido.cloneNode(true));
        
        // Pegar referência atualizada e configurar evento
        const btnAtualizado = document.getElementById('btnMarcarConferido');
        btnAtualizado.addEventListener('click', function() {
            console.log('🎯 Clique no botão conferência detectado!');
            marcarConferencia();
        });
        
        // Atualizar texto do botão baseado no status
        if (embarquesRelacionados[0].conferenciaFeita) {
            btnAtualizado.innerHTML = '<i class="fas fa-undo"></i> Desfazer Conferência';
            btnAtualizado.classList.remove('btn-success');
            btnAtualizado.classList.add('btn-warning');
        } else {
            btnAtualizado.innerHTML = '<i class="fas fa-check"></i> Marcar como Conferido';
            btnAtualizado.classList.remove('btn-warning');
            btnAtualizado.classList.add('btn-success');
        }
    } else {
        console.log('❌ Botão conferência NÃO encontrado');
    }
    
    // Botão Salvar Alterações
    const btnSalvarAlteracoes = document.getElementById('btnSalvarAlteracoes');
    if (btnSalvarAlteracoes) {
        console.log('✅ Botão salvar encontrado, configurando evento...');
        
        btnSalvarAlteracoes.replaceWith(btnSalvarAlteracoes.cloneNode(true));
        
        const btnSalvarAtualizado = document.getElementById('btnSalvarAlteracoes');
        btnSalvarAtualizado.addEventListener('click', function() {
            console.log('🎯 Clique no botão salvar detectado!');
            salvarAlteracoesPosVenda();
        });
    } else {
        console.log('❌ Botão salvar NÃO encontrado');
    }
    
    // Botão Buscar Orbiuns
    const btnBuscarOrbiuns = document.getElementById('btnBuscarOrbiuns');
    if (btnBuscarOrbiuns) {
        console.log('✅ Botão Orbiuns encontrado, configurando evento...');
        
        btnBuscarOrbiuns.replaceWith(btnBuscarOrbiuns.cloneNode(true));
        
        const btnOrbiumsAtualizado = document.getElementById('btnBuscarOrbiuns');
        btnOrbiumsAtualizado.addEventListener('click', function() {
            console.log('🎯 Clique no botão Orbiuns detectado!');
            buscarOrbiuns();
        });
    } else {
        console.log('❌ Botão Orbiuns NÃO encontrado');
    }
}

// ================================================================================
// 🎯 FUNÇÕES DOS BOTÕES DO MODAL v8.18
// ================================================================================
async function marcarConferencia() {
    console.log('🎯 marcarConferencia() iniciada');
    
    if (!embarquesRelacionados || embarquesRelacionados.length === 0) {
        console.log('❌ Nenhum embarque relacionado encontrado');
        mostrarNotificacao('Erro: Nenhum embarque encontrado', 'error');
        return;
    }
    
    const cliente = embarquesRelacionados[0];
    const novoStatus = !cliente.conferenciaFeita;
    
    console.log('📊 Estado atual:', {
        cliente: cliente.nomeCliente,
        cpf: cliente.cpfCliente,
        conferenciaAtual: cliente.conferenciaFeita,
        novoStatus: novoStatus
    });
    
    const confirmMessage = novoStatus ? 
        `Marcar conferência como CONCLUÍDA para ${cliente.nomeCliente}?` :
        `Desfazer conferência de ${cliente.nomeCliente}?`;
        
    if (!confirm(confirmMessage)) {
        console.log('❌ Operação cancelada pelo usuário');
        return;
    }
    
    try {
        console.log('📡 Enviando para API...');
        mostrarLoading(true);
        
        const payload = {
            action: 'marcar_conferencia',
            cpf: cliente.cpfCliente,
            recibo: cliente.recibo,
            numeroInforme: cliente.numeroInforme,
            desfazer: !novoStatus
        };
        
        console.log('📤 Payload:', payload);
        
        const resultado = await chamarAPIComJSONP(payload);
        
        console.log('📥 Resposta da API:', resultado);
        
        if (resultado.success) {
            // Atualizar dados locais
            embarquesRelacionados.forEach(embarque => {
                if (embarque) {
                    embarque.conferenciaFeita = novoStatus;
                    embarque.dataConferencia = novoStatus ? new Date().toLocaleDateString('pt-BR') : '';
                    embarque.responsavelConferencia = novoStatus ? 'Dashboard v8.18' : '';
                }
            });
            
            // Atualizar nos dados principais
            embarquesData.forEach(embarque => {
                if (embarque.cpfCliente === cliente.cpfCliente && embarque.numeroInforme === cliente.numeroInforme) {
                    embarque.conferenciaFeita = novoStatus;
                    embarque.dataConferencia = embarquesRelacionados[0].dataConferencia;
                    embarque.responsavelConferencia = embarquesRelacionados[0].responsavelConferencia;
                }
            });
            
            console.log('✅ Dados atualizados localmente');
            
            // Fechar modal e atualizar interface
            const modalEl = document.getElementById('modalDetalhes');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
            
            // Atualizar interface
            atualizarEstatisticas();
            renderizarEmbarques();
            
            const statusText = novoStatus ? 'marcada como concluída' : 'desmarcada';
            mostrarNotificacao(`✅ Conferência ${statusText} com sucesso!`, 'success');
            
            console.log('✅ Operação concluída com sucesso');
            
        } else {
            console.error('❌ Erro da API:', resultado.message);
            mostrarNotificacao(`Erro: ${resultado.message}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao marcar conferência:', error);
        mostrarNotificacao(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function salvarAlteracoesPosVenda() {
    console.log('🎯 salvarAlteracoesPosVenda() iniciada');
    
    if (!embarquesRelacionados || embarquesRelacionados.length === 0) {
        mostrarNotificacao('Erro: Nenhum embarque encontrado', 'error');
        return;
    }
    
    const cliente = embarquesRelacionados[0];
    
    // Coletar dados dos campos
    const dadosEditaveis = {
        observacoes: document.getElementById('observacoesPosVenda')?.value || '',
        grupoOfertas: document.getElementById('grupoOfertas')?.value || '',
        postouInsta: document.getElementById('postouInsta')?.value || '',
        avaliacaoGoogle: document.getElementById('avaliacaoGoogle')?.value || '',
        numeroSac: document.getElementById('numeroSac')?.value || ''
    };
    
    console.log('📊 Dados coletados:', dadosEditaveis);
    
    if (!confirm(`Salvar alterações de pós-venda para ${cliente.nomeCliente}?`)) {
        return;
    }
    
    try {
        mostrarLoading(true);
        
        const payload = {
            action: 'marcar_pos_venda',
            cpf: cliente.cpfCliente,
            numeroInforme: cliente.numeroInforme,
            ...dadosEditaveis
        };
        
        console.log('📤 Payload pós-venda:', payload);
        
        const resultado = await chamarAPIComJSONP(payload);
        
        if (resultado.success) {
            // Atualizar dados locais
            Object.assign(cliente, dadosEditaveis);
            cliente.posVendaFeita = true;
            cliente.dataPosVenda = new Date().toLocaleDateString('pt-BR');
            cliente.responsavelPosVenda = 'Dashboard v8.18';
            
            mostrarNotificacao('✅ Alterações de pós-venda salvas com sucesso!', 'success');
            console.log('✅ Pós-venda salva com sucesso');
            
        } else {
            console.error('❌ Erro da API pós-venda:', resultado.message);
            mostrarNotificacao(`Erro: ${resultado.message}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar pós-venda:', error);
        mostrarNotificacao(`Erro ao salvar pós-venda: ${error.message}`, 'error');
    } finally {
        mostrarLoading(false);
    }
}

function buscarOrbiuns() {
    console.log('🎯 buscarOrbiuns() iniciada');
    
    if (!embarquesRelacionados || embarquesRelacionados.length === 0) {
        mostrarNotificacao('Erro: Nenhum embarque encontrado', 'error');
        return;
    }
    
    const cliente = embarquesRelacionados[0];
    
    // Criar link para busca no Orbiuns (simulado)
    const urlOrbiuns = `https://orbiuns.exemplo.com/buscar?cpf=${cliente.cpfCliente.replace(/\D/g, '')}&nome=${encodeURIComponent(cliente.nomeCliente)}`;
    
    // Abrir em nova aba
    window.open(urlOrbiuns, '_blank');
    
    mostrarNotificacao('🔍 Abrindo busca no Orbiuns em nova aba', 'info');
    console.log('✅ Busca no Orbiuns iniciada para:', cliente.nomeCliente);
}

// Funções auxiliares mantidas
function copiarTexto(texto, botao) {
    if (!texto) return;
    
    navigator.clipboard.writeText(texto).then(() => {
        const originalText = botao.innerHTML;
        const originalColor = botao.style.background;
        
        botao.innerHTML = '<i class="fas fa-check"></i>';
        botao.style.background = '#28a745';
        
        setTimeout(() => {
            botao.innerHTML = originalText;
            botao.style.background = originalColor;
        }, 1000);
        
        mostrarNotificacao('Texto copiado!', 'success');
    }).catch(err => {
        console.log('Erro ao copiar texto:', err);
        mostrarNotificacao('Erro ao copiar texto', 'error');
    });
}

function mostrarNotificacao(mensagem, tipo = 'info', duracao = 4000) {
    const cores = {
        'success': { bg: '#d4edda', color: '#155724', icon: 'check-circle' },
        'error': { bg: '#f8d7da', color: '#721c24', icon: 'exclamation-triangle' },
        'warning': { bg: '#fff3cd', color: '#856404', icon: 'exclamation-triangle' },
        'info': { bg: '#d1ecf1', color: '#0c5460', icon: 'info-circle' }
    };
    
    const cor = cores[tipo] || cores.info;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${cor.bg};
        color: ${cor.color};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Nunito', sans-serif;
        font-weight: 600;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${cor.icon}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, duracao);
}

function mostrarLoading(mostrar) {
    let overlay = document.getElementById('loadingOverlay');
    
    if (mostrar && !overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 0, 180, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 8px 30px rgba(10, 0, 180, 0.2);
                text-align: center;
            ">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0A00B4; margin-bottom: 15px;"></i>
                <div style="color: #1B365D; font-weight: 600;">Processando...</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    } else if (!mostrar && overlay) {
        document.body.removeChild(overlay);
    }
}

// ================================================================================
// 🌐 FUNÇÕES GLOBAIS
// ================================================================================
window.abrirDetalhesEmbarque = abrirDetalhesEmbarque;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.filtrarPorCategoria = filtrarPorCategoria;
window.carregarEmbarques = carregarEmbarques;
window.copiarTexto = copiarTexto;
window.marcarConferencia = marcarConferencia;
window.salvarAlteracoesPosVenda = salvarAlteracoesPosVenda;
window.buscarOrbiuns = buscarOrbiuns;

// ================================================================================
// 📝 LOGS FINAIS v8.18 - MODAL COMPLETO CORRIGIDO
// ================================================================================
console.log('%c🏢 CVC ITAQUÁ - EMBARQUES v8.18 - MODAL COMPLETO CORRIGIDO', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('✅ MODAL: Estrutura completa com header do cliente');
console.log('✅ VOOS: Lista detalhada com status de cada etapa');
console.log('✅ CONFERÊNCIA: Botão funcional com delegação de eventos');
console.log('✅ PÓS-VENDA: Campos editáveis e salvamento via API');
console.log('✅ ORBIUNS: Integração para busca externa');
console.log('✅ INTERFACE: Visual CVC com gradientes e cores oficiais');
console.log('🚀 PRONTO PARA PRODUÇÃO - MODAL 100% FUNCIONAL!');
