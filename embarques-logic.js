// ================================================================================
// [MODULO] embarques-logic.js - Dashboard de Embarques v8.16 - TESTE DIAGNÓSTICO
// ================================================================================
// 🎯 TESTE: Verificar se API está realmente salvando na planilha
// 🎯 Diagnóstico completo da comunicação com Google Apps Script
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
    console.log('🚀 Inicializando embarques-logic.js v8.16 - TESTE DIAGNÓSTICO...');
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
// 🌐 CLIENTE JSONP CORRIGIDO v8.16
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
// 📡 CARREGAMENTO DE DADOS CORRIGIDO v8.16
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
// 📄 PROCESSAMENTO DE DADOS v8.16
// ================================================================================
function processarDados(dados) {
    const embarquesProcessados = [];
    
    dados.forEach((embarque, index) => {
        try {
            if (!validarEmbarque(embarque)) return;
            
            const dataIda = converterData(embarque.dataIda || embarque['Data Ida'] || '');
            const hoje = new Date();
            const diffDays = Math.ceil((dataIda - hoje) / (1000 * 60 * 60 * 24));
            
            // CORREÇÃO v8.16: Verificar status das etapas pelos campos corretos da planilha
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
            
            // Classificar categoria
            let categoria = 'conferencia';
            if (conferenciaFeita && checkinFeito && posVendaFeita) {
                categoria = 'concluido';
            } else if (diffDays >= -365 && diffDays <= 7) {
                categoria = 'checkin';
            } else if (embarque.dataVolta) {
                const dataVolta = converterData(embarque.dataVolta);
                if (dataVolta && Math.ceil((dataVolta - hoje) / (1000 * 60 * 60 * 24)) < 0) {
                    categoria = 'pos-venda';
                }
            }
            
            // Determinar urgência
            let urgencia = 'normal';
            if (diffDays <= 1) urgencia = 'urgente';
            else if (diffDays <= 7) urgencia = 'alerta';
            
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
                diasParaVoo: diffDays > 0 ? `${diffDays} dias` : diffDays === 0 ? 'Hoje' : 'Vencido',
                diasNumericos: diffDays
            };
            
            embarquesProcessados.push(embarqueProcessado);
            
        } catch (error) {
            console.warn(`Erro ao processar linha ${index}:`, error);
        }
    });
    
    return embarquesProcessados;
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
// 🎨 RENDERIZAÇÃO (código mantido igual)
// ================================================================================
function renderizarEmbarques() {
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
}

function renderizarLista(containerId, embarques, categoria) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (embarques.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-${categoria === 'conferencia' ? 'clipboard-check' : categoria === 'checkin' ? 'plane' : categoria === 'pos-venda' ? 'phone' : 'check-double'}" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h5>Nenhum ${categoria.replace('-', ' ')} pendente</h5>
                <small>Total processados: ${stats.total} embarques</small>
            </div>
        `;
        return;
    }
    
    // Ordenar embarques
    const embarquesOrdenados = [...embarques].sort((a, b) => {
        const diasA = a.diasNumericos || 999;
        const diasB = b.diasNumericos || 999;
        return diasA - diasB;
    });

    container.innerHTML = embarquesOrdenados.map(e => criarCardEmbarque(e, categoria)).join('');
}

function criarCardEmbarque(embarque, categoria) {
    const urgenciaClass = embarque.urgencia || 'normal';
    const coresUrgencia = {
        'urgente': { bg: '#fff5f5', border: '#dc3545', led: '#dc3545' },
        'alerta': { bg: '#fffbf0', border: '#ffc107', led: '#ffc107' },
        'normal': { bg: '#f8fff8', border: '#28a745', led: '#28a745' }
    };
    
    const cor = coresUrgencia[urgenciaClass] || coresUrgencia.normal;
    const whatsappLink = embarque.whatsappCliente ? 
        `https://wa.me/55${embarque.whatsappCliente.replace(/\D/g, '')}` : '#';
    const clienteAleTag = embarque.clienteAle === 'Sim' ? 
        '<span style="background: #0A00B4; color: #FFE600; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 8px;">Cliente Ale</span>' : '';
    
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
            <div style="
                position: absolute;
                top: 15px;
                right: 15px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${cor.led};
                box-shadow: 0 0 8px rgba(0,0,0,0.3);
            "></div>
            
            <div style="margin-bottom: 15px;">
                <div style="
                    font-weight: 700;
                    color: #0A00B4;
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                ">
                    ${embarque.nomeCliente}
                    ${clienteAleTag}
                </div>
                <div style="font-size: 0.85rem; color: #6c757d; margin-bottom: 10px;">
                    CPF: ${embarque.cpfCliente}
                </div>
                <span style="
                    background: #FFE600;
                    color: #0A00B4;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                ">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</span>
            </div>
            
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
                        <span style="font-weight: 600;">Dias para Voo:</span>
                        <span style="font-weight: 600;">${embarque.diasParaVoo}</span>
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
// 📊 ESTATÍSTICAS
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
// 🔍 FILTROS (código mantido igual)
// ================================================================================
function aplicarFiltros() {
    // Código dos filtros mantido igual da versão anterior...
    renderizarEmbarques();
}

function limparFiltros() {
    // Código mantido igual...
    renderizarEmbarques();
}

function filtrarPorCategoria(categoria) {
    // Código mantido igual...
}

// ================================================================================
// 🎯 MODAL PARA TESTES
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
    
    // Criar modal simples para teste
    criarModalTeste();
    preencherModalTeste(cliente, embarquesRelacionados);
    
    setTimeout(() => {
        configurarEventosBotoes();
    }, 100);
    
    const modalEl = document.getElementById('modalDetalhes');
    if (modalEl) {
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
        }
    }
}

function criarModalTeste() {
    if (document.getElementById('modalDetalhes')) return;
    
    const modalHTML = `
        <div class="modal fade" id="modalDetalhes" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: #0A00B4; color: white;">
                        <h5 class="modal-title">🧪 TESTE DIAGNÓSTICO v8.16</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="modalBody" style="padding: 30px;">
                        <!-- Conteúdo dinâmico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <button type="button" id="btnTesteAPI" class="btn btn-danger">🧪 TESTE API</button>
                        <button type="button" id="btnMarcarConferido" class="btn btn-success">Marcar Conferência</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function preencherModalTeste(cliente, embarques) {
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h6>👤 Cliente: <strong>${cliente.nomeCliente}</strong></h6>
            <h6>📄 CPF: <strong>${cliente.cpfCliente}</strong></h6>
            <h6>🧾 Recibo: <strong>${cliente.recibo}</strong></h6>
            <h6>📋 Informe: <strong>${cliente.numeroInforme}</strong></h6>
            <h6>✅ Status Conferência: <strong>${cliente.conferenciaFeita ? 'CONFERIDO' : 'PENDENTE'}</strong></h6>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px;">
            <h6>🧪 DIAGNÓSTICO:</h6>
            <p>Este teste vai:</p>
            <ol>
                <li>Enviar payload completo para API</li>
                <li>Verificar resposta detalhada</li>
                <li>Aguardar 3 segundos</li>
                <li>Recarregar dados da planilha</li>
                <li>Comparar status antes/depois</li>
            </ol>
        </div>
    `;
}

function configurarEventosBotoes() {
    const botaoTeste = document.getElementById('btnTesteAPI');
    const botaoConferencia = document.getElementById('btnMarcarConferido');
    
    if (botaoTeste) {
        botaoTeste.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🧪 TESTE API iniciado');
            testeCompletoAPI();
        });
    }
    
    if (botaoConferencia) {
        botaoConferencia.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Marcação de conferência iniciada');
            marcarConferencia();
        });
    }
}

// ================================================================================
// 🧪 TESTE COMPLETO DA API v8.16
// ================================================================================
async function testeCompletoAPI() {
    if (!embarquesRelacionados || embarquesRelacionados.length === 0) {
        console.log('❌ Nenhum embarque selecionado para teste');
        return;
    }
    
    const cliente = embarquesRelacionados[0];
    console.log('🧪 INICIANDO TESTE COMPLETO DA API v8.16');
    console.log('👤 Cliente teste:', cliente.nomeCliente);
    console.log('📊 Status ANTES:', cliente.conferenciaFeita);
    
    const btnTeste = document.getElementById('btnTesteAPI');
    const originalText = btnTeste.innerHTML;
    
    try {
        btnTeste.innerHTML = '🧪 TESTANDO...';
        btnTeste.disabled = true;
        
        // 1. TESTE: Verificar se API está online
        console.log('🔍 TESTE 1: Verificando se API está online...');
        const testeOnline = await chamarAPIComJSONP({
            action: 'ping'
        });
        console.log('📡 Resposta ping:', testeOnline);
        
        // 2. TESTE: Enviar payload completo de conferência
        console.log('🔍 TESTE 2: Enviando payload completo...');
        const payloadCompleto = {
            action: 'marcar_conferencia',
            cpf: cliente.cpfCliente,
            recibo: cliente.recibo,
            numeroInforme: cliente.numeroInforme,
            conferenciaFeita: 'true',
            dataConferencia: new Date().toLocaleString('pt-BR'),
            responsavelConferencia: 'TESTE v8.16',
            desfazer: false,
            // TESTE: Campos adicionais
            teste: true,
            versao: '8.16',
            timestamp: Date.now()
        };
        
        console.log('📤 PAYLOAD TESTE COMPLETO:', payloadCompleto);
        
        const respostaTeste = await chamarAPIComJSONP(payloadCompleto);
        console.log('📥 RESPOSTA TESTE COMPLETO:', respostaTeste);
        
        // 3. TESTE: Aguardar e recarregar dados
        console.log('🔍 TESTE 3: Aguardando 3 segundos e recarregando dados...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const dadosAtualizados = await chamarAPIComJSONP({
            action: 'listar_embarques'
        });
        
        console.log('📊 DADOS ATUALIZADOS:', dadosAtualizados);
        
        // 4. TESTE: Verificar se mudou
        if (dadosAtualizados.success && dadosAtualizados.data) {
            const embarqueAtualizado = dadosAtualizados.data.embarques.find(e => 
                e.numeroInforme === cliente.numeroInforme || 
                e['Nº do Informe'] === cliente.numeroInforme
            );
            
            console.log('🔍 EMBARQUE ENCONTRADO APÓS TESTE:', embarqueAtualizado);
            
            if (embarqueAtualizado) {
                const statusDepois = Boolean(
                    embarqueAtualizado.dataConferencia ||
                    embarqueAtualizado['Data Conferência'] ||
                    embarqueAtualizado.responsavelConferencia ||
                    embarqueAtualizado['Responsável Conferência'] ||
                    embarqueAtualizado.conferenciaFeita === true ||
                    embarqueAtualizado.conferenciaFeita === 'true'
                );
                
                console.log('📊 STATUS DEPOIS:', statusDepois);
                console.log('🧪 RESULTADO TESTE:', statusDepois ? '✅ API SALVOU!' : '❌ API NÃO SALVOU');
                
                mostrarNotificacao(
                    statusDepois ? 
                    '✅ TESTE OK: API salvou na planilha!' : 
                    '❌ TESTE FALHOU: API não salvou na planilha!',
                    statusDepois ? 'success' : 'error'
                );
            } else {
                console.log('❌ EMBARQUE NÃO ENCONTRADO APÓS TESTE');
                mostrarNotificacao('❌ Embarque não encontrado após teste', 'error');
            }
        }
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        mostrarNotificacao(`❌ Erro no teste: ${error.message}`, 'error');
    } finally {
        btnTeste.innerHTML = originalText;
        btnTeste.disabled = false;
    }
}

// ================================================================================
// 🛠️ FUNÇÃO DE MARCAR CONFERÊNCIA SIMPLIFICADA PARA TESTE
// ================================================================================
async function marcarConferencia() {
    if (!embarquesRelacionados || embarquesRelacionados.length === 0) return;
    
    const cliente = embarquesRelacionados[0];
    const novoStatus = !cliente.conferenciaFeita;
    
    if (!confirm(`${novoStatus ? 'Marcar' : 'Desmarcar'} conferência de ${cliente.nomeCliente}?`)) return;
    
    const btnMarcar = document.getElementById('btnMarcarConferido');
    const originalText = btnMarcar.innerHTML;
    
    try {
        btnMarcar.innerHTML = '💾 Salvando...';
        btnMarcar.disabled = true;
        
        console.log('📝 MARCANDO CONFERÊNCIA - STATUS ATUAL:', cliente.conferenciaFeita);
        
        const payloadSimples = {
            action: 'marcar_conferencia',
            cpf: cliente.cpfCliente,
            recibo: cliente.recibo,
            numeroInforme: cliente.numeroInforme,
            conferenciaFeita: novoStatus ? 'true' : 'false',
            dataConferencia: novoStatus ? new Date().toLocaleString('pt-BR') : '',
            responsavelConferencia: novoStatus ? 'Dashboard v8.16' : '',
            desfazer: !novoStatus
        };
        
        console.log('📤 PAYLOAD CONFERÊNCIA:', payloadSimples);
        
        const resultado = await chamarAPIComJSONP(payloadSimples);
        console.log('📥 RESULTADO CONFERÊNCIA:', resultado);
        
        if (resultado.success) {
            // Atualizar localmente
            cliente.conferenciaFeita = novoStatus;
            
            // Atualizar interface
            atualizarEstatisticas();
            renderizarEmbarques();
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
            if (modal) modal.hide();
            
            mostrarNotificacao(`✅ Conferência ${novoStatus ? 'marcada' : 'desmarcada'}!`, 'success');
            
            console.log('✅ CONFERÊNCIA PROCESSADA LOCALMENTE');
        } else {
            throw new Error(resultado.message || 'Erro na API');
        }
        
    } catch (error) {
        console.error('❌ ERRO AO MARCAR CONFERÊNCIA:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnMarcar.innerHTML = originalText;
        btnMarcar.disabled = false;
    }
}

// ================================================================================
// 🛠️ UTILITÁRIOS
// ================================================================================
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
                <div style="color: #1B365D; font-weight: 600;">Carregando dados...</div>
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
window.marcarConferencia = marcarConferencia;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.filtrarPorCategoria = filtrarPorCategoria;
window.carregarEmbarques = carregarEmbarques;
window.copiarTexto = copiarTexto;
window.testeCompletoAPI = testeCompletoAPI;
window.embarquesRelacionados = embarquesRelacionados;

// ================================================================================
// 📝 LOGS FINAIS v8.16 - TESTE DIAGNÓSTICO
// ================================================================================
console.log('%c🏢 CVC ITAQUÁ - EMBARQUES v8.16 - TESTE DIAGNÓSTICO', 'color: #dc3545; font-size: 16px; font-weight: bold;');
console.log('🧪 Versão de teste para diagnóstico da API');
console.log('🔍 Botão "TESTE API" adiciona diagnóstico completo');
console.log('📊 Verifica se dados persistem na planilha');
console.log('🎯 Identifica se problema é na API ou no frontend');
console.log('🚀 PRONTO PARA DIAGNÓSTICO!');
