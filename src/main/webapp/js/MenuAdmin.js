/* ===== JS PANEL ADMINISTRADOR ===== */
/* v2 — datos reales desde AdminChartServlet */

// ── Colores ───────────────────────────────────────────────────
const COLOR_GASTADO = '#c96464f3';
const COLOR_TOTAL   = '#82a87ce7';

// ── Formatear euros ───────────────────────────────────────────
function fmt(val) {
    return val.toLocaleString('es-ES') + ' €';
}

function calcResto(total, gastado) {
    return total.map((t, i) => Math.max(0, t - gastado[i]));
}

// ── Opciones comunes de gráfica ───────────────────────────────
function getOptions(totalArr, gastadoArr, labelGastado, labelResto) {
    return {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: items => items[0].label,
                    beforeBody: () => null,
                    label: () => null,
                    afterBody(items) {
                        const i     = items[0].dataIndex;
                        const total = totalArr[i];
                        const gast  = gastadoArr[i];
                        const resto = Math.max(0, total - gast);
                        const pct   = total > 0 ? Math.round((gast / total) * 100) : 0;
                        return [
                            `Total:        ${fmt(total)}`,
                            `${labelGastado}:   ${fmt(gast)}  (${pct}%)`,
                            `${labelResto}: ${fmt(resto)}`
                        ];
                    }
                },
                backgroundColor: 'rgba(255,255,255,0.97)',
                titleColor: '#222',
                bodyColor: '#555',
                borderColor: '#ddd',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                titleFont: { weight: '700', size: 13 },
                bodyFont: { size: 12 }
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: val => val >= 1000 ? (val / 1000) + 'k' : val,
                    color: '#666',
                    font: { size: 10 }
                },
                border: { display: false }
            },
            y: {
                stacked: true,
                ticks: { color: '#444', font: { size: 11, weight: '600' } },
                grid: { display: false },
                border: { display: false }
            }
        }
    };
}

// ── Construir gráfica ─────────────────────────────────────────
function buildChart(canvasId, labels, total, gastado, labelGastado, labelResto) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) { console.error('Canvas no encontrado:', canvasId); return; }
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: labelGastado,
                    data: gastado,
                    backgroundColor: COLOR_GASTADO,
                    borderRadius: { topLeft: 4, bottomLeft: 4 },
                    borderSkipped: false,
                    order: 1
                },
                {
                    label: labelResto,
                    data: calcResto(total, gastado),
                    backgroundColor: COLOR_TOTAL,
                    borderRadius: { topRight: 4, bottomRight: 4 },
                    borderSkipped: false,
                    order: 2
                }
            ]
        },
        options: getOptions(total, gastado, labelGastado, labelResto)
    });
}

// ── Mostrar error visible en los wrappers de las gráficas ─────
function mostrarErrorGraficas(msg) {
    ['chartPresupuestosAdmin', 'chartInversionAdmin'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas && canvas.parentElement) {
            canvas.style.display = 'none';
            const div = document.createElement('p');
            div.style.cssText = 'text-align:center;color:#c70303;padding:2rem;font-size:13px;';
            div.textContent = 'Error al cargar datos: ' + msg;
            canvas.parentElement.appendChild(div);
        }
    });
}

// ── Cargar datos reales y pintar gráficas ─────────────────────
fetch('AdminChartServlet')
    .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ¿Sesión caducada?');
        return r.json();
    })
    .then(data => {
        if (data.error) throw new Error(data.error);

        console.log('AdminChartServlet OK — depts:', data.departamentos.length);

        const labels      = data.departamentos;
        const presTotal   = data.presupuestos.total.map(Number);
        const presGastado = data.presupuestos.gastado.map(Number);
        const planTotal   = data.planes.total.map(Number);
        const planGastado = data.planes.gastado.map(Number);

        buildChart('chartPresupuestosAdmin', labels, presTotal,  presGastado,  'Gastado',   'Disponible');
        buildChart('chartInversionAdmin',    labels, planTotal,  planGastado,  'Ejecutado', 'Pendiente');
    })
    .catch(err => {
        console.error('AdminChartServlet error:', err.message);
        mostrarErrorGraficas(err.message);
    });

// ── Navegación al departamento ────────────────────────────────
function irADepto() {
    const val = document.getElementById('menu-filtro-depto').value;
    if (!val) {
        alert('Selecciona un departamento primero.');
        return;
    }
    window.location.href = `viewOrdenesAdmin.html?depto=${val}`;
}

// ── Transiciones suaves entre páginas ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            if (link.target === '_blank' || e.ctrlKey || e.metaKey) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = link.href; }, 300);
        });
    });
});
