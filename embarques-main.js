// ================================================================================
// [MODULO] embarques-main.js - Orquestrador Principal
// ================================================================================

// Este arquivo carrega a UI e a lógica de forma modular, garantindo que tudo funcione na ordem certa.

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando orquestrador do Módulo de Embarques...');

    // 1. Carregar a interface (esqueleto HTML)
    await carregarInterface('embarques-ui.html', 'app-container');

    // 2. Configurar eventos e inicializar a lógica
    inicializarEmbarques();

    console.log('✅ Módulo de Embarques totalmente carregado e funcional!');
});

async function carregarInterface(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar a interface: ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        console.log(`✅ Interface '${url}' carregada com sucesso!`);
    } catch (error) {
        console.error(`❌ Falha ao carregar a interface: ${error}`);
        document.getElementById(containerId).innerHTML = '<div class="alert alert-danger m-5">Erro ao carregar a interface. Tente recarregar a página.</div>';
    }
}

function inicializarEmbarques() {
    console.log('🔧 Vinculando eventos e inicializando a lógica...');

    // Configurar event listeners dos botões e filtros
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    const btnLimpar = document.getElementById('btnLimparFiltros');
    const btnRecarregar = document.getElementById('btnRecarregar');
    const tabConferencias = document.getElementById('tab-conferencias');
    const tabCheckins = document.getElementById('tab-checkins');
    const tabPosVendas = document.getElementById('tab-pos-vendas');

    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);
    if (btnRecarregar) btnRecarregar.addEventListener('click', carregarEmbarques);
    if (tabConferencias) tabConferencias.addEventListener('click', () => filtrarPorCategoria('conferencia'));
    if (tabCheckins) tabCheckins.addEventListener('click', () => filtrarPorCategoria('checkin'));
    if (tabPosVendas) tabPosVendas.addEventListener('click', () => filtrarPorCategoria('pos-venda'));

    // Carregar dados iniciais
    carregarEmbarques();
}

// Funções globais necessárias
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.carregarEmbarques = carregarEmbarques;
window.filtrarPorCategoria = filtrarPorCategoria;
