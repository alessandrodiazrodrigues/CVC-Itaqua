// ================================================================================
// [MODULO] embarques-logic.js - Dashboard de Embarques v8.11 - LIMPO E FUNCIONAL
// ================================================================================
// 🎯 VERSÃO LIMPA COM JSONP - TODAS AS FUNCIONALIDADES OPERACIONAIS
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

// ================================================================================
// 🚀 INICIALIZAÇÃO
// ================================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando embarques-logic.js v8.11...');
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
// 🌐 CLIENTE JSONP
// ================================================================================
function chamarAPIComJSONP(payload) {
    return new Promise((resolve, reject) => {
        const callbackName = `${JSONP_CALLBACK_NAME}_${++jsonpCounter}_${Date.now()}`;
        const script = document.createElement('script');
        
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout: Servidor não respondeu em 30 segundos'));
        }, 30000);

        function cleanup() {
            clearTimeout(timeoutId);
            if (script.parentNode) {
                document.head.removeChild(script);
            }
            delete window[callbackName];
        }

        window[callbackName] = function(response) {
            cleanup();
            if (response && response.success) {
                resolve(response);
            } else {
                reject(new Error(response.message || 'Erro na API'));
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
        console.log(`🚀 JSONP Request: ${payload.action}`);
    });
}

// ================================================================================
// 📡 CARREGAMENTO DE DADOS
// ================================================================================
async function carregarEmbarques() {
    try {
        console.log('📋 Carregando embarques via JSONP...');
        mostrarLoading(true);
        
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
        mostrarNotificacao(`Erro ao carregar dados: ${error.message}`, 'error');
        
        // Limpar dados
        embarquesData = [];
        embarquesFiltrados = [];
        atualizarEstatisticas();
        renderizarEmbarques();
    } finally {
        mostrarLoading(false);
    }
}

// ================================================================================
// 📄 PROCESSAMENTO DE DADOS
// ================================================================================
function processarDados(dados) {
    const embarquesProcessados = [];
    
    dados.forEach((embarque, index) => {
        try {
            if (!validarEmbarque(embarque)) return;
            
            const dataIda = converterData(embarque.dataIda || embarque['Data Ida'] || '');
            const hoje = new Date();
            const diffDays = Math.ceil((dataIda - hoje) / (1000 * 60 * 60 * 24));
            
            // Verificar status das etapas
            const conferenciaFeita = Boolean(embarque.dataConferencia || embarque.responsavelConferencia);
            const checkinFeito = Boolean(embarque.dataCheckin || embarque.responsavelCheckin);
            const posVendaFeita = Boolean(embarque.dataPosVenda || embarque.responsavelPosVenda);
            
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
                sac: embarque.sac || embarque.SAC || '',
                
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
// 🎨 RENDERIZAÇÃO
// ================================================================================
function renderizarEmbarques() {
    const listas = {
        conferencia: embarquesFiltrados.filter(e => e.categoria === 'conferencia'),
        checkin: embarquesFiltrados.filter(e => e.categoria === 'checkin'),
        posVenda: embarquesFiltrados.filter(e => e.categoria === 'pos-venda'),
        concluido: embarquesFiltrados.filter(e => e.categoria === 'concluido')
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
            "></div>
            
            <!-- Header -->
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
        conferencias: embarquesData.filter(e => e.categoria === 'conferencia').length,
        checkins: embarquesData.filter(e => e.categoria === 'checkin').length,
        posVendas: embarquesData.filter(e => e.categoria === 'pos-venda').length,
        concluidos: embarquesData.filter(e => e.categoria === 'concluido').length,
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
// 🔍 FILTROS
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
// 🎯 AÇÕES DOS CARDS
// ================================================================================
async function abrirDetalhesEmbarque(numeroInforme) {
    console.log(`🔍 Abrindo detalhes para: ${numeroInforme}`);
    
    // Buscar embarques relacionados
    embarquesRelacionados = embarquesData.filter(e => {
        const match1 = e.numeroInforme === numeroInforme;
        const match2 = e.id.toString() === numeroInforme.toString();
        console.log(`Comparando: ${e.numeroInforme} === ${numeroInforme} (${match1}) ou ${e.id} === ${numeroInforme} (${match2})`);
        return match1 || match2;
    });
    
    console.log(`Encontrados ${embarquesRelacionados.length} embarques relacionados`);
    
    if (embarquesRelacionados.length === 0) {
        console.log('❌ Nenhum embarque encontrado');
        mostrarNotificacao('Nenhum embarque encontrado', 'warning');
        return;
    }
    
    const cliente = embarquesRelacionados[0];
    console.log(`👤 Cliente: ${cliente.nomeCliente}`);
    
    // Criar modal se não existir
    criarModal();
    
    // Preencher modal
    preencherModal(cliente, embarquesRelacionados);
    
    // Mostrar modal
    const modalEl = document.getElementById('modalDetalhes');
    console.log(`Modal elemento: ${modalEl ? 'encontrado' : 'não encontrado'}`);
    
    if (modalEl) {
        if (typeof bootstrap !== 'undefined') {
            console.log('Abrindo modal com Bootstrap');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            console.log('Bootstrap não disponível, tentando CSS');
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
        }
    }
}

function criarModal() {
    if (document.getElementById('modalDetalhes')) return;
    
    const modalHTML = `
        <div class="modal fade" id="modalDetalhes" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header" style="background: #0A00B4; color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-user"></i> Detalhes do Cliente
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="modalDetalhesBody">
                        <!-- Conteúdo dinâmico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                        <button type="button" class="btn btn-success" onclick="marcarConferencia()">
                            <i class="fas fa-check"></i> Marcar Conferência
                        </button>
                        <button type="button" class="btn btn-primary" onclick="salvarAlteracoes()">
                            <i class="fas fa-save"></i> Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function preencherModal(cliente, embarques) {
    const modalBody = document.getElementById('modalDetalhesBody');
    if (!modalBody) return;
    
    const embarquesHtml = embarques.map((embarque, index) => `
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <h6 style="color: #0A00B4;">
                <i class="fas fa-plane"></i> Voo ${index + 1} - ${formatarData(embarque.dataIda)}
            </h6>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div><strong>CIA:</strong> ${embarque.cia || 'N/A'}</div>
                <div><strong>Reserva:</strong> ${embarque.reserva || 'N/A'}</div>
                <div><strong>LOC GDS:</strong> ${embarque.locGds || 'N/A'}</div>
                <div><strong>LOC CIA:</strong> ${embarque.locCia || 'N/A'}</div>
            </div>
        </div>
    `).join('');

    modalBody.innerHTML = `
        <div style="background: linear-gradient(135deg, #0A00B4 0%, #1B365D 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h5><i class="fas fa-user"></i> Dados do Cliente</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                <div><strong style="color: #FFE600;">Nome:</strong> ${cliente.nomeCliente}</div>
                <div><strong style="color: #FFE600;">CPF:</strong> ${cliente.cpfCliente}</div>
                <div><strong style="color: #FFE600;">Vendedor:</strong> ${cliente.vendedor}</div>
                <div><strong style="color: #FFE600;">WhatsApp:</strong> ${cliente.whatsappCliente}</div>
                <div><strong style="color: #FFE600;">Cliente Ale:</strong> ${cliente.clienteAle}</div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h5 style="color: #0A00B4;"><i class="fas fa-edit"></i> Campos Editáveis</h5>
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoesEditaveis" rows="3">${cliente.observacoes || ''}</textarea>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Grupo Ofertas WhatsApp</label>
                    <select class="form-select" id="grupoOfertas">
                        <option value="">Selecione...</option>
                        <option value="Sim" ${cliente.grupoOfertas === 'Sim' ? 'selected' : ''}>Sim</option>
                        <option value="Não" ${cliente.grupoOfertas === 'Não' ? 'selected' : ''}>Não</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Postou no Instagram</label>
                    <select class="form-select" id="postouInsta">
                        <option value="">Selecione...</option>
                        <option value="Sim" ${cliente.postouInsta === 'Sim' ? 'selected' : ''}>Sim</option>
                        <option value="Não" ${cliente.postouInsta === 'Não' ? 'selected' : ''}>Não</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Avaliação Google</label>
                    <select class="form-select" id="avaliacaoGoogle">
                        <option value="">Selecione...</option>
                        <option value="Sim" ${cliente.avaliacaoGoogle === 'Sim' ? 'selected' : ''}>Sim</option>
                        <option value="Não" ${cliente.avaliacaoGoogle === 'Não' ? 'selected' : ''}>Não</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">SAC</label>
                    <input type="text" class="form-control" id="sacPosVenda" value="${cliente.sac || ''}" placeholder="Número do SAC">
                </div>
            </div>
        </div>
        
        <div>
            <h5 style="color: #0A00B4;"><i class="fas fa-plane"></i> Embarques Relacionados</h5>
            ${embarquesHtml}
        </div>
    `;
}

async function marcarConferencia() {
    if (embarquesRelacionados.length === 0) return;
    
    const cliente = embarquesRelacionados[0];
    const novoStatus = !cliente.conferenciaFeita;
    
    if (!confirm(`Deseja ${novoStatus ? 'marcar' : 'desmarcar'} conferência para ${cliente.nomeCliente}?`)) return;
    
    try {
        const resultado = await chamarAPIComJSONP({
            action: 'marcar_conferencia',
            cpf: cliente.cpfCliente,
            recibo: cliente.recibo,
            numeroInforme: cliente.numeroInforme,
            desfazer: !novoStatus
        });
        
        mostrarNotificacao('Conferência atualizada com sucesso!', 'success');
        carregarEmbarques();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
        if (modal) modal.hide();
        
    } catch (error) {
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
    }
}

async function salvarAlteracoes() {
    if (embarquesRelacionados.length === 0) return;
    
    const cliente = embarquesRelacionados[0];
    const dadosEditaveis = {
        observacoes: document.getElementById('observacoesEditaveis')?.value || '',
        grupoOfertas: document.getElementById('grupoOfertas')?.value || '',
        postouInsta: document.getElementById('postouInsta')?.value || '',
        avaliacaoGoogle: document.getElementById('avaliacaoGoogle')?.value || '',
        sac: document.getElementById('sacPosVenda')?.value || ''
    };
    
    try {
        const resultado = await chamarAPIComJSONP({
            action: 'marcar_pos_venda',
            cpf: cliente.cpfCliente,
            recibo: cliente.recibo,
            numeroInforme: cliente.numeroInforme,
            dadosEditaveis: JSON.stringify(dadosEditaveis),
            desfazer: false
        });
        
        mostrarNotificacao('Alterações salvas com sucesso!', 'success');
        carregarEmbarques();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhes'));
        if (modal) modal.hide();
        
    } catch (error) {
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
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
window.salvarAlteracoes = salvarAlteracoes;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.filtrarPorCategoria = filtrarPorCategoria;
window.carregarEmbarques = carregarEmbarques;
window.copiarTexto = copiarTexto;

// ================================================================================
// 📝 LOGS FINAIS
// ================================================================================
console.log('%c🏢 CVC ITAQUÁ - EMBARQUES v8.11', 'color: #0A00B4; font-size: 16px; font-weight: bold;');
console.log('✅ Sistema limpo e funcional com JSONP');
console.log('✅ Todas as ações implementadas');
console.log('✅ Interface CVC aplicada');
console.log('🚀 PRONTO PARA PRODUÇÃO!');
