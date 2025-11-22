// src/calendario.js
import { supabase } from './supabase.js';

let fechaActual = new Date();

export function mostrarCalendario() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>🕐 Mi Calendario de Clases</h2>
            
            <div class="calendario-container">
                <div class="calendario-header">
                    <button id="prevWeek">← Semana Anterior</button>
                    <h3 id="semanaActual">Cargando...</h3>
                    <button id="nextWeek">Siguiente Semana →</button>
                </div>
                
                <div class="vista-semana" id="vistaSemana">
                    <!-- Los días se generan dinámicamente -->
                </div>
                
                <div class="acciones-calendario">
                    <button id="gestionarDisponibilidad">📅 Gestionar Mi Disponibilidad</button>
                    <button id="verReunionesAgendadas">👥 Ver Mis Reuniones</button>
                </div>
            </div>
            
            <div id="modalContainer"></div>
        </section>
    `;

    fechaActual = new Date();
    cargarVistaSemana(fechaActual);
    configurarEventosCalendario(); // Cambiar nombre
}

// Cambiar nombre de la función
const configurarEventosCalendario = () => {
    document.getElementById('prevWeek').addEventListener('click', () => {
        fechaActual.setDate(fechaActual.getDate() - 7);
        cargarVistaSemana(fechaActual);
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        fechaActual.setDate(fechaActual.getDate() + 7);
        cargarVistaSemana(fechaActual);
    });

    document.getElementById('gestionarDisponibilidad').addEventListener('click', mostrarDisponibilidad);
    document.getElementById('verReunionesAgendadas').addEventListener('click', mostrarReunionesAgendadas);
};

async function cargarVistaSemana(fecha) {
    const contenedor = document.getElementById('vistaSemana');
    const semanaActual = document.getElementById('semanaActual');
    
    // Calcular inicio de semana (lunes)
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - fecha.getDay() + 1);
    
    // Formatear texto de la semana
    const opciones = { month: 'long', day: 'numeric' };
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    
    semanaActual.textContent = 
        `${inicioSemana.toLocaleDateString('es-ES', opciones)} - ${finSemana.toLocaleDateString('es-ES', opciones)}`;
    
    // Generar días de la semana
    let html = '<div class="dias-semana">';
    
    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        
        html += `
            <div class="dia-calendario">
                <div class="dia-header">
                    <strong>${dia.toLocaleDateString('es-ES', { weekday: 'short' })}</strong>
                    <span>${dia.getDate()}</span>
                </div>
                <div class="horarios-dia" data-fecha="${dia.toISOString().split('T')[0]}">
                    <!-- Horarios disponibles se cargan aquí -->
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    contenedor.innerHTML = html;
    
    // Cargar disponibilidad para cada día
    await cargarDisponibilidadSemana(inicioSemana);
}

async function cargarDisponibilidadSemana(inicioSemana) {
    const { data: userData } = await supabase.auth.getUser();
    const usuario = userData.user;
    
    if (!usuario) return;
    
    // Cargar disponibilidad del profesor
    const { data: disponibilidad, error } = await supabase
        .from('disponibilidad')
        .select('*')
        .eq('profesor_id', usuario.id)
        .eq('activo', true);
    
    if (error) {
        console.error('Error cargando disponibilidad:', error);
        return;
    }
    
    // Para cada día, mostrar horarios disponibles
    const dias = document.querySelectorAll('.horarios-dia');
    
    dias.forEach(async (diaElement, index) => {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + index);
        
        await mostrarHorariosDisponibles(diaElement, fecha, disponibilidad);
    });
}

async function mostrarHorariosDisponibles(elemento, fecha, disponibilidad) {
    const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay(); // Domingo = 7
    
    // Filtrar disponibilidad para este día
    const dispDia = disponibilidad.filter(d => d.dia_semana === diaSemana);
    
    if (dispDia.length === 0) {
        elemento.innerHTML = '<p class="no-disponible">No disponible</p>';
        return;
    }
    
    let html = '';
    
    // Generar slots de 30 minutos
    dispDia.forEach(disp => {
        const inicio = new Date(`1970-01-01T${disp.hora_inicio}`);
        const fin = new Date(`1970-01-01T${disp.hora_fin}`);
        
        let horaActual = new Date(inicio);
        
        while (horaActual < fin) {
            const horaStr = horaActual.toTimeString().substring(0, 5);
            const fechaCompleta = new Date(fecha);
            fechaCompleta.setHours(horaActual.getHours(), horaActual.getMinutes());
            
            html += `
                <div class="slot-horario" data-fecha="${fechaCompleta.toISOString()}">
                    ${horaStr}
                    <button class="btn-reservar" onclick="reservarSlot('${fechaCompleta.toISOString()}')">
                        Reservar
                    </button>
                </div>
            `;
            
            horaActual.setMinutes(horaActual.getMinutes() + 30);
        }
    });
    
    elemento.innerHTML = html || '<p class="no-disponible">No hay horarios</p>';
}

// Función para reservar un slot
window.reservarSlot = async function(fechaISO) {
    const fecha = new Date(fechaISO);
    const { data: userData } = await supabase.auth.getUser();
    const usuario = userData.user;
    
    if (!usuario) {
        alert('Debes iniciar sesión para reservar');
        return;
    }
    
    const titulo = prompt('Título de la reunión:');
    if (!titulo) return;
    
    const descripcion = prompt('Descripción (opcional):');
    
    // Insertar reunión
    const { data, error } = await supabase
        .from('reuniones')
        .insert({
            profesor_id: usuario.id,
            estudiante_id: usuario.id,
            fecha_reunion: fecha.toISOString(),
            titulo: titulo,
            descripcion: descripcion,
            estado: 'confirmada'
        });
    
    if (error) {
        alert('Error al reservar: ' + error.message);
    } else {
        alert('✅ Reunión reservada exitosamente para ' + fecha.toLocaleString());
        mostrarCalendario(); // Recargar vista
    }
};

// Añadir estas funciones placeholder si no existen
function mostrarDisponibilidad() {
    alert('Funcionalidad de gestión de disponibilidad');
}

function mostrarReunionesAgendadas() {
    alert('Funcionalidad de ver reuniones agendadas');
}