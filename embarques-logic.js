// ================================================================================
// [MODULO] embarques-logic.js - Lógica do Dashboard de Embarques v8.06
// ================================================================================
// 🎯 Versão completa funcional - sem dependências do embarques-main.js
// ================================================================================

// ================================================================================
// 🔧 CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ================================================================================
let API_URL = null;
// CVC_CONFIG já existe no config.js - não redeclarar
let VENDEDORES = [];

let embarquesData = [];
let embarquesFiltrados = [];
let vendedoresUnicos = new Set();
let embarquesAgrupados = new Map();
let embarquesRelacionados = [];
let stats = { conferencias: 0, checkins: 0, posVendas: 0, total: 0, concluidos: 0 };

const DATA_HOJE = new Date();

// ================================================================================
// 🚀 INICIALIZAÇÃO
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando embarques-logic.js v8.06...');
    obterConfiguracao();
    configurarEventos();
    carregarEmbarques();
});

function obterConfiguracao() {
    try {
        // Tentar obter via função getApiUrl
        if (typeof getApiUrl === 'function') {
            API_URL = getApiUrl();
            console.log('✅ Config.js carregado via função getApiUrl()');
        }
        // Tentar obter via CVC_CONFIG global
        else if (typeof CVC_CONFIG !== 'undefined' && CVC_CONFIG) {
            API_URL = CVC_CONFIG.API_URL;
            VENDEDORES = CVC_CONFIG.VENDEDORES || [];
            console.log('✅ Config.js carregado via CVC_CONFIG');
        }
        // Tentar obter via window.CVC_CONFIG
        else if (window.CVC_CONFIG) {
            API_URL = window.CVC_CONFIG.API_URL;
            VENDEDORES = window.CVC_CONFIG.VENDEDORES || [];
            console.log('✅ Config.js carregado via window.CVC_CONFIG');
        }
        
        // Fallback com configuração padrão
        if (!API_URL) {
            console.warn('⚠️ Config.js não encontrado, usando configuração fallback');
            API_URL = 'https://script.google.com/macros/s/AKfycbwSpsWw4eskLgAGPCWQ7X0q1emDfSyzWbS6nAT-7nHZHB63Hd4Q1IKWWeTsEQUnwVi3zQ/exec';
        }
        
        // Fallback para vendedores
        if (!VENDEDORES || VENDEDORES.length === 0) {
            VENDEDORES = ['Alessandro', 'Ana Paula', 'Adriana', 'Adrielly', 'Bia', 'Conceição', 'Jhully'];
            console.log('📋 Usando lista de vendedores fallback');
        }
        
        console.log('🔗 API URL configurada:', API_URL);
        console.log('👥 Vendedores carregados:', VENDEDORES.length);
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao obter configuração:', error);
        return false;
    }
}

function configurarEventos() {
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    const btnLimpar = document.getElementById('btnLimparFiltros');
    const btnRecarregar = document.getElementById('btnRecarregar');
    const navTabs = document.getElementById('navTabs');
    const btnMarcar = document.getElementById('btnMarcarConferido');
    const btnSalvar = document.getElementById('btnSalvarAlteracoes');
    const btnBuscar = document.getElementById('btnBuscarOrbiuns');

    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);
    if (btnRecarregar) btnRecarregar.addEventListener('click', carregarEmbarques);
    
    if (navTabs) {
        navTabs.addEventListener('click', (e) => {
            const target = e.target.closest('.nav-link');
            if (target) {
                const categoria = target.id.replace('tab-', '');
                filtrarPorCategoria(categoria);
            }
        });
    }

    if (btnMarcar) btnMarcar.addEventListener('click', marcarComoConferido);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarAlteracoes);
    if (btnBuscar) btnBuscar.addEventListener('click', buscarOrbiunsCliente);
}

// ================================================================================
// 📡 COMUNICAÇÃO COM API
// ================================================================================
async function chamarAPI(action, dados = {}) {
    try {
        mostrarLoading(true);
        
        const payload = {
            action: action,
            dados: dados
        };
        
        debugLog(`📡 Chamando API: ${action}`, 'info', payload);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        debugLog('📥 Resposta da API', 'success', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Erro na API');
        }
        
        return result;
        
    } catch (error) {
        debugLog(`❌ Erro na API: ${error.message}`, 'error');
        mostrarNotificacao(`Erro de conexão: ${error.message}`, 'error');
        throw error;
    } finally {
        mostrarLoading(false);
    }
}

async function carregarEmbarques() {
    try {
        debugLog('📋 Carregando embarques da planilha...', 'info');
        
        const resultado = await chamarAPI('listar_embarques');
        
        if (resultado.success && resultado.data && resultado.data.embarques) {
            embarquesData = processarDadosEmbarques(resultado.data.embarques);
            embarquesFiltrados = [...embarquesData];
            
            preencherFiltros();
            atualizarEstatisticas(embarquesData);
            renderizarEmbarques();
            
            debugLog(`✅ ${embarquesData.length} embarques carregados com sucesso`, 'success');
            mostrarNotificacao('Embarques carregados com sucesso!', 'success');
        } else {
            throw new Error('Dados de embarques não encontrados na resposta');
        }
        
    } catch (error) {
        debugLog(`❌ Erro ao carregar embarques: ${error.message}`, 'error');
        mostrarNotificacao('Erro ao carregar embarques: ' + error.message, 'error');
    }
}

// ================================================================================
// 📄 PROCESSAMENTO E CLASSIFICAÇÃO DOS DADOS
// ================================================================================
function processarDadosEmbarques(dados) {
    debugLog(`📄 Processando ${dados.length} registros...`, 'info');
    
    const embarquesProcessados = [];
    embarquesAgrupados.clear();
    vendedoresUnicos.clear();
    let rejeitados = 0;
    
    dados.forEach((embarque, index) => {
        try {
            if (!embarque || typeof embarque !== 'object' || !validarEmbarque(embarque)) {
                rejeitados++;
                return;
            }
            
            embarque.id = embarque.id || `emb_${index + 1}`;
            embarque.diasParaVoo = calcularDiasParaVoo(embarque.dataIda);
            embarque.diasNumericos = calcularDiasNumericos(embarque.dataIda);
            
            const classificacao = classificarEmbarque(embarque);
            embarque.categoria = classificacao.categoria;
            embarque.urgencia = classificacao.urgencia;
            
            if (embarque.vendedor) vendedoresUnicos.add(embarque.vendedor);
            
            if (embarque.numeroInforme && embarque.categoria !== 'concluido') {
                if (!embarquesAgrupados.has(embarque.numeroInforme)) {
                    embarquesAgrupados.set(embarque.numeroInforme, []);
                }
                embarquesAgrupados.get(embarque.numeroInforme).push(embarque);
            }
            
            embarquesProcessados.push(embarque);
            
        } catch (error) {
            debugLog(`❌ Erro processando registro ${index + 1}: ${error.message}`, 'error');
            rejeitados++;
        }
    });

    const taxaProcessamento = dados.length > 0 ? ((embarquesProcessados.length / dados.length) * 100).toFixed(1) : 0;
    debugLog(`✅ Processamento: ${embarquesProcessados.length}/${dados.length} (${taxaProcessamento}%)`, 'success');
    debugLog(`❌ Registros rejeitados: ${rejeitados}`, 'warn');
    
    return embarquesProcessados;
}

function validarEmbarque(embarque) {
    if (!embarque || typeof embarque !== 'object') return false;
    if (!embarque.nomeCliente || embarque.nomeCliente.length < 3) return false;
    if (!embarque.cpfCliente || embarque.cpfCliente.replace(/\D/g, '').length < 8) return false;
    if (!embarque.vendedor) return false;
    if (!embarque.dataIda) return false;
    if (embarque.situacao && embarque.situacao.toLowerCase().includes('cancelado')) return false;
    
    const vendedoresValidos = [
        'ADRIELLY', 'ALESSANDRO', 'ANA PAULA', 'CAROL', 'CAROLINY',
        'JHULY', 'DAINA', 'ELAINE', 'ILANA', 'BIA', 'CONCEIÇÃO',
        'CONCEICAO', 'ADRIANA', 'BEATRIZ', 'TESTE'
    ];
    
    const vendedorNorm = embarque.vendedor.toString().trim().toUpperCase();
    const vendedorValido = vendedoresValidos.some(v => 
        vendedorNorm.includes(v) || v.includes(vendedorNorm)
    );
    
    return vendedorValido;
}

function classificarEmbarque(embarque) {
    // Verificar se já está concluído
    if (embarque.posVendaFeita || embarque.checkinFeito || embarque.conferenciaFeita) {
        return { categoria: 'concluido', urgencia: 'normal' };
    }
    
    const dataVoo = parseData(embarque.dataIda);
    if (!dataVoo) {
        return { categoria: 'conferencia', urgencia: 'normal' };
    }
    
    const diffDias = calcularDiasNumericos(dataVoo);
    
    // PÓS-VENDA: 1 dia após retorno
    if (embarque.dataVolta) {
        const dataVolta = parseData(embarque.dataVolta);
        if (dataVolta && calcularDiasNumericos(dataVolta) < 0) {
            const diasAposRetorno = Math.abs(calcularDiasNumericos(dataVolta));
            let urgencia = 'normal';
            if (diasAposRetorno >= 1 && diasAposRetorno <= 5) urgencia = 'normal';
            else if (diasAposRetorno >= 6 && diasAposRetorno <= 10) urgencia = 'alerta';
            else if (diasAposRetorno >= 11) urgencia = 'urgente';
            return { categoria: 'pos-venda', urgencia };
        }
    }
    
    // CHECK-IN: 3 dias antes do voo
    if (diffDias >= -365 && diffDias <= 3) {
        let urgencia = 'normal';
        if (diffDias < 0) urgencia = 'urgente'; // ATRASO
        else if (diffDias === 3) urgencia = 'normal';
        else if (diffDias === 2) urgencia = 'alerta';
        else if (diffDias <= 1) urgencia = 'urgente';
        return { categoria: 'checkin', urgencia };
    }
    
    // CONFERÊNCIA: 4 a 12 dias antes
    if (diffDias >= 4 && diffDias <= 12) {
        let urgencia = 'normal';
        if (diffDias >= 8 && diffDias <= 12) urgencia = 'normal';
        else if (diffDias >= 5 && diffDias <= 7) urgencia = 'alerta';
        else if (diffDias === 4) urgencia = 'urgente';
        return { categoria: 'conferencia', urgencia };
    }
    
    // Muito distante - não mostrar
    return { categoria: 'futuro', urgencia: 'normal' };
}

// ================================================================================
// 📊 RENDERIZAÇÃO DA INTERFACE
// ================================================================================
function renderizarEmbarques() {
    const filtroStatus = document.getElementById('filtroStatus').value;
    
    let embarquesParaRender = embarquesFiltrados.filter(e => e && typeof e === 'object');
    
    // Filtrar por status se especificado
    if (filtroStatus === 'concluido') {
        embarquesParaRender = embarquesParaRender.filter(e => e.categoria === 'concluido');
    } else if (filtroStatus && filtroStatus !== 'concluido') {
        embarquesParaRender = embarquesParaRender.filter(e => e.categoria === filtroStatus && e.categoria !== 'concluido');
    } else if (!filtroStatus) {
        // Se não há filtro, não mostrar concluídos por padrão
        embarquesParaRender = embarquesParaRender.filter(e => e.categoria !== 'concluido');
    }
    
    const listas = {
        conferencia: embarquesParaRender.filter(e => e.categoria === 'conferencia'),
        checkin: embarquesParaRender.filter(e => e.categoria === 'checkin'), 
        posVenda: embarquesParaRender.filter(e => e.categoria === 'pos-venda'),
        concluido: embarquesParaRender.filter(e => e.categoria === 'concluido')
    };
    
    renderizarLista('listaConferencias', listas.conferencia, 'conferencia');
    renderizarLista('listaCheckins', listas.checkin, 'checkin');
    renderizarLista('listaPosVendas', listas.posVenda, 'pos-venda');
    renderizarLista('listaConcluidos', listas.concluido, 'concluido');
    
    // Atualizar badges
    document.getElementById('badgeConferencias').textContent = listas.conferencia.length;
    document.getElementById('badgeCheckins').textContent = listas.checkin.length;
    document.getElementById('badgePosVendas').textContent = listas.posVenda.length;
    document.getElementById('badgeConcluidos').textContent = listas.concluido.length;
}

function renderizarLista(containerId, embarques, categoria) {
    const container = document.getElementById(containerId);
    if (!container) {
        debugLog(`Container ${containerId} não encontrado`, 'error');
        return;
    }

    if (embarques.length === 0) {
        const mensagens = {
            'conferencia': 'Nenhuma conferência pendente (máximo 12 dias)',
            'checkin': 'Nenhum check-in próximo',
            'pos-venda': 'Nenhum pós-venda pendente',
            'concluido': 'Nenhum embarque concluído'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${categoria === 'conferencia' ? 'clipboard-check' : categoria === 'checkin' ? 'plane' : categoria === 'pos-venda' ? 'phone' : 'check-double'}"></i>
                <h5>${mensagens[categoria]}</h5>
                <small>Sistema v8.06 - Total processados: ${stats.total} embarques</small>
            </div>
        `;
        return;
    }
    
    // Ordenar embarques
    const embarquesOrdenados = [...embarques].sort((a, b) => {
        const diasA = a.diasNumericos || 999;
        const diasB = b.diasNumericos || 999;
        
        if (categoria === 'checkin') {
            // Check-in: ATRASO primeiro, depois cronológico
            if (diasA < 0 && diasB < 0) return diasA - diasB;
            if (diasA < 0 && diasB >= 0) return -1;
            if (diasA >= 0 && diasB < 0) return 1;
            return diasA - diasB;
        } else {
            // Outros: ordem crescente normal
            return diasA - diasB;
        }
    });

    container.innerHTML = embarquesOrdenados.map(e => criarCardEmbarque(e, categoria)).join('');
}

function criarCardEmbarque(embarque, categoria) {
    if (!embarque || typeof embarque !== 'object') {
        debugLog('Tentativa de criar card para embarque inválido', 'error');
        return '';
    }
    
    const badgeClass = {
        'conferencia': 'badge-conferencia',
        'checkin': 'badge-checkin', 
        'pos-venda': 'badge-pos-venda',
        'concluido': 'badge-conferido'
    };
    
    const badgeText = {
        'conferencia': 'Conferência',
        'checkin': 'Check-in',
        'pos-venda': 'Pós-venda', 
        'concluido': 'Concluído'
    };
    
    const urgenciaClass = embarque.urgencia || 'normal';
    const ledClass = urgenciaClass === 'normal' ? 'verde' : urgenciaClass === 'alerta' ? 'amarelo' : 'vermelho';
    
    const whatsappLink = embarque.whatsappCliente ? 
        `https://wa.me/55${embarque.whatsappCliente.replace(/\D/g, '')}` : '#';
    
    const clienteAleTag = embarque.clienteAle === 'Sim' ? 
        '<span class="cliente-ale-tag">Cliente Ale</span>' : '';
    
    // Texto de urgência para check-ins com atraso
    let urgenciaTexto = urgenciaClass === 'normal' ? 'Normal' : urgenciaClass === 'alerta' ? 'Cuidado' : 'URGENTE';
    if (categoria === 'checkin' && embarque.diasNumericos < 0) {
        urgenciaTexto = 'ATRASO';
    }
    
    return `
        <div class="embarque-card ${urgenciaClass}" data-embarque-id="${embarque.id}">
            <div class="led-urgencia ${ledClass}"></div>
            
            <div class="embarque-header">
                <div class="cliente-info">
                    <div class="cliente-nome">
                        ${embarque.nomeCliente || 'Nome não informado'}
                        ${clienteAleTag}
                    </div>
                    <div class="cliente-cpf">CPF: ${embarque.cpfCliente || 'Não informado'}</div>
                </div>
                <div class="status-badge ${badgeClass[categoria]}">
                    ${badgeText[categoria]}
                    <span class="urgencia-badge urgencia-${urgenciaClass}">
                        ${urgenciaTexto}
                    </span>
                </div>
            </div>
            
            <div class="embarque-details">
                <div class="detail-item">
                    <i class="fas fa-user-tie detail-icon"></i>
                    <span class="detail-label">Vendedor:</span>
                    <span class="detail-value">${embarque.vendedor || 'Não informado'}</span>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-calendar detail-icon"></i>
                    <span class="detail-label">Data do Voo:</span>
                    <span class="detail-value">${formatarData(embarque.dataIda)}</span>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-clock detail-icon"></i>
                    <span class="detail-label">Dias para Voo:</span>
                    <span class="detail-value">${embarque.diasParaVoo}</span>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-receipt detail-icon"></i>
                    <span class="detail-label">Recibo:</span>
                    <span class="detail-value">${embarque.recibo || 'N/A'}</span>
                    ${embarque.recibo ? `<button class="copy-button" onclick="copiarTexto('${embarque.recibo}', this)"><i class="fas fa-copy"></i></button>` : ''}
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-building detail-icon"></i>
                    <span class="detail-label">Nº Informe:</span>
                    <span class="detail-value">${embarque.numeroInforme || 'N/A'}</span>
                </div>
                
                <div class="detail-item">
                    <i class="fab fa-whatsapp detail-icon"></i>
                    <span class="detail-label">WhatsApp:</span>
                    <span class="detail-value">${embarque.whatsappCliente || 'N/A'}</span>
                    ${embarque.whatsappCliente ? `<button class="copy-button" onclick="copiarTexto('${embarque.whatsappCliente}', this)"><i class="fas fa-copy"></i></button>` : ''}
                </div>
            </div>
            
            ${embarque.observacoes ? `
                <div class="embarque-extras">
                    <div class="extras-title">Observações</div>
                    <div class="detail-value">${embarque.observacoes.substring(0, 150)}${embarque.observacoes.length > 150 ? '...' : ''}</div>
                </div>
            ` : ''}
            
            <div class="embarque-actions">
                ${embarque.whatsappCliente ? `
                    <a href="${whatsappLink}" target="_blank" class="btn btn-success btn-sm">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                ` : ''}
                
                <button class="btn btn-cvc-primary btn-sm" onclick="abrirDetalhesAgrupados('${embarque.numeroInforme || embarque.id}')">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
            </div>
        </div>
    `;
}

function atualizarEstatisticas(embarques) {
    const embarquesValidos = embarques.filter(e => e && typeof e === 'object');
    
    stats = {
        conferencias: embarquesValidos.filter(e => e.categoria === 'conferencia').length,
        checkins: embarquesValidos.filter(e => e.categoria === 'checkin').length,
        posVendas: embarquesValidos.filter(e => e.categoria === 'pos-venda').length,
        concluidos: embarquesValidos.filter(e => e.categoria === 'concluido').length,
        total: embarquesValidos.length
    };
    
    document.getElementById('statConferencias').textContent = stats.conferencias;
    document.getElementById('statCheckins').textContent = stats.checkins;
    document.getElementById('statPosVendas').textContent = stats.posVendas;
    document.getElementById('statTotal').textContent = stats.total;
}

function preencherFiltros() {
    const filtroVendedor = document.getElementById('filtroVendedor');
    
    if (!filtroVendedor) {
        debugLog('Elemento filtroVendedor não encontrado', 'error');
        return;
    }
    
    filtroVendedor.innerHTML = '<option value="">Todos os Vendedores</option>';
    
    const vendedoresParaUsar = vendedoresUnicos.size > 0 ? Array.from(vendedoresUnicos) : VENDEDORES;
    
    vendedoresParaUsar.sort().forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor;
        option.textContent = vendedor;
        filtroVendedor.appendChild(option);
    });
    
    debugLog(`✅ Filtro de vendedores preenchido com ${vendedoresParaUsar.length} opções`, 'success');
}

// ================================================================================
// 📋 MODAL E AÇÕES
// ================================================================================
function abrirDetalhesAgrupados(idOuInforme) {
    embarquesRelacionados = [];
    
    if (idOuInforme && idOuInforme !== 'undefined') {
        embarquesRelacionados = embarquesData.filter(e => 
            e && typeof e === 'object' && (
                e.numeroInforme === idOuInforme || 
                e.id === idOuInforme ||
                (e.cpfCliente && embarquesData.find(ref => ref && ref.numeroInforme === idOuInforme && ref.cpfCliente === e.cpfCliente))
            )
        );
    }
    
    if (embarquesRelacionados.length === 0) {
        mostrarNotificacao('Nenhum embarque encontrado para exibir detalhes.', 'warning');
        return;
    }
    
    const clientePrincipal = embarquesRelacionados[0];
    const modalBody = document.getElementById('modalBody');
    
    if (!modalBody) {
        debugLog('Modal body não encontrado', 'error');
        return;
    }
    
    // Agrupar por recibo
    const embarquesPorRecibo = new Map();
    embarquesRelacionados.forEach(embarque => {
        if (embarque && typeof embarque === 'object') {
            const recibo = embarque.recibo || 'Sem Recibo';
            if (!embarquesPorRecibo.has(recibo)) {
                embarquesPorRecibo.set(recibo, []);
            }
            embarquesPorRecibo.get(recibo).push(embarque);
        }
    });
    
    const whatsappLink = clientePrincipal.whatsappCliente ? 
        `https://wa.me/55${clientePrincipal.whatsappCliente.replace(/\D/g, '')}` : '#';
    
    modalBody.innerHTML = `
        <div class="cliente-header">
            <div class="info-title">
                <i class="fas fa-user"></i> Dados do Cliente
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Nome Completo</div>
                    <div class="info-value">${clientePrincipal.nomeCliente || 'Não informado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">CPF</div>
                    <div class="info-value">
                        ${clientePrincipal.cpfCliente || 'Não informado'}
                        ${clientePrincipal.cpfCliente ? `
                            <button class="copy-button" onclick="copiarTexto('${clientePrincipal.cpfCliente}', this)">
                                <i class="fas fa-copy"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">WhatsApp</div>
                    <div class="info-value">
                        ${clientePrincipal.whatsappCliente ? 
                            `<a href="${whatsappLink}" target="_blank" class="text-success">${clientePrincipal.whatsappCliente}</a>
                             <button class="copy-button" onclick="copiarTexto('${clientePrincipal.whatsappCliente}', this)">
                                 <i class="fas fa-copy"></i>
                             </button>` : 
                            'Não informado'
                        }
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Vendedor</div>
                    <div class="info-value">${clientePrincipal.vendedor || 'Não informado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Cliente Ale</div>
                    <div class="info-value">
                        <span class="badge ${clientePrincipal.clienteAle === 'Sim' ? 'bg-primary' : 'bg-secondary'}">
                            ${clientePrincipal.clienteAle || 'Não'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        ${Array.from(embarquesPorRecibo.entries()).map(([recibo, embarques]) => `
            <div class="recibo-box">
                <div class="recibo-titulo">
                    <i class="fas fa-receipt"></i> 
                    Recibo: ${recibo}
                    ${recibo !== 'Sem Recibo' ? `
                        <button class="copy-button" onclick="copiarTexto('${recibo}', this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    ` : ''}
                </div>
                
                ${embarques.map((embarque, index) => `
                    <div class="info-section">
                        <div class="info-title">
                            <i class="fas fa-plane"></i> Voo ${index + 1} - ${formatarData(embarque.dataIda)}
                        </div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Data de Ida</div>
                                <div class="info-value">${formatarData(embarque.dataIda)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Data de Volta</div>
                                <div class="info-value">${formatarData(embarque.dataVolta) || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Tipo de Serviço</div>
                                <div class="info-value">${embarque.tipo || embarque.tipoAereo || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Companhia Aérea</div>
                                <div class="info-value">${embarque.cia || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Reserva</div>
                                <div class="info-value">
                                    ${embarque.reserva || 'N/A'}
                                    ${embarque.reserva ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.reserva}', this)">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">LOC GDS</div>
                                <div class="info-value">
                                    ${embarque.locGds || 'N/A'}
                                    ${embarque.locGds ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.locGds}', this)">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">LOC CIA</div>
                                <div class="info-value">
                                    ${embarque.locCia || 'N/A'}
                                    ${embarque.locCia ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.locCia}', this)">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${embarque.observacoes ? `
                            <div class="mt-3">
                                <div class="info-label">Observações</div>
                                <div class="info-value">${embarque.observacoes}</div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div class="info-section">
            <div class="info-title">
                <i class="fas fa-edit"></i> Observações Editáveis
            </div>
            <div class="mt-3">
                <label class="editable-label">Observações</label>
                <textarea class="editable-field" id="observacoesEditaveis" rows="3" 
                          placeholder="Digite observações sobre a conferência...">
                </textarea>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-6">
                    <label class="editable-label">Grupo Ofertas WhatsApp</label>
                    <select class="editable-field" id="grupoOfertas">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="editable-label">Postou no Instagram</label>
                    <select class="editable-field" id="postouInsta">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-6">
                    <label class="editable-label">Avaliação Google</label>
                    <select class="editable-field" id="avaliacaoGoogle">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="editable-label">SAC</label>
                    <input type="text" class="editable-field" id="sacPosVenda" 
                           placeholder="Número do SAC">
                </div>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-title">
                <i class="fas fa-check-circle"></i> Status da Conferência
            </div>
            <div class="info-value">
                ${clientePrincipal.conferenciaFeita ? 
                    '<span class="badge bg-success">Conferência Concluída</span>' : 
                    '<span class="badge bg-warning">Aguardando Conferência</span>'
                }
            </div>
        </div>
    `;
    
    // Atualizar botão do modal
    const btnMarcarConferido = document.getElementById('btnMarcarConferido');
    if (btnMarcarConferido) {
        if (clientePrincipal.conferenciaFeita) {
            btnMarcarConferido.innerHTML = '<i class="fas fa-undo"></i> Desfazer Conferência';
            btnMarcarConferido.className = 'btn btn-warning';
        } else {
            btnMarcarConferido.innerHTML = '<i class="fas fa-check"></i> Marcar como Conferido';
            btnMarcarConferido.className = 'btn btn-success';
        }
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
    modal.show();
}

async function marcarComoConferido() {
    if (embarquesRelacionados.length === 0) {
        mostrarNotificacao('Nenhum embarque selecionado.', 'warning');
        return;
    }
    
    const clientePrincipal = embarquesRelacionados[0];
    const novoStatus = !clientePrincipal.conferenciaFeita;
    
    const confirmMessage = novoStatus ? 
        `Marcar conferência de ${clientePrincipal.nomeCliente} como concluída?` :
        `Desfazer conferência de ${clientePrincipal.nomeCliente}?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const btnMarcarConferido = document.getElementById('btnMarcarConferido');
    const originalText = btnMarcarConferido.innerHTML;
    
    try {
        btnMarcarConferido.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btnMarcarConferido.disabled = true;
        
        if (novoStatus) {
            const payload = {
                cpf: clientePrincipal.cpfCliente,
                recibo: clientePrincipal.recibo,
                numeroInforme: clientePrincipal.numeroInforme
            };
            
            const resultado = await chamarAPI('marcar_conferencia', payload);
            
            if (!resultado.success) {
                throw new Error(resultado.message || 'Erro ao atualizar planilha');
            }
        }
        
        // Atualizar dados localmente
        embarquesRelacionados.forEach(embarque => {
            if (embarque && typeof embarque === 'object') {
                embarque.conferenciaFeita = novoStatus;
                embarque.dataConferencia = novoStatus ? new Date().toLocaleString('pt-BR') : '';
                embarque.responsavelConferencia = novoStatus ? 'Dashboard v8.06' : '';
                
                // Atualizar nos dados principais
                const embarqueOriginal = embarquesData.find(e => e.id === embarque.id);
                if (embarqueOriginal) {
                    embarqueOriginal.conferenciaFeita = novoStatus;
                    embarqueOriginal.dataConferencia = embarque.dataConferencia;
                    embarqueOriginal.responsavelConferencia = embarque.responsavelConferencia;
                    
                    // Reclassificar se concluído
                    if (novoStatus) {
                        embarqueOriginal.categoria = 'concluido';
                    } else {
                        const novaClassificacao = classificarEmbarque(embarqueOriginal);
                        embarqueOriginal.categoria = novaClassificacao.categoria;
                        embarqueOriginal.urgencia = novaClassificacao.urgencia;
                    }
                }
            }
        });
        
        // Atualizar interface
        atualizarEstatisticas(embarquesData);
        renderizarEmbarques();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
        modal.hide();
        
        const statusText = novoStatus ? 'concluída' : 'desfeita';
        mostrarNotificacao(`Conferência ${statusText} e salva com sucesso!`, 'success');
        
        // Recarregar dados para sincronização
        setTimeout(() => {
            carregarEmbarques();
        }, 2000);
        
    } catch (error) {
        debugLog(`Erro ao marcar conferência: ${error.message}`, 'error');
        mostrarNotificacao('Erro ao salvar conferência: ' + error.message, 'error');
    } finally {
        btnMarcarConferido.innerHTML = originalText;
        btnMarcarConferido.disabled = false;
    }
}

async function salvarAlteracoes() {
    if (embarquesRelacionados.length === 0) return;
    
    const clientePrincipal = embarquesRelacionados[0];
    
    const dadosEditaveis = {
        observacoes: document.getElementById('observacoesEditaveis').value,
        grupoOfertas: document.getElementById('grupoOfertas').value,
        postouInsta: document.getElementById('postouInsta').value,
        avaliacaoGoogle: document.getElementById('avaliacaoGoogle').value,
        sac: document.getElementById('sacPosVenda').value
    };
    
    const btnSalvar = document.getElementById('btnSalvarAlteracoes');
    const originalText = btnSalvar.innerHTML;
    
    try {
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;
        
        // Salvar localmente
        embarquesRelacionados.forEach(embarque => {
            if (embarque && typeof embarque === 'object') {
                Object.assign(embarque, dadosEditaveis);
                
                // Atualizar nos dados principais
                const embarqueOriginal = embarquesData.find(e => e.id === embarque.id);
                if (embarqueOriginal) {
                    Object.assign(embarqueOriginal, dadosEditaveis);
                }
            }
        });
        
        // Tentar sincronizar com API
        try {
            await chamarAPI('marcar_pos_venda', {
                cpf: clientePrincipal.cpfCliente,
                recibo: clientePrincipal.recibo,
                numeroInforme: clientePrincipal.numeroInforme,
                dadosEditaveis: dadosEditaveis
            });
        } catch (apiError) {
            debugLog('Erro na sincronização com API (continuando):', apiError);
        }
        
        mostrarNotificacao('Alterações salvas com sucesso!', 'success');
        
    } catch (error) {
        debugLog(`Erro ao salvar: ${error.message}`, 'error');
        mostrarNotificacao('Erro ao salvar: ' + error.message, 'error');
    } finally {
        btnSalvar.innerHTML = originalText;
        btnSalvar.disabled = false;
    }
}

async function buscarOrbiunsCliente() {
    if (embarquesRelacionados.length === 0) return;
    
    const clientePrincipal = embarquesRelacionados[0];
    const btnBuscar = document.getElementById('btnBuscarOrbiuns');
    
    btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    btnBuscar.disabled = true;
    
    try {
        const result = await chamarAPI('buscar_orbiuns', {
            cpf: clientePrincipal.cpfCliente
        });
        
        if (result.success && result.data.orbiuns && result.data.orbiuns.length > 0) {
            mostrarOrbiunsEncontrados(result.data.orbiuns);
        } else {
            mostrarNotificacao('Nenhum Orbium encontrado para este cliente.', 'warning');
        }
        
    } catch (error) {
        debugLog(`Erro ao buscar Orbiuns: ${error.message}`, 'error');
        mostrarNotificacao('Erro ao buscar Orbiuns: ' + error.message, 'error');
    } finally {
        btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar Orbiuns';
        btnBuscar.disabled = false;
    }
}

function mostrarOrbiunsEncontrados(orbiuns) {
    const orbiunsHtml = orbiuns.map(orbium => `
        <div class="info-item">
            <div class="info-label">Orbium ${orbium.orbium}</div>
            <div class="info-value">
                Status: ${orbium.status}<br>
                Vendedor: ${orbium.vendedor}<br>
                ${orbium.observacoes ? 'Obs: ' + orbium.observacoes : ''}
            </div>
        </div>
    `).join('');
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML += `
        <div class="info-section">
            <div class="info-title">
                <i class="fas fa-clipboard-list"></i> Orbiuns Relacionados
            </div>
            <div class="info-grid">
                ${orbiunsHtml}
            </div>
        </div>
    `;
}

// ================================================================================
// 🔍 SISTEMA DE FILTROS
// ================================================================================
function aplicarFiltros() {
    const filtroVendedor = document.getElementById('filtroVendedor').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroClienteAle = document.getElementById('filtroClienteAle').value;
    const filtroCPF = document.getElementById('filtroCPF').value.replace(/\D/g, '');
    const filtroWhatsApp = document.getElementById('filtroWhatsApp').value.replace(/\D/g, '');
    const filtroRecibo = document.getElementById('filtroRecibo').value;
    const filtroReserva = document.getElementById('filtroReserva').value;
    const filtroLocGds = document.getElementById('filtroLocGds').value;
    const filtroLocCia = document.getElementById('filtroLocCia').value;
    const filtroDataInicio = document.getElementById('filtroDataInicio').value;
    const filtroDataCheckin = document.getElementById('filtroDataCheckin').value;
    
    embarquesFiltrados = embarquesData.filter(embarque => {
        if (!embarque || typeof embarque !== 'object') return false;
        
        if (filtroVendedor && !embarque.vendedor.includes(filtroVendedor)) {
            return false;
        }
        
        if (filtroStatus) {
            if (filtroStatus === 'concluido' && embarque.categoria !== 'concluido') {
                return false;
            } else if (filtroStatus !== 'concluido' && (embarque.categoria !== filtroStatus || embarque.categoria === 'concluido')) {
                return false;
            }
        }
        
        if (filtroClienteAle && embarque.clienteAle !== filtroClienteAle) {
            return false;
        }
        
        if (filtroCPF) {
            const cpfEmbarque = embarque.cpfCliente ? embarque.cpfCliente.replace(/\D/g, '') : '';
            if (!cpfEmbarque.includes(filtroCPF)) {
                return false;
            }
        }
        
        if (filtroWhatsApp) {
            const whatsappEmbarque = embarque.whatsappCliente ? embarque.whatsappCliente.replace(/\D/g, '') : '';
            if (!whatsappEmbarque.includes(filtroWhatsApp)) {
                return false;
            }
        }
        
        if (filtroRecibo) {
            const reciboEmbarque = embarque.recibo ? embarque.recibo.toString() : '';
            if (!reciboEmbarque.toLowerCase().includes(filtroRecibo.toLowerCase())) {
                return false;
            }
        }
        
        if (filtroReserva) {
            const reservaEmbarque = embarque.reserva ? embarque.reserva.toString() : '';
            if (!reservaEmbarque.toLowerCase().includes(filtroReserva.toLowerCase())) {
                return false;
            }
        }
        
        if (filtroLocGds) {
            const locGdsEmbarque = embarque.locGds ? embarque.locGds.toString() : '';
            if (!locGdsEmbarque.toLowerCase().includes(filtroLocGds.toLowerCase())) {
                return false;
            }
        }
        
        if (filtroLocCia) {
            const locCiaEmbarque = embarque.locCia ? embarque.locCia.toString() : '';
            if (!locCiaEmbarque.toLowerCase().includes(filtroLocCia.toLowerCase())) {
                return false;
            }
        }
        
        if (filtroDataInicio) {
            const dataInicio = new Date(filtroDataInicio);
            const dataEmbarque = parseData(embarque.dataIda);
            if (!dataEmbarque || dataEmbarque.toDateString() !== dataInicio.toDateString()) {
                return false;
            }
        }
        
        if (filtroDataCheckin) {
            const dataCheckin = new Date(filtroDataCheckin);
            const dataEmbarque = parseData(embarque.dataIda);
            if (!dataEmbarque) return false;
            
            const diffTime = dataEmbarque.getTime() - dataCheckin.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays !== 3) {
                return false;
            }
        }
        
        return true;
    });
    
    atualizarEstatisticas(embarquesFiltrados);
    renderizarEmbarques();
    
    debugLog(`🔍 Filtros aplicados: ${embarquesFiltrados.length} embarques`, 'info');
}

function limparFiltros() {
    document.getElementById('filtroVendedor').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroClienteAle').value = '';
    document.getElementById('filtroCPF').value = '';
    document.getElementById('filtroWhatsApp').value = '';
    document.getElementById('filtroRecibo').value = '';
    document.getElementById('filtroReserva').value = '';
    document.getElementById('filtroLocGds').value = '';
    document.getElementById('filtroLocCia').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataCheckin').value = '';
    
    embarquesFiltrados = [...embarquesData];
    atualizarEstatisticas(embarquesFiltrados);
    renderizarEmbarques();
    
    debugLog('🧹 Todos os filtros limpos', 'info');
}

function filtrarPorCategoria(categoria) {
    const tabs = document.querySelectorAll('#navTabs .nav-link');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabAtivo = document.getElementById(`tab-${categoria}`);
    if (tabAtivo) {
        tabAtivo.classList.add('active');
    }
    
    // Atualizar select de status
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) {
        if (categoria === 'concluido') {
            filtroStatus.value = 'concluido';
        } else {
            filtroStatus.value = categoria;
        }
        aplicarFiltros();
    }
}

// ================================================================================
// 🛠️ FUNÇÕES AUXILIARES
// ================================================================================
function parseData(dataStr) {
    if (!dataStr) return null;
    if (dataStr instanceof Date) return dataStr;
    
    const str = dataStr.toString();
    
    if (str.includes('/')) {
        const partes = str.split('/');
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]);
        }
    }
    
    return new Date(str);
}

function calcularDiasParaVoo(dataIda) {
    if (!dataIda) return 'N/A';
    
    try {
        const dataVoo = parseData(dataIda);
        if (!dataVoo || isNaN(dataVoo.getTime())) return 'N/A';
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataVoo.setHours(0, 0, 0, 0);
        
        const diffTime = dataVoo.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        if (diffDays > 0) return `${diffDays} dias`;
        return `${Math.abs(diffDays)} dias atrás`;
        
    } catch (error) {
        return 'N/A';
    }
}

function calcularDiasNumericos(dataIda) {
    if (!dataIda) return 999;
    
    try {
        const dataVoo = parseData(dataIda);
        if (!dataVoo || isNaN(dataVoo.getTime())) return 999;
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataVoo.setHours(0, 0, 0, 0);
        
        const diffTime = dataVoo.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
        
    } catch (error) {
        return 999;
    }
}

function formatarData(data) {
    if (!data) return 'N/A';
    
    try {
        const dataObj = parseData(data);
        if (!dataObj || isNaN(dataObj.getTime())) return 'N/A';
        
        return dataObj.toLocaleDateString('pt-BR');
    } catch (error) {
        return 'N/A';
    }
}

function copiarTexto(texto, botao) {
    if (!texto) return;
    
    navigator.clipboard.writeText(texto).then(() => {
        const originalText = botao.innerHTML;
        botao.innerHTML = '<i class="fas fa-check"></i>';
        botao.style.background = '#28a745';
        
        setTimeout(() => {
            botao.innerHTML = originalText;
            botao.style.background = '';
        }, 1000);
        
        mostrarNotificacao('Texto copiado!', 'success');
    }).catch(err => {
        debugLog('Erro ao copiar texto:', err);
    });
}

function mostrarNotificacao(mensagem, tipo = 'info', duracao = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duracao);
}

function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = mostrar ? 'flex' : 'none';
    }
}

function debugLog(message, level = 'info', data = null) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    if (data) {
        console.log(data);
    }
}

// ================================================================================
// 🌍 FUNÇÕES GLOBAIS (ACESSÍVEIS PELO HTML)
// ================================================================================
window.abrirDetalhesAgrupados = abrirDetalhesAgrupados;
window.marcarComoConferido = marcarComoConferido;
window.salvarAlteracoes = salvarAlteracoes;
window.buscarOrbiunsCliente = buscarOrbiunsCliente;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.filtrarPorCategoria = filtrarPorCategoria;
window.carregarEmbarques = carregarEmbarques;
window.copiarTexto = copiarTexto;

// ================================================================================
// 📝 LOGS INFORMATIVOS
// ================================================================================
console.log('%c🏢 CVC ITAQUÁ - CONTROLE DE EMBARQUES', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('%c📊 embarques-logic.js v8.06 carregado!', 'color: #FFE600; background: #0A00B4; padding: 4px 8px; font-weight: bold;');
console.log('🔧 Sistema totalmente funcional e independente');
console.log('🎯 Compatível com config.js e API v8.06');
