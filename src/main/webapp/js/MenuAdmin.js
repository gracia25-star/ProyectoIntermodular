/* ===== JS PANEL ADMINISTRADOR ===== */
/* Gráficas de barras horizontales apiladas por departamento */

// ── Departamentos ─────────────────────────────────────────────
const nombresDepartamentos = [
    'Informática',        'Mecánica',        'Electricidad',
    'Automoción',         'Grado Básico',    'Telecomunicaciones',
    'Robótica',           'Primaria',         'Infantil',
    'Secundaria',         'Bachillerato',     'SAT',
    'Mantenimiento',      'Premio Don Bosco', 'Formación',
    'Administración'
];

// ── Datos de PRESUPUESTOS (€) ─────────────────────────────────
// Sustituir por datos reales desde la API / BD
const presupuestosTotal = [
    18000, 22000, 15000, 20000, 12000,
    16000, 14000, 25000, 10000, 30000,
    28000,  8000, 11000,  5000, 13000,
    19000
];
const presupuestosGastado = [
    11200, 17800,  9500, 14300,  6000,
    10500,  8200, 19000,  7800, 22000,
    15000,  4500,  7200,  3100,  9000,
    12000
];

// ── Datos de INVERSIÓN (€) ────────────────────────────────────
const inversionTotal = [
    35000, 40000, 28000, 32000, 18000,
    25000, 22000, 15000, 12000, 45000,
    38000, 10000, 20000,  8000, 17000,
    30000
];
const inversionEjecutado = [
    22000, 31000, 14000, 20000,  9000,
    18000, 11000, 10000,  5500, 30000,
    25000,  6000, 13000,  4000, 11000,
    18500
];

// ── Colores ───────────────────────────────────────────────────
const COLOR_GASTADO    = '#c96464f3';
const COLOR_TOTAL      = '#82a87ce7';

// ── Formatear euros ───────────────────────────────────────────
function fmt(val) {
    return val.toLocaleString('es-ES') + ' €';
}

// ── Calcular disponible/pendiente ─────────────────────────────
function calcResto(total, gastado) {
    return total.map((t, i) => Math.max(0, t - gastado[i]));
}

// ── Plugin personalizado para el tooltip ──────────────────────
// Muestra: Total, Gastado y Disponible para el departamento
function makeTooltipPlugin(totalArr, gastadoArr, labelGastado, labelResto) {
    return {
        id: 'customTooltip',
        afterInit(chart) {
            chart._customTotal   = totalArr;
            chart._customGastado = gastadoArr;
            chart._labelGastado  = labelGastado;
            chart._labelResto    = labelResto;
        }
    };
}

// ── Opciones comunes ──────────────────────────────────────────
function getOptions(totalArr, gastadoArr, labelGastado, labelResto) {
    return {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    // Título: nombre del departamento
                    title: function(items) {
                        return items[0].label;
                    },
                    // Cuerpo: siempre muestra Total, Gastado y Disponible
                    beforeBody: function() { return null; },
                    label: function() { return null; },   // anulamos la línea por dataset
                    afterBody: function(items) {
                        const i      = items[0].dataIndex;
                        const total  = totalArr[i];
                        const gast   = gastadoArr[i];
                        const resto  = Math.max(0, total - gast);
                        const pct    = total > 0 ? Math.round((gast / total) * 100) : 0;
                        return [
                            `Total:        ${fmt(total)}`,
                            `${labelGastado}:   ${fmt(gast)}  (${pct}%)`,
                            `${labelResto}: ${fmt(resto)}`
                        ];
                    }
                },
                // Estilos del tooltip
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
                ticks: {
                    color: '#444',
                    font: { size: 11, weight: '600' }
                },
                grid: { display: false },
                border: { display: false }
            }
        }
    };
}

// ── Gráfica 1: Presupuestos ───────────────────────────────────
const ctxPres = document.getElementById('chartPresupuestosAdmin').getContext('2d');

new Chart(ctxPres, {
    type: 'bar',
    data: {
        labels: nombresDepartamentos,
        datasets: [
            {
                label: 'Gastado',
                data: presupuestosGastado,
                backgroundColor: COLOR_GASTADO,
                borderRadius: { topLeft: 4, bottomLeft: 4 },
                borderSkipped: false,
                order: 1
            },
            {
                label: 'Disponible',
                data: calcResto(presupuestosTotal, presupuestosGastado),
                backgroundColor: COLOR_TOTAL,
                borderRadius: { topRight: 4, bottomRight: 4 },
                borderSkipped: false,
                order: 2
            }
        ]
    },
    options: getOptions(presupuestosTotal, presupuestosGastado, 'Gastado', 'Disponible')
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

// ── Gráfica 2: Planes de Inversión ───────────────────────────
const ctxInv = document.getElementById('chartInversionAdmin').getContext('2d');

new Chart(ctxInv, {
    type: 'bar',
    data: {
        labels: nombresDepartamentos,
        datasets: [
            {
                label: 'Ejecutado',
                data: inversionEjecutado,
                backgroundColor: COLOR_GASTADO,
                borderRadius: { topLeft: 4, bottomLeft: 4 },
                borderSkipped: false,
                order: 1
            },
            {
                label: 'Pendiente',
                data: calcResto(inversionTotal, inversionEjecutado),
                backgroundColor: COLOR_TOTAL,
                borderRadius: { topRight: 4, bottomRight: 4 },
                borderSkipped: false,
                order: 2
            }
        ]
    },
    options: getOptions(inversionTotal, inversionEjecutado, 'Ejecutado', 'Pendiente')
});
