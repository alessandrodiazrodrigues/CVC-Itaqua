// ================================================================================
// 🏢 CVC PORTAL ITAQUÁ - EMBARQUES LOGIC v12.0 - DASHBOARD DE PRIORIDADES
// ================================================================================
// Sistema Inteligente de Agrupamento por Informe com Cores CVC
// Funcionalidades Essenciais:
// 1. Conferências (10 dias antes da primeira data)
// 2. Check-ins (2 dias antes de cada voo)
// 3. Pós-vendas (1 dia após retorno da data mais distante)
// ================================================================================

console.log('🏢 SYSTELOS TUR - Embarques v12.2 - Sistema Otimizado');

// ================================================================================
// 🎯 VARIÁVEIS GLOBAIS
// ================================================================================
let dadosEmbarques = [];
let dadosOriginais = [];
let filtrosAtivos = {};
let dashboardMode = true; // Novo: modo dashboard por padrão

// ================================================================================
// 🚀 INICIALIZAÇÃO
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Dashboard de Prioridades...');
    
    inicializarEventos();
    carregarEmbarques();
    configurarToggles();
    
    // Esconder loading após inicialização
    setTimeout(() => {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.style.display = 'none';
    }, 1000);
});

// ================================================================================
// 🎛️ CONFIGURAÇÃO DE EVENTOS
// ================================================================================
function inicializarEventos() {
    // Busca rápida
    document.getElementById('buscaRapida')?.addEventListener('input', debounce(buscarRapido, 300));
    document.getElementById('btnBuscar')?.addEventListener('click', buscarRapido);
    
    // Filtros rápidos
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => aplicarFiltroRapido(e.target.dataset.filter));
    });
    
    // Toggles
    document.getElementById('toggleFiltrosAvancados')?.addEventListener('click', toggleFiltrosAvancados);
    document.getElementById('toggleTraditionalView')?.addEventListener('click', toggleTraditionalView);
    
    // Botões de ação
    document.getElementById('btnRecarregar')?.addEventListener('click', recarregarDados);
    document.getElementById('btnAplicarFiltros')?.addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimparFiltros')?.addEventListener('click', limparFiltros);
    
    // Modal
    document.getElementById('btnMarcarConferido')?.addEventListener('click', marcarConferencia);
    document.getElementById('btnSalvarAlteracoes')?.addEventListener('click', salvarAlteracoesPosVenda);
    document.getElementById('btnBuscarOrbiuns')?.addEventListener('click', buscarOrbiuns);
}

function configurarToggles() {
    // Filtros avançados colapsados por padrão
    const filtrosAvancados = document.getElementById('filtrosAvancados');
    if (filtrosAvancados) {
        filtrosAvancados.classList.add('collapsed');
    }
    
    // Abas tradicionais colapsadas por padrão
    const traditionalContent = document.getElementById('traditionalContent');
    if (traditionalContent) {
        traditionalContent.classList.add('collapsed');
    }
}

// ================================================================================
// 🧠 LÓGICA DE PRIORIDADES - CORE DO SISTEMA
// ================================================================================

/**
 * 📋 Calcular status de conferência
 * Regra: Inicia 10 dias antes da primeira data do informe
 */
function calcularStatusConferencia(informe) {
    const hoje = new Date();
    const primeiraData = new Date(informe.dataPrimeiroVoo);
    const diasParaViagem = Math.ceil((primeiraData - hoje) / (1000 * 60 * 60 * 24));
    
    // Não mostra se ainda não iniciou o período
    if (diasParaViagem > 10) return null;
    
    // Já foi conferido
    if (informe.conferido) return null;
    
    // Status baseado na proximidade
    if (diasParaViagem < 0) return 'vencido';     // 🔴 VERMELHO - Já passou
    if (diasParaViagem <= 2) return 'urgente';   // 🔴 VERMELHO - 0-2 dias
    if (diasParaViagem <= 5) return 'importante'; // 🟡 AMARELO CVC - 3-5 dias  
    if (diasParaViagem <= 10) return 'normal';   // 🟢 VERDE CVC - 6-10 dias
    
    return null;
}

/**
 * ✈️ Calcular status de check-in
 * Regra: 2 dias antes de cada voo individual
 */
function calcularStatusCheckin(voo) {
    const hoje = new Date();
    const dataVoo = new Date(voo.dataIda);
    const diasParaVoo = Math.ceil((dataVoo - hoje) / (1000 * 60 * 60 * 24));
    
    // Não mostra se ainda não iniciou o período
    if (diasParaVoo > 2) return null;
    
    // Já foi feito check-in
    if (voo.checkedIn) return null;
    
    // Status baseado na proximidade
    if (diasParaVoo < 0) return 'vencido';     // 🔴 VERMELHO - Voo já passou
    if (diasParaVoo <= 1) return 'urgente';   // 🔴 VERMELHO - 0-1 dia
    if (diasParaVoo === 2) return 'importante'; // 🟡 AMARELO CVC - 2 dias
    
    return null;
}

/**
 * 📞 Calcular status de pós-venda
 * Regra: 1 dia após retorno da data mais distante do informe
 */
function calcularStatusPosVenda(informe) {
    const hoje = new Date();
    const ultimaData = new Date(informe.dataUltimoVoo);
    const diasAposRetorno = Math.ceil((hoje - ultimaData) / (1000 * 60 * 60 * 24));
    
    // Ainda não retornou
    if (diasAposRetorno < 1) return null;
    
    // Já foi feita pós-venda
    if (informe.posVendaFeita) return null;
    
    // Status baseado no tempo após retorno
    if (diasAposRetorno >= 11) return 'vencido';    // 🔴 VERMELHO - 11+ dias
    if (diasAposRetorno >= 6) return 'importante';  // 🟡 AMARELO CVC - 6-10 dias
    if (diasAposRetorno >= 1) return 'normal';      // 🟢 VERDE CVC - 1-5 dias
    
    return null;
}

/**
 * 🎯 Calcular prioridade máxima de um informe
 */
function calcularPrioridadeMaxima(informe) {
    let maxPrioridade = 0;
    
    // Verificar conferência
    const statusConferencia = calcularStatusConferencia(informe);
    if (statusConferencia === 'vencido' || statusConferencia === 'urgente') maxPrioridade = Math.max(maxPrioridade, 3);
    else if (statusConferencia === 'importante') maxPrioridade = Math.max(maxPrioridade, 2);
    else if (statusConferencia === 'normal') maxPrioridade = Math.max(maxPrioridade, 1);
    
    // Verificar check-ins de todos os voos
    informe.voos.forEach(voo => {
        const statusCheckin = calcularStatusCheckin(voo);
        if (statusCheckin === 'vencido' || statusCheckin === 'urgente') maxPrioridade = Math.max(maxPrioridade, 3);
        else if (statusCheckin === 'importante') maxPrioridade = Math.max(maxPrioridade, 2);
    });
    
    // Verificar pós-venda
    const statusPosVenda = calcularStatusPosVenda(informe);
    if (statusPosVenda === 'vencido' || statusPosVenda === 'urgente') maxPrioridade = Math.max(maxPrioridade, 3);
    else if (statusPosVenda === 'importante') maxPrioridade = Math.max(maxPrioridade, 2);
    else if (statusPosVenda === 'normal') maxPrioridade = Math.max(maxPrioridade, 1);
    
    // Retornar classe de prioridade
    if (maxPrioridade === 3) return 'vencido';
    if (maxPrioridade === 2) return 'importante';
    if (maxPrioridade === 1) return 'normal';
    return null;
}

// ================================================================================
// 📊 AGRUPAMENTO POR INFORME
// ================================================================================
function agruparPorInforme(dados) {
    const grupos = {};
    
    dados.forEach(item => {
        const numeroInforme = item.numeroInforme || 'SEM_INFORME';
        
        if (!grupos[numeroInforme]) {
            grupos[numeroInforme] = {
                numeroInforme: numeroInforme,
                clientePrincipal: item.nomeCliente || 'Cliente não informado',
                vendedor: item.vendedor || 'Vendedor não informado',
                voos: [],
                conferido: false,
                posVendaFeita: false,
                dataPrimeiroVoo: null,
                dataUltimoVoo: null,
                whatsapp: item.whatsapp || '',
                cpf: item.cpf || ''
            };
        }
        
        // Adicionar voo ao grupo
        grupos[numeroInforme].voos.push({
            id: item.id,
            dataIda: item.dataIda,
            origem: item.origem || '',
            destino: item.destino || '',
            cia: item.cia || '',
            voo: item.voo || '',
            checkedIn: item.checkedIn || false,
            posVendaData: item.posVendaData || null
        });
        
        // Atualizar status consolidados
        if (item.conferido) grupos[numeroInforme].conferido = true;
        if (item.posVendaFeita) grupos[numeroInforme].posVendaFeita = true;
        
        // Calcular primeira e última data
        const dataVoo = new Date(item.dataIda);
        if (!grupos[numeroInforme].dataPrimeiroVoo || dataVoo < new Date(grupos[numeroInforme].dataPrimeiroVoo)) {
            grupos[numeroInforme].dataPrimeiroVoo = item.dataIda;
        }
        if (!grupos[numeroInforme].dataUltimoVoo || dataVoo > new Date(grupos[numeroInforme].dataUltimoVoo)) {
            grupos[numeroInforme].dataUltimoVoo = item.dataIda;
        }
    });
    
    return Object.values(grupos);
}

// ================================================================================
// 🎨 RENDERIZAÇÃO DO DASHBOARD
// ================================================================================
function renderizarDashboard(informes) {
    // Dashboard renderizado
    
    // Separar por prioridade
    const vencidos = [];
    const urgentes = [];
    const importantes = [];
    const normais = [];
    
    informes.forEach(informe => {
        const prioridade = calcularPrioridadeMaxima(informe);
        
        if (prioridade === 'vencido') vencidos.push(informe);
        else if (prioridade === 'urgente') urgentes.push(informe);
        else if (prioridade === 'importante') importantes.push(informe);
        else if (prioridade === 'normal') normais.push(informe);
    });
    
    // Renderizar cada seção
    renderizarSecao('cardsVencidos', 'countVencidos', vencidos, 'vencido');
    renderizarSecao('cardsUrgentes', 'countUrgentes', urgentes, 'urgente');
    renderizarSecao('cardsImportantes', 'countImportantes', importantes, 'importante');
    renderizarSecao('cardsNormais', 'countNormais', normais, 'normal');
    
    // Atualizar estatísticas
    atualizarEstatisticas(vencidos.length + urgentes.length, importantes.length, normais.length);
    
    // Esconder seções vazias
    gerenciarVisibilidadeSecoes(vencidos, urgentes, importantes, normais);
}

function renderizarSecao(containerId, countId, informes, tipoStatus) {
    const container = document.getElementById(containerId);
    const countElement = document.getElementById(countId);
    
    if (!container) return;
    
    // Atualizar contador
    if (countElement) countElement.textContent = informes.length;
    
    if (informes.length === 0) {
        container.innerHTML = gerarEmptyState(tipoStatus);
        return;
    }
    
    // Gerar cards
    let html = '';
    informes.forEach(informe => {
        html += gerarCardInforme(informe, tipoStatus);
    });
    
    container.innerHTML = html;
    
    // Adicionar eventos aos botões
    adicionarEventosCards(container);
}

function gerarCardInforme(informe, tipoStatus) {
    const acoes = identificarAcoesPendentes(informe);
    
    return `
        <div class="action-card ${tipoStatus}" data-informe="${informe.numeroInforme}">
            <div class="card-header-info">
                <div class="informe-info">
                    <div class="informe-numero">${informe.numeroInforme}</div>
                    <div class="cliente-principal">${informe.clientePrincipal}</div>
                    <div class="vendedor-info">👤 ${informe.vendedor} | 📱 ${informe.whatsapp}</div>
                </div>
                <div class="status-badge ${tipoStatus}">
                    ${gerarTextoStatus(tipoStatus)}
                </div>
            </div>
            
            <div class="viagem-info">
                <strong>Viagem:</strong> ${gerarResumoViagem(informe.voos)}
                <br><strong>Período:</strong> ${formatarData(informe.dataPrimeiroVoo)} a ${formatarData(informe.dataUltimoVoo)}
            </div>
            
            ${acoes.map(acao => `
                <div class="acao-info ${acao.tipo}">
                    <div class="acao-tipo">${acao.icone} ${acao.titulo}</div>
                    <div class="acao-detalhes">${acao.detalhes}</div>
                </div>
            `).join('')}
            
            <div class="card-actions">
                ${gerarBotoesAcao(informe, acoes, tipoStatus)}
            </div>
        </div>
    `;
}

function identificarAcoesPendentes(informe) {
    const acoes = [];
    
    // Conferência
    const statusConferencia = calcularStatusConferencia(informe);
    if (statusConferencia) {
        const diasPara = Math.ceil((new Date(informe.dataPrimeiroVoo) - new Date()) / (1000 * 60 * 60 * 24));
        acoes.push({
            tipo: 'conferencia',
            icone: '📋',
            titulo: 'CONFERÊNCIA PENDENTE',
            detalhes: diasPara < 0 ? `Vencida há ${Math.abs(diasPara)} dias` : `Vence em ${diasPara} dias`,
            status: statusConferencia
        });
    }
    
    // Check-ins
    informe.voos.forEach(voo => {
        const statusCheckin = calcularStatusCheckin(voo);
        if (statusCheckin) {
            const diasPara = Math.ceil((new Date(voo.dataIda) - new Date()) / (1000 * 60 * 60 * 24));
            acoes.push({
                tipo: 'checkin',
                icone: '✈️',
                titulo: `CHECK-IN ${voo.origem}→${voo.destino}`,
                detalhes: diasPara < 0 ? `Voo há ${Math.abs(diasPara)} dias` : `Voo em ${diasPara} dias`,
                status: statusCheckin,
                vooId: voo.id
            });
        }
    });
    
    // Pós-venda
    const statusPosVenda = calcularStatusPosVenda(informe);
    if (statusPosVenda) {
        const diasApos = Math.ceil((new Date() - new Date(informe.dataUltimoVoo)) / (1000 * 60 * 60 * 24));
        acoes.push({
            tipo: 'pos-venda',
            icone: '📞',
            titulo: 'PÓS-VENDA PENDENTE',
            detalhes: `Retornou há ${diasApos} dias`,
            status: statusPosVenda
        });
    }
    
    return acoes;
}

function gerarBotoesAcao(informe, acoes, tipoStatus) {
    let botoes = '';
    
    // Botão principal baseado na ação mais urgente
    const acaoUrgente = acoes.find(a => a.status === 'vencido') || acoes.find(a => a.status === 'urgente') || acoes[0];
    
    if (acaoUrgente) {
        if (acaoUrgente.tipo === 'conferencia') {
            botoes += `<button class="btn-acao ${tipoStatus}" onclick="abrirModalConferencia('${informe.numeroInforme}')">
                <i class="fas fa-clipboard-check"></i> Fazer Conferência
            </button>`;
        } else if (acaoUrgente.tipo === 'checkin') {
            botoes += `<button class="btn-acao ${tipoStatus}" onclick="fazerCheckin('${acaoUrgente.vooId}')">
                <i class="fas fa-plane"></i> Fazer Check-in
            </button>`;
        } else if (acaoUrgente.tipo === 'pos-venda') {
            botoes += `<button class="btn-acao ${tipoStatus}" onclick="abrirModalPosVenda('${informe.numeroInforme}')">
                <i class="fas fa-phone"></i> Fazer Pós-venda
            </button>`;
        }
    }
    
    // Botões secundários
    botoes += `
        <button class="btn-acao secundario" onclick="abrirDetalhesInforme('${informe.numeroInforme}')">
            <i class="fas fa-eye"></i> Ver Detalhes
        </button>
        <button class="btn-acao secundario" onclick="ligarCliente('${informe.whatsapp}')">
            <i class="fas fa-phone"></i> Ligar
        </button>
    `;
    
    return botoes;
}

function gerarTextoStatus(status) {
    switch (status) {
        case 'vencido': return '🚨 VENCIDO';
        case 'urgente': return '🔥 URGENTE';
        case 'importante': return '⏰ IMPORTANTE';
        case 'normal': return '📅 NORMAL';
        default: return 'STATUS';
    }
}

function gerarResumoViagem(voos) {
    if (voos.length === 0) return 'Sem voos';
    if (voos.length === 1) return `${voos[0].origem}→${voos[0].destino}`;
    
    const origem = voos[0].origem;
    const destino = voos[voos.length - 1].destino;
    return `${origem}→${destino} (${voos.length} voos)`;
}

function gerarEmptyState(tipo) {
    const textos = {
        vencido: { icone: 'fas fa-check-circle text-success', texto: 'Nenhum item vencido! 🎉' },
        urgente: { icone: 'fas fa-clock text-warning', texto: 'Nenhuma ação urgente' },
        importante: { icone: 'fas fa-calendar-alt text-info', texto: 'Nenhuma ação importante' },
        normal: { icone: 'fas fa-list-alt text-muted', texto: 'Nenhuma ação programada' }
    };
    
    const config = textos[tipo] || textos.normal;
    
    return `
        <div class="empty-state">
            <i class="${config.icone}"></i>
            <p>${config.texto}</p>
        </div>
    `;
}

// ================================================================================
// 📊 ESTATÍSTICAS
// ================================================================================
function atualizarEstatisticas(urgentes, importantes, normais, total = null) {
    document.getElementById('statUrgente').textContent = urgentes;
    document.getElementById('statImportante').textContent = importantes;
    document.getElementById('statNormal').textContent = normais;
    
    // Calcular produtividade (mock)
    const totalAcoes = urgentes + importantes + normais;
    const produtividade = totalAcoes > 0 ? Math.round((normais / totalAcoes) * 100) : 100;
    document.getElementById('statProdutividade').textContent = `${produtividade}%`;
}

// ================================================================================
// 🔍 SISTEMA DE BUSCA E FILTROS
// ================================================================================
function buscarRapido() {
    const termo = document.getElementById('buscaRapida').value.toLowerCase().trim();
    
    if (termo === '') {
        renderizarDados(dadosOriginais);
        return;
    }
    
    const filtrados = dadosOriginais.filter(item => {
        return (
            (item.nomeCliente && item.nomeCliente.toLowerCase().includes(termo)) ||
            (item.cpf && item.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
            (item.numeroInforme && item.numeroInforme.includes(termo)) ||
            (item.recibo && item.recibo.includes(termo)) ||
            (item.whatsapp && item.whatsapp.replace(/\D/g, '').includes(termo.replace(/\D/g, '')))
        );
    });
    
    // Busca processada
    renderizarDados(filtrados);
}

function aplicarFiltroRapido(filtro) {
    // Atualizar visual dos filtros
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filtro}"]`).classList.add('active');
    
    let filtrados = dadosOriginais;
    
    switch (filtro) {
        case 'alessandro':
            filtrados = dadosOriginais.filter(item => 
                item.vendedor && item.vendedor.toLowerCase().includes('alessandro')
            );
            break;
        case 'ana-paula':
            filtrados = dadosOriginais.filter(item => 
                item.vendedor && item.vendedor.toLowerCase().includes('ana')
            );
            break;
        case 'hoje':
            filtrados = filtrarAcoesHoje();
            break;
        case 'vencidos':
            filtrados = filtrarVencidos();
            break;
        case 'urgentes':
            filtrados = filtrarUrgentes();
            break;
        case 'todos':
        default:
            filtrados = dadosOriginais;
            break;
    }
    
    // Filtro aplicado
    renderizarDados(filtrados);
}

function filtrarAcoesHoje() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return dadosOriginais.filter(item => {
        // Conferência vence hoje
        const diasParaConferencia = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaConferencia <= 0 && !item.conferido) return true;
        
        // Check-in é hoje
        const diasParaCheckin = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaCheckin <= 1 && !item.checkedIn) return true;
        
        return false;
    });
}

function filtrarVencidos() {
    const hoje = new Date();
    
    return dadosOriginais.filter(item => {
        // Conferência vencida
        const diasParaConferencia = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaConferencia < 0 && !item.conferido) return true;
        
        // Check-in vencido
        const diasParaCheckin = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaCheckin < 0 && !item.checkedIn) return true;
        
        // Pós-venda vencida (11+ dias)
        const diasAposRetorno = Math.ceil((hoje - new Date(item.dataIda)) / (1000 * 60 * 60 * 24));
        if (diasAposRetorno >= 11 && !item.posVendaFeita) return true;
        
        return false;
    });
}

function filtrarUrgentes() {
    const hoje = new Date();
    
    return dadosOriginais.filter(item => {
        // Conferência urgente (0-2 dias)
        const diasParaConferencia = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaConferencia >= 0 && diasParaConferencia <= 2 && !item.conferido) return true;
        
        // Check-in urgente (0-1 dia)
        const diasParaCheckin = Math.ceil((new Date(item.dataIda) - hoje) / (1000 * 60 * 60 * 24));
        if (diasParaCheckin >= 0 && diasParaCheckin <= 1 && !item.checkedIn) return true;
        
        return false;
    });
}

// ================================================================================
// 🎛️ TOGGLES E INTERFACE
// ================================================================================
function toggleFiltrosAvancados() {
    const filtros = document.getElementById('filtrosAvancados');
    const btn = document.getElementById('toggleFiltrosAvancados');
    
    if (filtros.classList.contains('collapsed')) {
        filtros.classList.remove('collapsed');
        btn.innerHTML = '<i class="fas fa-cog"></i> Ocultar Filtros';
    } else {
        filtros.classList.add('collapsed');
        btn.innerHTML = '<i class="fas fa-cog"></i> Filtros Avançados';
    }
}

function toggleTraditionalView() {
    const content = document.getElementById('traditionalContent');
    const btn = document.getElementById('toggleTraditionalView');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Abas Tradicionais';
    } else {
        content.classList.add('collapsed');
        btn.innerHTML = '<i class="fas fa-eye"></i> Mostrar Abas Tradicionais';
    }
}

function gerenciarVisibilidadeSecoes(vencidos, urgentes, importantes, normais) {
    // Mostrar/ocultar seções vazias
    document.getElementById('sectionVencidos').style.display = vencidos.length > 0 ? 'block' : 'none';
    document.getElementById('sectionUrgentes').style.display = urgentes.length > 0 ? 'block' : 'none';
    document.getElementById('sectionImportantes').style.display = importantes.length > 0 ? 'block' : 'none';
    document.getElementById('sectionNormais').style.display = normais.length > 0 ? 'block' : 'none';
}

// ================================================================================
// 🌐 CARREGAMENTO DE DADOS
// ================================================================================
async function carregarEmbarques() {
    try {
        console.log('🌐 Carregando dados dos embarques...');
        mostrarLoading(true);
        
        const url = `${getApiUrl()}?acao=listarEmbarques&callback=processarDadosEmbarques`;
        
        // Fazer requisição real para a API
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            console.error('❌ Erro ao carregar script da API');
            mostrarErro('Erro ao conectar com a API. Verifique a conexão.');
            mostrarLoading(false);
        };
        
        // Timeout para requisições muito lentas
        setTimeout(() => {
            if (document.getElementById('loadingOverlay').style.display !== 'none') {
                console.warn('⚠️ Requisição demorou mais que 30 segundos');
                mostrarErro('Requisição está demorando. Tente recarregar.');
            }
        }, 30000);
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('❌ Erro ao carregar embarques:', error);
        mostrarErro('Erro ao carregar dados. Tente novamente.');
        mostrarLoading(false);
    }
}

function processarDadosEmbarques(response) {
    console.log('📊 Processando dados recebidos...', response);
    
    mostrarLoading(false);
    
    if (response && response.dados && Array.isArray(response.dados)) {
        dadosOriginais = response.dados;
        dadosEmbarques = [...dadosOriginais];
        
        console.log(`✅ ${dadosEmbarques.length} embarques carregados`);
        
        if (dadosEmbarques.length > 0) {
            renderizarDados(dadosEmbarques);
            mostrarSucesso(`${dadosEmbarques.length} embarques carregados com sucesso!`);
        } else {
            console.log('ℹ️ Nenhum embarque encontrado');
            renderizarDashboardVazio();
        }
    } else if (response && response.erro) {
        console.error('❌ Erro retornado pela API:', response.erro);
        mostrarErro(`Erro da API: ${response.erro}`);
        renderizarDashboardVazio();
    } else {
        console.log('⚠️ Resposta inválida da API:', response);
        mostrarErro('Resposta inválida da API. Verifique a configuração.');
        renderizarDashboardVazio();
    }
}

function renderizarDashboardVazio() {
    console.log('📋 Renderizando dashboard vazio');
    
    // Limpar todas as seções
    const secoes = ['cardsVencidos', 'cardsUrgentes', 'cardsImportantes', 'cardsNormais'];
    secoes.forEach(secaoId => {
        const container = document.getElementById(secaoId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox text-muted"></i>
                    <p>Nenhum embarque encontrado</p>
                    <small>Verifique os filtros ou carregue novos dados</small>
                </div>
            `;
        }
    });
    
    // Zerar contadores
    const contadores = ['countVencidos', 'countUrgentes', 'countImportantes', 'countNormais'];
    contadores.forEach(contadorId => {
        const elemento = document.getElementById(contadorId);
        if (elemento) elemento.textContent = '0';
    });
    
    // Atualizar estatísticas
    atualizarEstatisticas(0, 0, 0);
    
    // Mostrar todas as seções (mesmo vazias)
    gerenciarVisibilidadeSecoes([], [], [], []);
}

function renderizarDados(dados) {
    console.log('🎨 Renderizando dados:', dados.length, 'itens');
    
    if (!dados || dados.length === 0) {
        renderizarDashboardVazio();
        renderizarAbasTradicinais([]);
        return;
    }
    
    // Agrupar por informe
    const informes = agruparPorInforme(dados);
    console.log('📊 Informes agrupados:', informes.length);
    
    // Renderizar dashboard
    renderizarDashboard(informes);
    
    // Renderizar abas tradicionais (se visíveis)
    renderizarAbasTradicinais(dados);
}

// ================================================================================
// 📱 AÇÕES DOS CARDS
// ================================================================================
function adicionarEventosCards(container) {
    // Eventos são adicionados via onclick inline para simplicidade
    // Em produção, seria melhor usar event delegation
}

function abrirModalConferencia(numeroInforme) {
    console.log('📋 Abrindo modal de conferência para informe:', numeroInforme);
    // Implementar modal de conferência
    alert(`Conferência do informe ${numeroInforme} - Em desenvolvimento`);
}

function fazerCheckin(vooId) {
    console.log('✈️ Fazendo check-in do voo:', vooId);
    // Implementar check-in
    alert(`Check-in do voo ${vooId} - Em desenvolvimento`);
}

function abrirModalPosVenda(numeroInforme) {
    console.log('📞 Abrindo modal de pós-venda para informe:', numeroInforme);
    // Implementar modal de pós-venda
    alert(`Pós-venda do informe ${numeroInforme} - Em desenvolvimento`);
}

function abrirDetalhesInforme(numeroInforme) {
    console.log('👁️ Abrindo detalhes do informe:', numeroInforme);
    // Implementar modal de detalhes
    alert(`Detalhes do informe ${numeroInforme} - Em desenvolvimento`);
}

function ligarCliente(whatsapp) {
    if (whatsapp) {
        const numeroLimpo = whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/55${numeroLimpo}`, '_blank');
    }
}

// ================================================================================
// 🔧 FUNÇÕES AUXILIARES
// ================================================================================
function formatarData(dateString) {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function mostrarErro(mensagem) {
    console.error('❌', mensagem);
    
    // Mostrar alerta visual
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i> ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function mostrarLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function mostrarSucesso(mensagem) {
    console.log('✅', mensagem);
    
    // Mostrar alerta de sucesso
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

function recarregarDados() {
    console.log('🔄 Recarregando dados...');
    
    // Limpar dados atuais
    dadosEmbarques = [];
    dadosOriginais = [];
    
    // Mostrar loading
    mostrarLoading(true);
    
    // Recarregar
    carregarEmbarques();
}

// ================================================================================
// 🔄 FUNÇÕES LEGADAS (COMPATIBILIDADE)
// ================================================================================
function renderizarAbasTradicinais(dados) {
    // Manter compatibilidade com sistema anterior
    console.log('📋 Renderizando abas tradicionais para compatibilidade');
    
    // Separar dados por tipo para as abas tradicionais
    const conferencias = dados.filter(item => {
        const statusConf = calcularStatusConferencia({
            dataPrimeiroVoo: item.dataIda,
            conferido: item.conferido
        });
        return statusConf !== null;
    });
    
    const checkins = dados.filter(item => {
        const statusCheck = calcularStatusCheckin({
            dataIda: item.dataIda,
            checkedIn: item.checkedIn
        });
        return statusCheck !== null;
    });
    
    const posVendas = dados.filter(item => {
        const statusPos = calcularStatusPosVenda({
            dataUltimoVoo: item.dataIda,
            posVendaFeita: item.posVendaFeita
        });
        return statusPos !== null;
    });
    
    const concluidos = dados.filter(item => 
        item.conferido && item.checkedIn && item.posVendaFeita
    );
    
    // Atualizar badges das abas tradicionais
    const badgeConferencias = document.getElementById('badgeConferencias');
    const badgeCheckins = document.getElementById('badgeCheckins');
    const badgePosVendas = document.getElementById('badgePosVendas');
    const badgeConcluidos = document.getElementById('badgeConcluidos');
    
    if (badgeConferencias) badgeConferencias.textContent = conferencias.length;
    if (badgeCheckins) badgeCheckins.textContent = checkins.length;
    if (badgePosVendas) badgePosVendas.textContent = posVendas.length;
    if (badgeConcluidos) badgeConcluidos.textContent = concluidos.length;
    
    // Renderizar listas tradicionais se necessário
    renderizarListaTradicional('listaConferencias', conferencias, 'conferencia');
    renderizarListaTradicional('listaCheckins', checkins, 'checkin');
    renderizarListaTradicional('listaPosVendas', posVendas, 'pos-venda');
    renderizarListaTradicional('listaConcluidos', concluidos, 'concluido');
}

function renderizarListaTradicional(containerId, dados, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (dados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h6>Nenhum item encontrado</h6>
                <small>Não há ${tipo}s pendentes no momento</small>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    dados.forEach(item => {
        html += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${item.nomeCliente || 'Cliente não informado'}</h6>
                        <p class="mb-1">
                            <small><strong>Informe:</strong> ${item.numeroInforme || 'N/A'}</small><br>
                            <small><strong>Vendedor:</strong> ${item.vendedor || 'N/A'}</small><br>
                            <small><strong>Data:</strong> ${formatarData(item.dataIda)}</small>
                        </p>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="abrirDetalhesInforme('${item.numeroInforme}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function aplicarFiltros() {
    console.log('🔍 Aplicando filtros avançados...');
    // Implementar filtros avançados
}

function limparFiltros() {
    console.log('🗑️ Limpando filtros...');
    document.getElementById('buscaRapida').value = '';
    aplicarFiltroRapido('todos');
}

function marcarConferencia() {
    console.log('✅ Marcando conferência...');
    // Implementar marcação de conferência
}

function salvarAlteracoesPosVenda() {
    console.log('💾 Salvando pós-venda...');
    // Implementar salvamento
}

function buscarOrbiuns() {
    console.log('🔍 Buscando orbiuns...');
    // Implementar busca de orbiuns
}

// ================================================================================
// 🌐 FUNÇÕES GLOBAIS EXPOSTAS
// ================================================================================
window.abrirModalConferencia = abrirModalConferencia;
window.fazerCheckin = fazerCheckin;
window.abrirModalPosVenda = abrirModalPosVenda;
window.abrirDetalhesInforme = abrirDetalhesInforme;
window.ligarCliente = ligarCliente;
window.carregarEmbarques = carregarEmbarques;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.marcarConferencia = marcarConferencia;
window.salvarAlteracoesPosVenda = salvarAlteracoesPosVenda;
window.buscarOrbiuns = buscarOrbiuns;

// ================================================================================
// 📝 LOGS FINAIS v12.0 - DASHBOARD COMPLETO
// ================================================================================
console.log('✅ SYSTELOS TUR - Embarques v12.2 carregado com sucesso');