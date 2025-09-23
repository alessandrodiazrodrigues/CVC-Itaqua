// ================================================================================
// [MODULO] embarques-logic.js - Lógica do Dashboard de Embarques v8.06
// ================================================================================
// 🎯 Corrigido para sincronização completa com a API e mapeamento de dados.
// ================================================================================

// ================================================================================
// 🔧 CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ================================================================================
const API_URL = getApiUrl();
const CVC_CONFIG = getConfig();
const VENDEDORES = CVC_CONFIG.VENDEDORES;
const DATA_HOJE = new Date();

let embarquesData = [];
let embarquesFiltrados = [];
let vendedoresUnicos = new Set();
let embarquesAgrupados = new Map();
let embarquesRelacionados = [];
let stats = { conferencias: 0, checkins: 0, posVendas: 0, total: 0, concluidos: 0 };

// ================================================================================
// 🚀 FUNÇÃO DE INICIALIZAÇÃO E EVENTOS
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando embarques-logic.js...');
    obterConfiguracao();
    configurarEventos();
    carregarEmbarques();
});

function obterConfiguracao() {
    try {
        if (typeof CVC_CONFIG !== 'undefined' && CVC_CONFIG) {
            console.log('✅ Config.js carregado via CVC_CONFIG');
        } else {
            console.warn('⚠️ Config.js não encontrado, usando configuração fallback');
            API_URL = 'https://script.google.com/macros/s/AKfycbwSpsWw4eskLgAGPCWQ7X0q1emDfSyzWbS6nAT-7nHZHB63Hd4Q1IKWWeTsEQUnwVi3zQ/exec';
        }
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
// 📄 PROCESSAMENTO E CLASSIFICAÇÃO DOS DADOS
// ================================================================================
function processarDadosEmbarques(dados) {
    debugLog(`📄 Processando ${dados.length} registros...`, 'info');
    
    const embarquesProcessados = [];
    embarquesAgrupados.clear();
    vendedoresUnicos.clear();
    
    dados.forEach((embarque, index) => {
        try {
            if (!embarque || typeof embarque !== 'object' || !validarEmbarque(embarque)) {
                return;
            }
            
            embarque.id = embarque.id || `emb_${index + 1}`;
            embarque.diasParaVoo = calcularDiasParaVoo(embarque.dataIda);
            embarque.diasNumericos = calcularDiasNumericos(embarque.dataIda);
            embarque.categoria = classificarEmbarque(embarque).categoria;
            embarque.urgencia = classificarEmbarque(embarque).urgencia;
            
            if (embarque.vendedor) vendedoresUnicos.add(embarque.vendedor);
            
            if (embarque.numeroInforme && embarque.categoria !== 'concluido') {
                if (!embarquesAgrupados.has(embarque.numeroInforme)) {
                    embarquesAgrupados.set(embarque.numeroInforme, []);
                }
                embarquesAgrupados.get(embarque.numeroInforme).push(embarque);
            } else {
                embarquesProcessados.push(embarque);
            }
        } catch (error) {
            debugLog(`❌ Erro processando registro ${index + 1}: ${error.message}`, 'error');
        }
    });

    Array.from(embarquesAgrupados.values()).forEach(grupo => {
        const embarqueRepresentante = { ...grupo[0], voos: grupo, agrupado: true };
        embarquesProcessados.push(embarqueRepresentante);
    });
    
    return embarquesProcessados;
}

function classificarEmbarque(embarque) {
    if (embarque.posVendaFeita) return { categoria: 'concluido', urgencia: 'normal' };
    if (embarque.checkinFeito) return { categoria: 'concluido', urgencia: 'normal' };
    if (embarque.conferenciaFeita) return { categoria: 'concluido', urgencia: 'normal' };
  
    const dataVoo = parseData(embarque.dataIda);
    if (!dataVoo) {
        return { categoria: 'conferencia', urgencia: 'normal' };
    }
  
    const diffDias = calcularDiasNumericos(dataVoo);
    
    // PÓS-VENDA
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
    
    // CHECK-IN
    if (diffDias >= -1 && diffDias <= 3) {
        let urgencia = 'normal';
        if (diffDias <= 1) urgencia = 'urgente';
        else if (diffDias === 2) urgencia = 'alerta';
        return { categoria: 'checkin', urgencia };
    }
  
    // CONFERÊNCIA
    if (diffDias >= 4 && diffDias <= 12) {
        let urgencia = 'normal';
        if (diffDias >= 5 && diffDias <= 7) urgencia = 'alerta';
        else if (diffDias === 4) urgencia = 'urgente';
        return { categoria: 'conferencia', urgencia };
    }
    
    return { categoria: 'futuro', urgencia: 'normal' };
}

// ================================================================================
// 📊 RENDERIZAÇÃO DA INTERFACE E FILTROS
// ================================================================================
function renderizarEmbarques() {
    const filtroStatus = document.getElementById('filtroStatus').value;
    const embarquesParaRender = embarquesFiltrados.filter(e => {
        if (filtroStatus === 'concluido') return e.categoria === 'concluido';
        if (filtroStatus === '') return e.categoria !== 'concluido';
        return e.categoria === filtroStatus;
    });

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
    
    document.getElementById('badgeConferencias').textContent = listas.conferencia.length;
    document.getElementById('badgeCheckins').textContent = listas.checkin.length;
    document.getElementById('badgePosVendas').textContent = listas.posVenda.length;
    document.getElementById('badgeConcluidos').textContent = listas.concluido.length;
    
    atualizarEstatisticas(embarquesData);
}

function renderizarLista(containerId, embarques, categoria) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (embarques.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h5>Nenhum item encontrado</h5>
                <p>Nenhum embarque corresponde a este filtro.</p>
            </div>
        `;
        return;
    }
    
    embarques.sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));

    container.innerHTML = embarques.map(e => criarCardEmbarque(e, categoria)).join('');
}

function criarCardEmbarque(embarque, categoria) {
    const badgeClass = { 'conferencia': 'badge-conferencia', 'checkin': 'badge-checkin', 'pos-venda': 'badge-pos-venda', 'concluido': 'badge-conferido' };
    const badgeText = { 'conferencia': 'Conferência', 'checkin': 'Check-in', 'pos-venda': 'Pós-venda', 'concluido': 'Concluído' };
    const statusText = embarque.categoria === 'concluido' ? 'Concluído' : badgeText[categoria];
    const cardClass = embarque.urgencia || 'normal';

    return `
        <div class="embarque-card ${cardClass}" onclick="abrirDetalhesAgrupados('${embarque.numeroInforme || embarque.id}')">
            <div class="embarque-header">
                <h5 class="cliente-nome">${embarque.nomeCliente}</h5>
                <span class="status-badge ${badgeClass[categoria]}">${statusText}</span>
            </div>
            <div class="embarque-details">
                <p>Vendedor: ${embarque.vendedor}</p>
                <p>Data Voo: ${formatarData(embarque.dataIda)}</p>
                <p>Recibo: ${embarque.recibo || 'N/A'}</p>
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
    document.getElementById('badgeConferencias').textContent = stats.conferencias;
    document.getElementById('badgeCheckins').textContent = stats.checkins;
    document.getElementById('badgePosVendas').textContent = stats.posVendas;
}

// ================================================================================
// 📋 MODAL E LÓGICA DE AÇÕES
// ================================================================================
function abrirDetalhesAgrupados(idOuInforme) {
    embarquesRelacionados = embarquesData.filter(e => e.numeroInforme === idOuInforme || e.id === idOuInforme);
    if (embarquesRelacionados.length === 0) {
        mostrarNotificacao('Nenhum embarque encontrado.', 'warning');
        return;
    }
    
    const clientePrincipal = embarquesRelacionados[0];
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    const whatsappLink = clientePrincipal.whatsappCliente ? `https://wa.me/55${clientePrincipal.whatsappCliente.replace(/\D/g, '')}` : '#';
    const embarquesHtml = embarquesRelacionados.map((embarque, index) => {
      const dataConferenciaHtml = embarque.dataConferencia ? `
        <div class="info-item">
          <div class="info-label">Conferido em</div>
          <div class="info-value">${formatarData(embarque.dataConferencia)} por ${embarque.responsavelConferencia}</div>
        </div>
      ` : '';
      const dataCheckinHtml = embarque.dataCheckin ? `
        <div class="info-item">
          <div class="info-label">Check-in feito em</div>
          <div class="info-value">${formatarData(embarque.dataCheckin)} por ${embarque.responsavelCheckin}</div>
        </div>
      ` : '';
      const dataPosVendaHtml = embarque.dataPosVenda ? `
        <div class="info-item">
          <div class="info-label">Pós-venda feito em</div>
          <div class="info-value">${formatarData(embarque.dataPosVenda)} por ${embarque.responsavelPosVenda}</div>
        </div>
      ` : '';

      return `
        <div class="recibo-box">
          <div class="recibo-titulo">
            <i class="fas fa-receipt"></i> Recibo: ${embarque.recibo || 'N/A'}
          </div>
          <div class="info-section">
            <div class="info-title">
              <i class="fas fa-plane"></i> Voo ${index + 1} - ${formatarData(embarque.dataIda)}
            </div>
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Data de Ida</div><div class="info-value">${formatarData(embarque.dataIda)}</div></div>
              <div class="info-item"><div class="info-label">Data de Volta</div><div class="info-value">${formatarData(embarque.dataVolta) || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Tipo de Serviço</div><div class="info-value">${embarque.tipo || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Companhia Aérea</div><div class="info-value">${embarque.cia || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">Reserva</div><div class="info-value">${embarque.reserva || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">LOC GDS</div><div class="info-value">${embarque.locGds || 'N/A'}</div></div>
              <div class="info-item"><div class="info-label">LOC CIA</div><div class="info-value">${embarque.locCia || 'N/A'}</div></div>
            </div>
            ${dataConferenciaHtml}
            ${dataCheckinHtml}
            ${dataPosVendaHtml}
          </div>
        </div>
      `;
    }).join('');

    modalBody.innerHTML = `
      <div class="cliente-header">
        <div class="info-title">
          <i class="fas fa-user"></i> Dados do Cliente
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Nome</div><div class="info-value">${clientePrincipal.nomeCliente}</div></div>
          <div class="info-item"><div class="info-label">CPF</div><div class="info-value">${clientePrincipal.cpfCliente}</div></div>
          <div class="info-item"><div class="info-label">Vendedor</div><div class="info-value">${clientePrincipal.vendedor}</div></div>
          <div class="info-item"><div class="info-label">WhatsApp</div><div class="info-value">${clientePrincipal.whatsappCliente}</div></div>
          <div class="info-item"><div class="info-label">Cliente Ale</div><div class="info-value">${clientePrincipal.clienteAle}</div></div>
        </div>
      </div>
      <div class="info-section">
        <div class="info-title">
          <i class="fas fa-edit"></i> Campos Editáveis (Pós-venda)
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="editable-label">Observações</label>
            <textarea class="editable-field" id="observacoesEditaveis" rows="3">${clientePrincipal.observacoes}</textarea>
          </div>
          <div class="col-md-6">
            <label class="editable-label">Grupo Ofertas WhatsApp</label>
            <select class="editable-field" id="grupoOfertas">
              <option value="">Selecione...</option>
              <option value="Sim" ${clientePrincipal.grupoOfertas === 'Sim' ? 'selected' : ''}>Sim</option>
              <option value="Não" ${clientePrincipal.grupoOfertas === 'Não' ? 'selected' : ''}>Não</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="editable-label">Postou no Instagram</label>
            <select class="editable-field" id="postouInsta">
              <option value="">Selecione...</option>
              <option value="Sim" ${clientePrincipal.postouInsta === 'Sim' ? 'selected' : ''}>Sim</option>
              <option value="Não" ${clientePrincipal.postouInsta === 'Não' ? 'selected' : ''}>Não</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="editable-label">Avaliação Google</label>
            <select class="editable-field" id="avaliacaoGoogle">
              <option value="">Selecione...</option>
              <option value="Sim" ${clientePrincipal.avaliacaoGoogle === 'Sim' ? 'selected' : ''}>Sim</option>
              <option value="Não" ${clientePrincipal.avaliacaoGoogle === 'Não' ? 'selected' : ''}>Não</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="editable-label">SAC</label>
            <input type="text" class="editable-field" id="sacPosVenda" value="${clientePrincipal.sac || ''}" placeholder="Número do SAC">
          </div>
        </div>
      </div>
      ${embarquesHtml}
    `;

    const modalEl = document.getElementById('modalDetalhes');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Lógica para mudar o botão de marcar/desmarcar
    const btnMarcar = document.getElementById('btnMarcarConferido');
    if (btnMarcar) {
        if (clientePrincipal.conferenciaFeita) {
            btnMarcar.innerHTML = '<i class="fas fa-undo"></i> Desfazer Conferência';
            btnMarcar.classList.remove('btn-success');
            btnMarcar.classList.add('btn-warning');
        } else {
            btnMarcar.innerHTML = '<i class="fas fa-check"></i> Marcar como Conferido';
            btnMarcar.classList.remove('btn-warning');
            btnMarcar.classList.add('btn-success');
        }
    }
}

async function marcarComoConferido() {
    const clientePrincipal = embarquesRelacionados[0];
    const novoStatus = !clientePrincipal.conferenciaFeita;
    if (!confirm(`Deseja ${novoStatus ? 'marcar' : 'desmarcar'} a conferência para ${clientePrincipal.nomeCliente}?`)) return;

    try {
        const payload = {
            action: 'marcar_conferencia',
            cpf: clientePrincipal.cpfCliente,
            recibo: clientePrincipal.recibo,
            numeroInforme: clientePrincipal.numeroInforme,
            desfazer: !novoStatus
        };
        await chamarAPI(payload);
        mostrarNotificacao('Status atualizado com sucesso!', 'success');
        carregarEmbarques();
    } catch (error) {
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
    }
}

async function salvarAlteracoes() {
    const clientePrincipal = embarquesRelacionados[0];
    const dadosEditaveis = {
        observacoes: document.getElementById('observacoesEditaveis').value,
        grupoOfertas: document.getElementById('grupoOfertas').value,
        postouInsta: document.getElementById('postouInsta').value,
        avaliacaoGoogle: document.getElementById('avaliacaoGoogle').value,
        sac: document.getElementById('sacPosVenda').value
    };
    try {
        const payload = {
            action: 'marcar_pos_venda',
            cpf: clientePrincipal.cpfCliente,
            recibo: clientePrincipal.recibo,
            numeroInforme: clientePrincipal.numeroInforme,
            dadosEditaveis: dadosEditaveis,
            desfazer: false
        };
        await chamarAPI(payload);
        mostrarNotificacao('Alterações salvas com sucesso!', 'success');
        carregarEmbarques();
    } catch (error) {
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
    }
}

// ================================================================================
// 🌍 COMUNICAÇÃO COM API (Centralizada)
// ================================================================================
async function chamarAPI(payload) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Erro na API');
    return result;
}

// ================================================================================
// 🛠️ FUNÇÕES AUXILIARES
// ================================================================================
function validarEmbarque(e) { /* ... */ }
function parseData(dataStr) { /* ... */ }
function calcularDiasParaVoo(dataIda) { /* ... */ }
function calcularDiasNumericos(dataIda) { /* ... */ }
function formatarData(data) { /* ... */ }
function copiarTexto(texto) { /* ... */ }
function mostrarNotificacao(mensagem, tipo) { /* ... */ }
function debugLog(message, level, data) { /* ... */ }
