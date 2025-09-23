// ================================================================================
// [MODULO] embarques-logic.js - Lógica do Dashboard de Embarques
// ================================================================================

// ================================================================================
// 🔧 CONFIGURAÇÃO SEGURA v8.05
// ================================================================================
const API_URL = getApiUrl();
const CVC_CONFIG = getConfig();
const VENDEDORES = CVC_CONFIG.VENDEDORES;
const DATA_HOJE = new Date(); // Usar a data atual do cliente para cálculos

// ================================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ================================================================================
let embarquesData = [];
let embarquesFiltrados = [];
let vendedoresUnicos = new Set();
let embarquesRelacionados = [];
let stats = { checkins: 0, conferencias: 0, posVendas: 0, total: 0 };
let limiteRegistros = 20;

// ================================================================================
// 📄 PROCESSAMENTO DE DADOS COM VERIFICAÇÃO ROBUSTA
// ================================================================================
function processarDadosEmbarques(dados) {
  debugLog(`📄 Processando ${dados.length} registros...`, 'info');
  
  const embarquesProcessados = [];
  const informesAgrupados = new Map();
  let rejeitados = 0;
  vendedoresUnicos.clear();
  
  dados.forEach((embarque, index) => {
    try {
      if (!embarque || typeof embarque !== 'object') {
        rejeitados++;
        return;
      }
      
      embarque.id = embarque.id || `embarque_${index}`;
      embarque.diasParaVoo = calcularDiasParaVoo(embarque.dataIda);
      embarque.diasNumericos = calcularDiasNumericos(embarque.dataIda);
      
      const classificacao = classificarEmbarque(embarque);
      
      if (classificacao && classificacao.categoria) {
        embarque.categoria = classificacao.categoria;
        embarque.urgencia = classificacao.urgencia;

        if (embarque.vendedor) vendedoresUnicos.add(embarque.vendedor);

        // Agrupar por numeroInforme para a visualização dos cards
        if (embarque.numeroInforme && embarque.categoria !== 'concluido') {
          if (!informesAgrupados.has(embarque.numeroInforme)) {
            informesAgrupados.set(embarque.numeroInforme, []);
          }
          informesAgrupados.get(embarque.numeroInforme).push(embarque);
        } else {
          // Adicionar embarques sem informe diretamente à lista
          embarquesProcessados.push(embarque);
        }
      } else {
        rejeitados++;
      }
      
    } catch (error) {
      debugLog(`❌ Erro processando registro ${index + 1}: ${error.message}`, 'error');
      rejeitados++;
    }
  });

  // Juntar os embarques agrupados com os não agrupados
  Array.from(informesAgrupados.values()).forEach(grupo => {
    // Pegar o primeiro embarque do grupo para representar o card
    const embarqueRepresentante = { ...grupo[0], voos: grupo, agrupado: true };
    embarquesProcessados.push(embarqueRepresentante);
  });
  
  debugLog(`✅ Processamento concluído: ${embarquesProcessados.length} registros válidos`, 'success');
  debugLog(`❌ Registros rejeitados: ${rejeitados}`, 'warn');
  
  return embarquesProcessados;
}

// ================================================================================
// 🎯 CLASSIFICAÇÃO DOS EMBARQUES (Lógica central)
// ================================================================================
function classificarEmbarque(embarque) {
    if (embarque.posVendaFeita || embarque.checkinFeito || embarque.conferenciaFeita) {
        return { categoria: 'concluido', urgencia: 'normal' };
    }
  
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
// 📊 RENDERIZAÇÃO DA INTERFACE COM PAGINAÇÃO
// ================================================================================
function renderizarEmbarques() {
    const filtroStatus = document.getElementById('filtroStatus').value;
    let embarquesParaRender = [];

    if (filtroStatus === 'concluido') {
        embarquesParaRender = embarquesData.filter(e => e.categoria === 'concluido');
    } else {
        embarquesParaRender = embarquesData.filter(e => e.categoria === filtroStatus);
    }
    
    renderizarLista(embarquesParaRender, filtroStatus);
    atualizarEstatisticas(embarquesData);
}

function renderizarLista(embarques, categoria) {
    const containerId = `lista-${categoria}`;
    const container = document.getElementById(containerId);
    if (!container) {
        debugLog(`❌ Container '${containerId}' não encontrado.`, 'error');
        return;
    }

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

    // Lógica de paginação
    const listaParcial = embarques.slice(0, limiteRegistros);
    const cardsHtml = listaParcial.map(e => criarCardEmbarque(e, categoria)).join('');
    container.innerHTML = cardsHtml;

    // Adicionar botão "Carregar mais" se houver mais itens
    if (embarques.length > limiteRegistros) {
        container.innerHTML += `
            <div class="text-center mt-4">
                <button class="btn btn-cvc-primary" onclick="carregarMaisEmbarques()">
                    <i class="fas fa-plus"></i> Carregar Mais (${embarques.length - limiteRegistros})
                </button>
            </div>
        `;
    }
}

function carregarMaisEmbarques() {
    limiteRegistros += 20;
    renderizarEmbarques();
}

function criarCardEmbarque(embarque, categoria) {
    const badgeClass = { 'conferencia': 'badge-conferencia', 'checkin': 'badge-checkin', 'pos-venda': 'badge-pos-venda' };
    const badgeText = { 'conferencia': 'Conferência', 'checkin': 'Check-in', 'pos-venda': 'Pós-venda' };
    const statusText = embarque.posVendaFeita ? 'Concluído' : embarque.checkinFeito ? 'Feito' : embarque.conferenciaFeita ? 'Conferido' : badgeText[categoria];
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

// ================================================================================
// 📋 MODAL E LÓGICA DE AÇÕES
// ================================================================================
function abrirDetalhesAgrupados(idOuInforme) {
    // Lógica para carregar o modal
    embarquesRelacionados = embarquesData.filter(e => e.numeroInforme === idOuInforme || e.id === idOuInforme);
    
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
        modalBody.innerHTML = 'Carregando...'; // Limpar o conteúdo anterior
        
        // Renderizar o conteúdo do modal
        const clientePrincipal = embarquesRelacionados[0];
        // ... (HTML do modal, com os campos de pós-venda que você quer exibir)
        modalBody.innerHTML = `
            <div>Nome: ${clientePrincipal.nomeCliente}</div>
            <div>CPF: ${clientePrincipal.cpfCliente}</div>
            <hr>
            <label>Observações</label>
            <textarea id="observacoesEditaveis">${clientePrincipal.observacoes}</textarea>
            `;
    }
    
    // Exibir o modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
    modal.show();
}

async function marcarComoConferido() {
    const clientePrincipal = embarquesRelacionados[0];
    const novoStatus = !clientePrincipal.conferenciaFeita;
    
    if (!confirm(`Deseja ${novoStatus ? 'marcar' : 'desmarcar'} como conferido?`)) return;

    try {
        const payload = {
            action: 'marcar_conferencia',
            cpf: clientePrincipal.cpfCliente,
            recibo: clientePrincipal.recibo,
            numeroInforme: clientePrincipal.numeroInforme,
            desfazer: !novoStatus // Passa a instrução para o backend
        };
        
        await chamarAPI(payload);
        mostrarNotificacao('Status atualizado com sucesso!', 'success');
        carregarEmbarques(); // Recarregar a lista para refletir a mudança
    } catch (error) {
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
    }
}
async function salvarAlteracoes() {
    const clientePrincipal = embarquesRelacionados[0];
    const dadosEditaveis = {
        observacoes: document.getElementById('observacoesEditaveis').value
        // ... coletar outros campos
    };
    try {
        const payload = {
            action: 'marcar_pos_venda',
            cpf: clientePrincipal.cpfCliente,
            recibo: clientePrincipal.recibo,
            numeroInforme: clientePrincipal.numeroInforme,
            dadosEditaveis: dadosEditaveis,
            desfazer: false // Assume que sempre está salvando
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
function parseData(dataStr) { /* ... */ }
function calcularDiasParaVoo(dataIda) { /* ... */ }
function calcularDiasNumericos(dataIda) { /* ... */ }
function formatarData(data) { /* ... */ }
function copiarTexto(texto) { /* ... */ }
function mostrarNotificacao(mensagem, tipo) { /* ... */ }
function debugLog(message, level, data) { /* ... */ }
function obterConfiguracao() { /* ... */ }
// Adicione aqui as funções auxiliares que você já tem
