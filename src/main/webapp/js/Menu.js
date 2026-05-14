// ============================================================
//  Opciones base para los doughnuts
// ============================================================
function buildOptions(titulo) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#222',
                    padding: 16,
                    font: { size: 12, family: 'Inter, sans-serif' }
                }
            },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString('es-ES')} €`
                }
            }
        }
    };
}

// ============================================================
//  Crea un doughnut de 2 sectores:
//    - Gris claro  → presupuesto total (gastado/asignado)
//    - Rojo        → presupuesto restante
// ============================================================
function buildBudgetDoughnut(canvasId, total, restante) {
    const gastado = total - restante;
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gastado', 'Restante'],
            datasets: [{
                data: [gastado, restante],
                backgroundColor: [
                    'rgba(200, 200, 210, 0.85)',   // blanco-gris → gastado
                    'rgba(199,   3,   3, 0.88)'    // rojo         → restante
                ],
                borderColor: ['#e0e0e8', '#8b0000'],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: buildOptions()
    });
}

// ============================================================
//  Carga datos del servlet; si no responde → datos de ejemplo.
//  El servlet debe devolver JSON: { "total": 100000, "restante": 38000 }
// ============================================================
async function cargarPresupuesto(canvasId, servletUrl, fallbackTotal, fallbackRestante) {
    try {
        const res = await fetch(servletUrl);
        if (!res.ok) throw new Error('Sin servlet');
        const json = await res.json();
        buildBudgetDoughnut(canvasId, json.total, json.restante);
    } catch {
        buildBudgetDoughnut(canvasId, fallbackTotal, fallbackRestante);
    }
}

// ============================================================
//  Gráfica 1 – Presupuestos Generales
//  Servlet sugerido: PresupuestosGeneralesChartServlet
// ============================================================
cargarPresupuesto(
    'chartPresupuestos',
    'PresupuestosGeneralesChartServlet',
    100000,   // total de ejemplo
    38000     // restante de ejemplo
);

// ============================================================
//  Gráfica 2 – Planes de Inversión
//  Servlet sugerido: PlanesInversionChartServlet
// ============================================================
cargarPresupuesto(
    'chartInversion',
    'PlanesInversionChartServlet',
    80000,    // total de ejemplo
    29000     // restante de ejemplo
);

// ============================================================
//  Transiciones suaves entre páginas
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        link.addEventListener('click', e => {
            if (link.target === '_blank' || e.ctrlKey || e.metaKey) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            e.preventDefault();
            document.body.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = link.href;
            }, 300);
        });
    });
});
