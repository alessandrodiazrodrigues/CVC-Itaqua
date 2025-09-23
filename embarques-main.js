// ================================================================================
// [MODULO] embarques-main.js - Orquestrador Principal
// ================================================================================

// Este arquivo carrega a UI e a lógica de forma modular, garantindo que tudo funcione na ordem certa.

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando orquestrador do Módulo de Embarques...');

    // 1. Carregar a interface (esqueleto HTML)
    carregarInterface('embarques-ui.html', 'app-container');
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
        
        // 2. A interface está carregada, agora podemos inicializar a lógica.
        inicializarEmbarques();
        
    } catch (error) {
        console.error(`❌ Falha ao carregar a interface: ${error}`);
        document.getElementById(containerId).innerHTML = '<div class="alert alert-danger m-5">Erro ao carregar a interface. Tente recarregar a página.</div>';
    }
}

function inicializarEmbarques() {
    console.log('🔧 Vinculando eventos e inicializando a lógica...');
    
    // As funções de evento agora estão no embarques-logic.js
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    const btnLimpar = document.getElementById('btnLimparFiltros');
    const btnRecarregar = document.getElementById('btnRecarregar');
    
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);
    if (btnRecarregar) btnRecarregar.addEventListener('click', carregarEmbarques);
    
    // A lógica de filtragem por abas agora está no embarques-logic.js
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

    // Carregar dados iniciais
    carregarEmbarques();

    console.log('✅ Módulo de Embarques totalmente carregado e funcional!');
}

// Funções globais necessárias (acessíveis a partir do embarques-logic.js)
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;
window.carregarEmbarques = carregarEmbarques;
window.filtrarPorCategoria = filtrarPorCategoria;
