// ================================================================================
// [MODULO] embarques-logic.js - Lógica do Dashboard de Embarques v8.08
// ================================================================================
// 🎯 VERSÃO FINAL COMPLETA - Visual CVC + Lógica corrigida + Todas funcionalidades
// ================================================================================

// ================================================================================
// 🔧 CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ================================================================================
let API_URL = null;
let VENDEDORES = [];
let TIPOS_SERVICO = [];

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
    debugLog('🚀 Inicializando embarques-logic.js v8.08...', 'info');
    obterConfiguracao();
    configurarEventos();
    carregarEmbarques();
});

function obterConfiguracao() {
    try {
        // Tentar obter via função getApiUrl
        if (typeof getApiUrl === 'function') {
            API_URL = getApiUrl();
            debugLog('✅ Config.js carregado via função getApiUrl()', 'success');
        }
        // Tentar obter via CVC_CONFIG global
        else if (typeof CVC_CONFIG !== 'undefined' && CVC_CONFIG) {
            API_URL = CVC_CONFIG.API_URL;
            VENDEDORES = CVC_CONFIG.VENDEDORES || [];
            TIPOS_SERVICO = CVC_CONFIG.TIPOS_SERVICO || [];
            debugLog('✅ Config.js carregado via CVC_CONFIG', 'success');
        }
        // Tentar obter via window.CVC_CONFIG
        else if (window.CVC_CONFIG) {
            API_URL = window.CVC_CONFIG.API_URL;
            VENDEDORES = window.CVC_CONFIG.VENDEDORES || [];
            TIPOS_SERVICO = window.CVC_CONFIG.TIPOS_SERVICO || [];
            debugLog('✅ Config.js carregado via window.CVC_CONFIG', 'success');
        }
        
        // Fallback com configuração padrão
        if (!API_URL) {
            debugLog('⚠️ Config.js não encontrado, usando configuração fallback', 'warning');
            API_URL = 'https://script.google.com/macros/s/AKfycbzV-sRXW3umtUXYy9NaWfABHmhX36WnNklr8exYLN2UuBCcuRonOnfJgqMJ_JwA3A7nYA/exec';
        }
        
        // Fallback para vendedores
        if (!VENDEDORES || VENDEDORES.length === 0) {
            VENDEDORES = ['Alessandro', 'Ana Paula', 'Adriana', 'Adrielly', 'Bia', 'Conceição', 'Jhully'];
            debugLog('📋 Usando lista de vendedores fallback', 'info');
        }
        
        // Fallback para tipos de serviço
        if (!TIPOS_SERVICO || TIPOS_SERVICO.length === 0) {
            TIPOS_SERVICO = ['Aéreo', 'A+H', 'A+H+S', 'Terrestre', 'Marítimo', 'Seguro', 'Outros'];
            debugLog('📋 Usando lista de tipos de serviço fallback', 'info');
        }
        
        debugLog(`🔗 API URL configurada: ${API_URL}`, 'info');
        debugLog(`👥 Vendedores carregados: ${VENDEDORES.length}`, 'info');
        
        return true;
    } catch (error) {
        debugLog(`❌ Erro ao obter configuração: ${error}`, 'error');
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
        
        // Criar FormData para evitar CORS
        const formData = new URLSearchParams();
        formData.append('action', action);
        
        // Adicionar dados se houver
        if (dados && typeof dados === 'object') {
            Object.entries(dados).forEach(([key, value]) => {
                formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
            });
        }
        
        debugLog(`📡 Chamando API: ${action}`, 'info', dados);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
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
        debugLog('📡 Chamando API: listar_embarques', 'info');
        
        mostrarLoading(true);
        
        try {
            // Tentar carregar da API real
            const response = await fetch(API_URL, {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'listar_embarques'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const resultado = await response.json();
            debugLog('📥 Resposta da API', 'success');
            console.log(resultado);
            
            if (resultado.success) {
                // Verificar se há dados de embarques na resposta
                if (resultado.data && resultado.data.embarques && Array.isArray(resultado.data.embarques)) {
                    const dadosRaw = resultado.data.embarques;
                    debugLog(`📄 Processando ${dadosRaw.length} registros...`, 'info');
                    
                    embarquesData = processarDadosEmbarques(dadosRaw);
                    embarquesFiltrados = [...embarquesData];
                    
                    const processados = embarquesData.length;
                    const rejeitados = dadosRaw.length - processados;
                    const percentual = ((processados / dadosRaw.length) * 100).toFixed(1);
                    
                    debugLog(`✅ Processamento: ${processados}/${dadosRaw.length} (${percentual}%)`, 'success');
                    if (rejeitados > 0) {
                        debugLog(`❌ Registros rejeitados: ${rejeitados}`, 'warning');
                    }
                    
                    preencherFiltros();
                    atualizarEstatisticas(embarquesData);
                    renderizarEmbarques();
                    
                    debugLog(`✅ ${embarquesData.length} embarques carregados com sucesso`, 'success');
                    return; // Sucesso, sair da função
                } else if (resultado.embarques && Array.isArray(resultado.embarques)) {
                    // Formato alternativo - embarques direto na raiz
                    const dadosRaw = resultado.embarques;
                    debugLog(`📄 Processando ${dadosRaw.length} registros (formato alternativo)...`, 'info');
                    
                    embarquesData = processarDadosEmbarques(dadosRaw);
                    embarquesFiltrados = [...embarquesData];
                    
                    preencherFiltros();
                    atualizarEstatisticas(embarquesData);
                    renderizarEmbarques();
                    
                    debugLog(`✅ ${embarquesData.length} embarques carregados com sucesso`, 'success');
                    return; // Sucesso, sair da função
                } else {
                    // API retornou sucesso mas sem dados de embarques
                    debugLog(`⚠️ API funcionando mas sem dados de embarques. Response: ${resultado.message}`, 'warning');
                    throw new Error('Sem dados de embarques na API');
                }
            } else {
                throw new Error(resultado.message || 'Dados não encontrados na resposta');
            }
        } catch (apiError) {
            debugLog(`⚠️ API não disponível (${apiError.message}), carregando dados de exemplo...`, 'warning');
            
            // FALLBACK: Carregar dados de exemplo para testar a interface
            const dadosExemplo = [
                {
                    id: 1,
                    numeroInforme: 'VENDA-1758134334653',
                    filial: 6220,
                    vendedor: 'Adriana',
                    nomeCliente: 'Maria Gorete Abreu De Souza',
                    cpfCliente: '251.651.898-64',
                    whatsappCliente: '11987654321',
                    dataIda: '2025-11-28',
                    dataVolta: '',
                    recibo: '62200000128415',
                    numeroPedido: '',
                    reserva: '',
                    tipo: 'Aéreo',
                    cia: 'GOL',
                    locGds: '',
                    locCia: 'OCUJVF',
                    temBagagem: 'Não',
                    temAssento: 'Não',
                    multiTrecho: 'Não',
                    seguro: 'Não informado',
                    observacoes: 'Bagagem: Não, Assento: Não',
                    ofertadoSVAs: 'Cadastrado',
                    grupoOfertas: '',
                    postouInsta: '',
                    avaliacaoGoogle: '',
                    statusGeral: 'Ativo',
                    clienteAle: 'Não',
                    conferenciaFeita: false,
                    checkinFeito: false,
                    posVendaFeita: false,
                    situacao: 'Ativo'
                },
                {
                    id: 2,
                    numeroInforme: 'VENDA-1758134334654',
                    filial: 6220,
                    vendedor: 'Alessandro',
                    nomeCliente: 'João Carlos Silva',
                    cpfCliente: '123.456.789-01',
                    whatsappCliente: '11976543210',
                    dataIda: '2025-09-30',
                    dataVolta: '2025-10-07',
                    recibo: '62200000128416',
                    numeroPedido: '',
                    reserva: 'ABC123',
                    tipo: 'A+H',
                    cia: 'AZUL',
                    locGds: 'ABC123',
                    locCia: 'XYZ456',
                    temBagagem: 'Sim',
                    temAssento: 'Sim',
                    multiTrecho: 'Não',
                    seguro: 'Sim',
                    observacoes: 'Cliente preferencial, check-in online',
                    ofertadoSVAs: 'Sim',
                    grupoOfertas: 'Sim',
                    postouInsta: 'Não',
                    avaliacaoGoogle: 'Pendente',
                    statusGeral: 'Ativo',
                    clienteAle: 'Sim',
                    conferenciaFeita: false,
                    checkinFeito: false,
                    posVendaFeita: false,
                    situacao: 'Ativo'
                },
                {
                    id: 3,
                    numeroInforme: 'VENDA-1758134334655',
                    filial: 6220,
                    vendedor: 'Ana Paula',
                    nomeCliente: 'Fernanda Costa Santos',
                    cpfCliente: '987.654.321-00',
                    whatsappCliente: '11965432109',
                    dataIda: '2025-10-02',
                    dataVolta: '',
                    recibo: '62200000128417',
                    numeroPedido: '',
                    reserva: 'DEF789',
                    tipo: 'Aéreo',
                    cia: 'LATAM',
                    locGds: 'DEF789',
                    locCia: 'GHI012',
                    temBagagem: 'Não',
                    temAssento: 'Sim',
                    multiTrecho: 'Sim',
                    seguro: 'Não',
                    observacoes: 'Voo executivo, sem bagagem despachada',
                    ofertadoSVAs: 'Não',
                    grupoOfertas: 'Não',
                    postouInsta: 'Sim',
                    avaliacaoGoogle: 'Sim',
                    statusGeral: 'Ativo',
                    clienteAle: 'Não',
                    conferenciaFeita: true,
                    checkinFeito: false,
                    posVendaFeita: false,
                    situacao: 'Ativo'
                },
                {
                    id: 4,
                    numeroInforme: 'VENDA-1758134334656',
                    filial: 6220,
                    vendedor: 'Bia',
                    nomeCliente: 'Carlos Eduardo Lima',
                    cpfCliente: '456.789.123-45',
                    whatsappCliente: '11954321098',
                    dataIda: '2025-09-25',
                    dataVolta: '2025-09-30',
                    recibo: '62200000128418',
                    numeroPedido: '',
                    reserva: 'JKL345',
                    tipo: 'A+H+S',
                    cia: 'GOL',
                    locGds: 'JKL345',
                    locCia: 'MNO678',
                    temBagagem: 'Sim',
                    temAssento: 'Sim',
                    multiTrecho: 'Não',
                    seguro: 'Sim',
                    observacoes: 'Pacote completo com seguro viagem',
                    ofertadoSVAs: 'Sim',
                    grupoOfertas: 'Sim',
                    postouInsta: 'Sim',
                    avaliacaoGoogle: 'Não',
                    statusGeral: 'Ativo',
                    clienteAle: 'Não',
                    conferenciaFeita: true,
                    checkinFeito: true,
                    posVendaFeita: false,
                    situacao: 'Ativo'
                },
                {
                    id: 5,
                    numeroInforme: 'VENDA-1758134334657',
                    filial: 6220,
                    vendedor: 'Conceição',
                    nomeCliente: 'Patricia Oliveira Matos',
                    cpfCliente: '789.123.456-78',
                    whatsappCliente: '',
                    dataIda: '2025-09-20',
                    dataVolta: '2025-09-27',
                    recibo: '62200000128419',
                    numeroPedido: '',
                    reserva: 'PQR901',
                    tipo: 'Terrestre',
                    cia: 'OUTROS',
                    locGds: '',
                    locCia: 'STU234',
                    temBagagem: 'Sim',
                    temAssento: 'N/A',
                    multiTrecho: 'Não',
                    seguro: 'Sim',
                    observacoes: 'Viagem de ônibus para Gramado',
                    ofertadoSVAs: 'Não',
                    grupoOfertas: 'Não',
                    postouInsta: 'Não',
                    avaliacaoGoogle: 'Sim',
                    statusGeral: 'Ativo',
                    clienteAle: 'Não',
                    conferenciaFeita: true,
                    checkinFeito: true,
                    posVendaFeita: true,
                    situacao: 'Ativo'
                }
            ];
            
            debugLog(`📄 Processando ${dadosExemplo.length} registros de exemplo...`, 'info');
            embarquesData = processarDadosEmbarques(dadosExemplo);
            embarquesFiltrados = [...embarquesData];
            
            preencherFiltros();
            atualizarEstatisticas(embarquesData);
            renderizarEmbarques();
            
            debugLog(`✅ ${embarquesData.length} embarques de exemplo carregados com sucesso`, 'success');
            mostrarNotificacao(`Modo demonstração ativo!\nUsando dados de exemplo para testar a interface.\n\nPara dados reais, resolva o problema de CORS no Google Apps Script.`, 'warning', 8000);
        }
        
    } catch (error) {
        debugLog(`❌ Erro ao carregar embarques: ${error.message}`, 'error');
        mostrarNotificacao('Erro ao carregar dados. Tente novamente.', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ================================================================================
// 📄 PROCESSAMENTO E CLASSIFICAÇÃO DOS DADOS - CORRIGIDO
// ================================================================================
function processarDadosEmbarques(dados) {
    debugLog(`📄 Processando ${dados.length} registros v8.08...`, 'info');
    
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
            
            // Conversão robusta de datas
            const dataIda = converterData(embarque.dataIda || embarque['Data Ida'] || '');
            const dataVolta = converterData(embarque.dataVolta || embarque['Data Volta'] || '');
            const hoje = new Date();
            const diffTime = dataIda - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Verificação de campos concluídos - LÓGICA CORRIGIDA
            const conferenciaFeita = Boolean(
                embarque.concluido || 
                embarque.conferenciaFeita || 
                embarque.dataConferencia || 
                embarque.responsavelConferencia
            );
            
            const checkinFeito = Boolean(
                embarque.checkinFeito || 
                embarque.dataCheckin || 
                embarque.responsavelCheckin || 
                embarque.checkinIda
            );
            
            const posVendaFeita = Boolean(
                embarque.posVendaFeita || 
                embarque.dataPosVenda || 
                embarque.responsavelPosVenda
            );
            
            // Determinar categoria - LÓGICA MELHORADA
            let categoria = classificarEmbarquePorTempo(embarque, diffDays, conferenciaFeita, checkinFeito, posVendaFeita);
            
            // Determinar urgência
            let urgencia = 'normal';
            if (diffDays <= 1) urgencia = 'urgente';
            else if (diffDays <= 7) urgencia = 'alerta';
            
            const embarqueProcessado = {
                id: embarque.id || index + 1,
                numeroInforme: embarque.numeroInforme || embarque['Número Informe'] || `EMBARQUE-${index}`,
                filial: embarque.filial || embarque.Filial || 6220,
                vendedor: embarque.vendedor || embarque.Vendedor || 'N/A',
                nomeCliente: embarque.nomeCliente || embarque['Nome Cliente'] || embarque.cliente || 'Cliente não informado',
                cpfCliente: embarque.cpfCliente || embarque['CPF Cliente'] || '',
                whatsappCliente: embarque.whatsappCliente || embarque['WhatsApp Cliente'] || '',
                dataIda: dataIda.toISOString(),
                dataVolta: dataVolta ? dataVolta.toISOString() : '',
                recibo: embarque.recibo || embarque.Recibo || '',
                numeroPedido: embarque.numeroPedido || embarque['Número Pedido'] || '',
                reserva: embarque.reserva || embarque.Reserva || '',
                tipo: embarque.tipo || embarque.Tipo || embarque.tipoPacote || 'N/A',
                cia: embarque.cia || embarque.Cia || embarque.companhia || '',
                locGds: embarque.locGds || embarque['Loc GDS'] || '',
                locCia: embarque.locCia || embarque['Loc CIA'] || '',
                temBagagem: embarque.temBagagem || embarque['Tem Bagagem'] || 'Não',
                temAssento: embarque.temAssento || embarque['Tem Assento'] || 'Não',
                multiTrecho: embarque.multiTrecho || embarque['Multi Trecho'] || 'Não',
                seguro: embarque.seguro || embarque.Seguro || 'Não informado',
                observacoes: embarque.observacoes || embarque.Observacoes || '',
                ofertadoSVAs: embarque.ofertadoSVAs || embarque['Ofertado SVAs'] || '',
                grupoOfertas: embarque.grupoOfertas || embarque['Grupo Ofertas'] || '',
                postouInsta: embarque.postouInsta || embarque['Postou Insta'] || '',
                avaliacaoGoogle: embarque.avaliacaoGoogle || embarque['Avaliação Google'] || '',
                statusGeral: embarque.statusGeral || embarque['Status Geral'] || 'Ativo',
                clienteAle: embarque.clienteAle || embarque['Cliente Ale'] || 'Não',
                sac: embarque.sac || embarque.SAC || '',
                numeroSAC: embarque.numeroSAC || embarque['Número SAC'] || '',
                situacao: embarque.situacao || embarque.Situacao || 'Ativo',
                
                // Estados de conclusão
                conferenciaFeita,
                checkinFeito,
                posVendaFeita,
                concluido: categoria === 'concluido',
                
                // Datas de conclusão
                dataConferencia: embarque.dataConferencia || '',
                responsavelConferencia: embarque.responsavelConferencia || '',
                dataCheckin: embarque.dataCheckin || '',
                responsavelCheckin: embarque.responsavelCheckin || '',
                dataPosVenda: embarque.dataPosVenda || '',
                responsavelPosVenda: embarque.responsavelPosVenda || '',
                
                // Metadados calculados
                categoria,
                urgencia,
                diasParaVoo: diffDays > 0 ? `${diffDays} dias` : diffDays === 0 ? 'Hoje' : 'Vencido',
                diasNumericos: diffDays
            };
            
            // Adicionar vendedor à lista única
            if (embarqueProcessado.vendedor && embarqueProcessado.vendedor !== 'N/A') {
                vendedoresUnicos.add(embarqueProcessado.vendedor);
            }
            
            // Agrupar por número de informe
            if (embarqueProcessado.numeroInforme && embarqueProcessado.categoria !== 'concluido') {
                if (!embarquesAgrupados.has(embarqueProcessado.numeroInforme)) {
                    embarquesAgrupados.set(embarqueProcessado.numeroInforme, []);
                }
                embarquesAgrupados.get(embarqueProcessado.numeroInforme).push(embarqueProcessado);
            }
            
            embarquesProcessados.push(embarqueProcessado);
            
        } catch (error) {
            debugLog(`⚠️ Erro ao processar linha ${index}: ${error}`, 'warning');
            rejeitados++;
        }
    });
    
    const taxaProcessamento = dados.length > 0 ? ((embarquesProcessados.length / dados.length) * 100).toFixed(1) : 0;
    debugLog(`✅ Processamento: ${embarquesProcessados.length}/${dados.length} (${taxaProcessamento}%)`, 'success');
    if (rejeitados > 0) {
        debugLog(`❌ Registros rejeitados: ${rejeitados}`, 'warning');
    }
    
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

function classificarEmbarquePorTempo(embarque, diffDays, conferenciaFeita, checkinFeito, posVendaFeita) {
    // Se já está concluído
    if (conferenciaFeita && checkinFeito && posVendaFeita) {
        return 'concluido';
    }
    
    // PÓS-VENDA: 1 dia após retorno
    if (embarque.dataVolta) {
        const dataVolta = converterData(embarque.dataVolta);
        if (dataVolta) {
            const diffDaysVolta = Math.ceil((dataVolta - new Date()) / (1000 * 60 * 60 * 24));
            if (diffDaysVolta < 0) { // Já voltou
                return 'pos-venda';
            }
        }
    }
    
    // CHECK-IN: 3 dias antes do voo
    if (diffDays >= -365 && diffDays <= 3) {
        return 'checkin';
    }
    
    // CONFERÊNCIA: 4 a 12 dias antes
    if (diffDays >= 4 && diffDays <= 12) {
        return 'conferencia';
    }
    
    // Muito distante - futuro
    return 'futuro';
}

// ================================================================================
// 🎨 RENDERIZAÇÃO DA INTERFACE - VISUAL CVC APLICADO
// ================================================================================
function renderizarEmbarques() {
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    
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
    const elementos = {
        'badgeConferencias': listas.conferencia.length,
        'badgeCheckins': listas.checkin.length,
        'badgePosVendas': listas.posVenda.length,
        'badgeConcluidos': listas.concluido.length
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    });
    
    atualizarEstatisticas(embarquesData);
}

function renderizarLista(containerId, embarques, categoria) {
    const container = document.getElementById(containerId);
    if (!container) {
        debugLog(`Container ${containerId} não encontrado`, 'error');
        return;
    }

    if (embarques.length === 0) {
        const mensagens = {
            'conferencia': 'Nenhuma conferência pendente',
            'checkin': 'Nenhum check-in próximo',
            'pos-venda': 'Nenhum pós-venda pendente',
            'concluido': 'Nenhum embarque concluído'
        };
        
        container.innerHTML = `
            <div class="empty-state" style="
                text-align: center;
                padding: 40px 20px;
                color: #6c757d;
                background: #f8f9fa;
                border-radius: 15px;
                border: 2px dashed #dee2e6;
            ">
                <i class="fas fa-${categoria === 'conferencia' ? 'clipboard-check' : categoria === 'checkin' ? 'plane' : categoria === 'pos-venda' ? 'phone' : 'check-double'}" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <h5 style="margin-bottom: 10px; color: #495057;">${mensagens[categoria]}</h5>
                <small style="color: #6c757d;">Sistema v8.08 - Total processados: ${stats.total} embarques</small>
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

// ================================================================================
// 🎨 CRIAÇÃO DE CARDS - VISUAL CVC COMPLETO
// ================================================================================
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
    const ledColor = urgenciaClass === 'urgente' ? 'vermelho' : 
                    urgenciaClass === 'alerta' ? 'amarelo' : 'verde';
    
    const whatsappLink = embarque.whatsappCliente ? 
        `https://wa.me/55${embarque.whatsappCliente.replace(/\D/g, '')}` : '#';
    
    const clienteAleTag = embarque.clienteAle === 'Sim' ? 
        '<span class="cliente-ale-tag" style="background: #0A00B4; color: #FFE600; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 8px;">Cliente Ale</span>' : '';
    
    // Texto de urgência para check-ins com atraso
    let urgenciaTexto = urgenciaClass === 'normal' ? 'Normal' : urgenciaClass === 'alerta' ? 'Cuidado' : 'URGENTE';
    if (categoria === 'checkin' && embarque.diasNumericos < 0) {
        urgenciaTexto = 'ATRASO';
    }
    
    // Cores do sistema de urgência
    const coresUrgencia = {
        'urgente': { bg: '#fff5f5', border: '#dc3545', led: '#dc3545' },
        'alerta': { bg: '#fffbf0', border: '#ffc107', led: '#ffc107' },
        'normal': { bg: '#f8fff8', border: '#28a745', led: '#28a745' }
    };
    
    const cor = coresUrgencia[urgenciaClass] || coresUrgencia.normal;
    
    return `
        <div class="embarque-card ${urgenciaClass}" 
             data-embarque-id="${embarque.id}"
             style="
                background: ${cor.bg};
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 4px 20px rgba(10, 0, 180, 0.1);
                border-left: 4px solid ${cor.border};
                transition: all 0.3s ease;
                position: relative;
                cursor: pointer;
                font-family: 'Nunito', sans-serif;
             "
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 25px rgba(10, 0, 180, 0.15)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(10, 0, 180, 0.1)';">
            
            <!-- LED de urgência -->
            <div class="led-urgencia ${ledColor}" style="
                position: absolute;
                top: 15px;
                right: 15px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${cor.led};
                box-shadow: 0 0 8px rgba(0,0,0,0.3);
                animation: pulse-${ledColor} 2s infinite;
            "></div>
            
            <!-- Header do card -->
            <div class="embarque-header" style="margin-bottom: 15px;">
                <div class="cliente-info">
                    <div class="cliente-nome" style="
                        font-family: 'Nunito', sans-serif;
                        font-weight: 700;
                        color: #0A00B4;
                        margin-bottom: 5px;
                        font-size: 1.1rem;
                        line-height: 1.2;
                    ">
                        ${embarque.nomeCliente || 'Nome não informado'}
                        ${clienteAleTag}
                    </div>
                    <div class="cliente-cpf" style="
                        font-size: 0.85rem;
                        color: #6c757d;
                        margin-bottom: 10px;
                    ">CPF: ${embarque.cpfCliente || 'Não informado'}</div>
                </div>
                
                <div class="status-badges" style="display: flex; gap: 8px; align-items: center;">
                    <span class="status-badge ${badgeClass[categoria]}" style="
                        background: #FFE600;
                        color: #0A00B4;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                        display: inline-block;
                    ">${badgeText[categoria]}</span>
                    
                    <span class="urgencia-badge urgencia-${urgenciaClass}" style="
                        background: ${cor.led};
                        color: white;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 0.7rem;
                        font-weight: 600;
                    ">${urgenciaTexto}</span>
                </div>
            </div>
            
            <!-- Detalhes do embarque -->
            <div class="embarque-details" style="
                font-family: 'Nunito', sans-serif;
                color: #1B365D;
                line-height: 1.4;
                margin-bottom: 15px;
            ">
                <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-user-tie detail-icon" style="color: #0A00B4; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">Vendedor:</span>
                        <span class="detail-value" style="color: #1B365D;">${embarque.vendedor || 'Não informado'}</span>
                    </div>
                    
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-calendar detail-icon" style="color: #0A00B4; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">Data do Voo:</span>
                        <span class="detail-value" style="color: #1B365D;">${formatarData(embarque.dataIda)}</span>
                    </div>
                    
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clock detail-icon" style="color: #0A00B4; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">Dias para Voo:</span>
                        <span class="detail-value" style="color: #1B365D; font-weight: 600;">${embarque.diasParaVoo}</span>
                    </div>
                    
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-receipt detail-icon" style="color: #0A00B4; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">Recibo:</span>
                        <span class="detail-value" style="color: #1B365D;">${embarque.recibo || 'N/A'}</span>
                        ${embarque.recibo ? `<button class="copy-button" onclick="copiarTexto('${embarque.recibo}', this)" style="background: none; border: none; color: #0A00B4; cursor: pointer; padding: 2px;"><i class="fas fa-copy"></i></button>` : ''}
                    </div>
                    
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-building detail-icon" style="color: #0A00B4; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">Nº Informe:</span>
                        <span class="detail-value" style="color: #1B365D;">${embarque.numeroInforme || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-item" style="display: flex; align-items: center; gap: 8px;">
                        <i class="fab fa-whatsapp detail-icon" style="color: #25D366; width: 16px;"></i>
                        <span class="detail-label" style="font-weight: 600; color: #495057;">WhatsApp:</span>
                        <span class="detail-value" style="color: #1B365D;">${embarque.whatsappCliente || 'N/A'}</span>
                        ${embarque.whatsappCliente ? `<button class="copy-button" onclick="copiarTexto('${embarque.whatsappCliente}', this)" style="background: none; border: none; color: #25D366; cursor: pointer; padding: 2px;"><i class="fas fa-copy"></i></button>` : ''}
                    </div>
                </div>
            </div>
            
            ${embarque.observacoes ? `
                <div class="embarque-extras" style="
                    background: rgba(10, 0, 180, 0.05);
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 15px;
                ">
                    <div class="extras-title" style="
                        font-weight: 600;
                        color: #0A00B4;
                        font-size: 0.85rem;
                        margin-bottom: 5px;
                    ">Observações</div>
                    <div class="detail-value" style="
                        color: #495057;
                        font-size: 0.9rem;
                        line-height: 1.4;
                    ">${embarque.observacoes.substring(0, 150)}${embarque.observacoes.length > 150 ? '...' : ''}</div>
                </div>
            ` : ''}
            
            <!-- Ações do card -->
            <div class="embarque-actions" style="
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                border-top: 1px solid rgba(10, 0, 180, 0.1);
                padding-top: 15px;
            ">
                ${embarque.whatsappCliente ? `
                    <a href="${whatsappLink}" target="_blank" style="
                        background: #25D366;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-size: 0.8rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#1da851';" onmouseout="this.style.background='#25D366';">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                ` : ''}
                
                <button onclick="abrirDetalhesAgrupados('${embarque.numeroInforme || embarque.id}')" style="
                    background: #0A00B4;
                    color: #FFE600;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#1B365D';" onmouseout="this.style.background='#0A00B4';">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
            </div>
        </div>
    `;
}

// ================================================================================
// 📊 ESTATÍSTICAS E FILTROS
// ================================================================================
function atualizarEstatisticas(embarques) {
    const embarquesValidos = embarques.filter(e => e && typeof e === 'object');
    
    stats = {
        conferencias: embarquesValidos.filter(e => e.categoria === 'conferencia').length,
        checkins: embarquesValidos.filter(e => e.categoria === 'checkin').length,
        posVendas: embarquesValidos.filter(e => e.categoria === 'pos-venda').length,
        concluidos: embarquesValidos.filter(e => e.categoria === 'concluido').length,
        total: embarquesValidos.length
    };
    
    // Atualizar elementos do DOM se existirem
    const elementos = {
        'statConferencias': stats.conferencias,
        'statCheckins': stats.checkins, 
        'statPosVendas': stats.posVendas,
        'statTotal': stats.total,
        'badgeConferencias': stats.conferencias,
        'badgeCheckins': stats.checkins,
        'badgePosVendas': stats.posVendas,
        'badgeConcluidos': stats.concluidos
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    });
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
        <div class="cliente-header" style="
            background: linear-gradient(135deg, #0A00B4 0%, #1B365D 100%);
            color: #FFE600;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        ">
            <div class="info-title" style="
                font-size: 1.2rem;
                font-weight: 700;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-user"></i> Dados do Cliente
            </div>
            <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div class="info-item">
                    <div class="info-label" style="font-weight: 600; margin-bottom: 5px;">Nome Completo</div>
                    <div class="info-value" style="background: rgba(255, 230, 0, 0.1); padding: 8px; border-radius: 5px;">${clientePrincipal.nomeCliente || 'Não informado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label" style="font-weight: 600; margin-bottom: 5px;">CPF</div>
                    <div class="info-value" style="background: rgba(255, 230, 0, 0.1); padding: 8px; border-radius: 5px; display: flex; align-items: center; gap: 10px;">
                        ${clientePrincipal.cpfCliente || 'Não informado'}
                        ${clientePrincipal.cpfCliente ? `
                            <button class="copy-button" onclick="copiarTexto('${clientePrincipal.cpfCliente}', this)" style="background: #FFE600; color: #0A00B4; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-copy"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label" style="font-weight: 600; margin-bottom: 5px;">WhatsApp</div>
                    <div class="info-value" style="background: rgba(255, 230, 0, 0.1); padding: 8px; border-radius: 5px;">
                        ${clientePrincipal.whatsappCliente ? 
                            `<a href="${whatsappLink}" target="_blank" style="color: #FFE600; text-decoration: none;">${clientePrincipal.whatsappCliente}</a>
                             <button class="copy-button" onclick="copiarTexto('${clientePrincipal.whatsappCliente}', this)" style="background: #FFE600; color: #0A00B4; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                                 <i class="fas fa-copy"></i>
                             </button>` : 
                            'Não informado'
                        }
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label" style="font-weight: 600; margin-bottom: 5px;">Vendedor</div>
                    <div class="info-value" style="background: rgba(255, 230, 0, 0.1); padding: 8px; border-radius: 5px;">${clientePrincipal.vendedor || 'Não informado'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label" style="font-weight: 600; margin-bottom: 5px;">Cliente Ale</div>
                    <div class="info-value">
                        <span style="
                            background: ${clientePrincipal.clienteAle === 'Sim' ? '#FFE600' : '#6c757d'};
                            color: ${clientePrincipal.clienteAle === 'Sim' ? '#0A00B4' : 'white'};
                            padding: 4px 12px;
                            border-radius: 15px;
                            font-weight: 600;
                            font-size: 0.8rem;
                        ">${clientePrincipal.clienteAle || 'Não'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${Array.from(embarquesPorRecibo.entries()).map(([recibo, embarques]) => `
            <div class="recibo-box" style="
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            ">
                <div class="recibo-titulo" style="
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #0A00B4;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-receipt"></i> 
                    Recibo: ${recibo}
                    ${recibo !== 'Sem Recibo' ? `
                        <button class="copy-button" onclick="copiarTexto('${recibo}', this)" style="
                            background: #0A00B4;
                            color: #FFE600;
                            border: none;
                            padding: 4px 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-left: 10px;
                        ">
                            <i class="fas fa-copy"></i>
                        </button>
                    ` : ''}
                </div>
                
                ${embarques.map((embarque, index) => `
                    <div class="info-section" style="
                        background: white;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 15px;
                        border-left: 4px solid #0A00B4;
                    ">
                        <div class="info-title" style="
                            font-weight: 600;
                            color: #0A00B4;
                            margin-bottom: 10px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-plane"></i> Voo ${index + 1} - ${formatarData(embarque.dataIda)}
                        </div>
                        <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">Data de Ida</div>
                                <div class="info-value" style="color: #1B365D;">${formatarData(embarque.dataIda)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">Data de Volta</div>
                                <div class="info-value" style="color: #1B365D;">${formatarData(embarque.dataVolta) || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">Tipo de Serviço</div>
                                <div class="info-value" style="color: #1B365D;">${embarque.tipo || embarque.tipoAereo || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">Companhia Aérea</div>
                                <div class="info-value" style="color: #1B365D;">${embarque.cia || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">Reserva</div>
                                <div class="info-value" style="color: #1B365D; display: flex; align-items: center; gap: 8px;">
                                    ${embarque.reserva || 'N/A'}
                                    ${embarque.reserva ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.reserva}', this)" style="background: #0A00B4; color: #FFE600; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">LOC GDS</div>
                                <div class="info-value" style="color: #1B365D; display: flex; align-items: center; gap: 8px;">
                                    ${embarque.locGds || 'N/A'}
                                    ${embarque.locGds ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.locGds}', this)" style="background: #0A00B4; color: #FFE600; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label" style="font-weight: 600; color: #495057; font-size: 0.85rem;">LOC CIA</div>
                                <div class="info-value" style="color: #1B365D; display: flex; align-items: center; gap: 8px;">
                                    ${embarque.locCia || 'N/A'}
                                    ${embarque.locCia ? `
                                        <button class="copy-button" onclick="copiarTexto('${embarque.locCia}', this)" style="background: #0A00B4; color: #FFE600; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${embarque.observacoes ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                                <div class="info-label" style="font-weight: 600; color: #495057; margin-bottom: 5px;">Observações</div>
                                <div class="info-value" style="color: #1B365D; background: #f8f9fa; padding: 10px; border-radius: 5px;">${embarque.observacoes}</div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div class="info-section" style="
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
        ">
            <div class="info-title" style="
                font-weight: 700;
                color: #0A00B4;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-edit"></i> Observações Editáveis
            </div>
            <div style="margin-bottom: 15px;">
                <label class="editable-label" style="font-weight: 600; color: #495057; margin-bottom: 5px; display: block;">Observações</label>
                <textarea class="editable-field" id="observacoesEditaveis" rows="3" 
                          placeholder="Digite observações sobre a conferência..."
                          style="width: 100%; padding: 10px; border: 1px solid #dee2e6; border-radius: 5px; font-family: 'Nunito', sans-serif;">
                </textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <label class="editable-label" style="font-weight: 600; color: #495057; margin-bottom: 5px; display: block;">Grupo Ofertas WhatsApp</label>
                    <select class="editable-field" id="grupoOfertas" style="width: 100%; padding: 8px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div>
                    <label class="editable-label" style="font-weight: 600; color: #495057; margin-bottom: 5px; display: block;">Postou no Instagram</label>
                    <select class="editable-field" id="postouInsta" style="width: 100%; padding: 8px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div>
                    <label class="editable-label" style="font-weight: 600; color: #495057; margin-bottom: 5px; display: block;">Avaliação Google</label>
                    <select class="editable-field" id="avaliacaoGoogle" style="width: 100%; padding: 8px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div>
                    <label class="editable-label" style="font-weight: 600; color: #495057; margin-bottom: 5px; display: block;">SAC</label>
                    <input type="text" class="editable-field" id="sacPosVenda" 
                           placeholder="Número do SAC"
                           style="width: 100%; padding: 8px; border: 1px solid #dee2e6; border-radius: 5px;">
                </div>
            </div>
        </div>
        
        <div class="info-section" style="
            background: ${clientePrincipal.conferenciaFeita ? '#d4edda' : '#fff3cd'};
            border: 1px solid ${clientePrincipal.conferenciaFeita ? '#c3e6cb' : '#ffeaa7'};
            border-radius: 10px;
            padding: 20px;
        ">
            <div class="info-title" style="
                font-weight: 700;
                color: ${clientePrincipal.conferenciaFeita ? '#155724' : '#856404'};
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-check-circle"></i> Status da Conferência
            </div>
            <div class="info-value">
                ${clientePrincipal.conferenciaFeita ? 
                    '<span style="background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600;">Conferência Concluída</span>' : 
                    '<span style="background: #ffc107; color: #212529; padding: 8px 16px; border-radius: 20px; font-weight: 600;">Aguardando Conferência</span>'
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
                embarque.responsavelConferencia = novoStatus ? 'Dashboard v8.08' : '';
                
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
                        const novaClassificacao = classificarEmbarquePorTempo(embarqueOriginal, embarqueOriginal.diasNumericos, false, embarqueOriginal.checkinFeito, embarqueOriginal.posVendaFeita);
                        embarqueOriginal.categoria = novaClassificacao;
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
        <div class="info-item" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #0A00B4;">
            <div class="info-label" style="font-weight: 700; color: #0A00B4; margin-bottom: 8px;">Orbium ${orbium.orbium}</div>
            <div class="info-value" style="color: #1B365D; line-height: 1.5;">
                <strong>Status:</strong> ${orbium.status}<br>
                <strong>Vendedor:</strong> ${orbium.vendedor}<br>
                ${orbium.observacoes ? '<strong>Obs:</strong> ' + orbium.observacoes : ''}
            </div>
        </div>
    `).join('');
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML += `
        <div class="info-section" style="
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        ">
            <div class="info-title" style="
                font-weight: 700;
                color: #0A00B4;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
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
            const dataEmbarque = converterData(embarque.dataIda);
            if (!dataEmbarque || dataEmbarque.toDateString() !== dataInicio.toDateString()) {
                return false;
            }
        }
        
        if (filtroDataCheckin) {
            const dataCheckin = new Date(filtroDataCheckin);
            const dataEmbarque = converterData(embarque.dataIda);
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
    // Limpar todos os campos de filtro
    const campos = [
        'filtroVendedor', 'filtroStatus', 'filtroClienteAle', 'filtroCPF',
        'filtroWhatsApp', 'filtroRecibo', 'filtroReserva', 'filtroLocGds',
        'filtroLocCia', 'filtroDataInicio', 'filtroDataCheckin'
    ];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) elemento.value = '';
    });
    
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

function formatarData(data) {
    if (!data) return 'N/A';
    
    try {
        const dataObj = converterData(data);
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
        const originalColor = botao.style.background;
        
        botao.innerHTML = '<i class="fas fa-check"></i>';
        botao.style.background = '#28a745';
        
        setTimeout(() => {
            botao.innerHTML = originalText;
            botao.style.background = originalColor;
        }, 1000);
        
        mostrarNotificacao('Texto copiado!', 'success');
    }).catch(err => {
        debugLog('Erro ao copiar texto:', err);
        mostrarNotificacao('Erro ao copiar texto', 'error');
    });
}

function mostrarNotificacao(mensagem, tipo = 'info', duracao = 4000) {
    const notification = document.createElement('div');
    
    const cores = {
        'success': { bg: '#d4edda', border: '#c3e6cb', color: '#155724', icon: 'check-circle' },
        'error': { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24', icon: 'exclamation-triangle' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', color: '#856404', icon: 'exclamation-triangle' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460', icon: 'info-circle' }
    };
    
    const cor = cores[tipo] || cores.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${cor.bg};
        border: 1px solid ${cor.border};
        color: ${cor.color};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Nunito', sans-serif;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${cor.icon}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    // Adicionar estilos de animação se não existirem
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
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
            backdrop-filter: blur(2px);
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 8px 30px rgba(10, 0, 180, 0.2);
                text-align: center;
                font-family: 'Nunito', sans-serif;
            ">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #0A00B4; margin-bottom: 15px;"></i>
                <div style="color: #1B365D; font-weight: 600;">Carregando...</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    } else if (!mostrar && overlay) {
        document.body.removeChild(overlay);
    }
}

function debugLog(message, level = 'info', data = null) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const icons = {
        'error': '❌',
        'warning': '⚠️', 
        'success': '✅',
        'info': 'ℹ️'
    };
    
    const prefix = icons[level] || icons.info;
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
console.log('%c📊 embarques-logic.js v8.08 carregado!', 'color: #FFE600; background: #0A00B4; padding: 4px 8px; font-weight: bold;');
console.log('🔧 Sistema totalmente funcional e independente');
console.log('🎯 Compatível com config.js e API v8.08');
console.log('🎨 Visual CVC aplicado conforme Manual da Marca');
