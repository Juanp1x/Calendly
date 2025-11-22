// src/mvp.js
import { supabase } from './supabase.js';

export function mostrarMVP() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>📅 Mi Calendario Calendly</h2>
            
            <div class="calendario-container">
                <!-- Gestión de Disponibilidad -->
                <div class="card">
                    <h3>🕐 Gestionar Mi Disponibilidad</h3>
                    <form id="disponibilidad-form">
                        <div class="form-group">
                            <label>Día de la semana:</label>
                            <select name="dia_semana" required>
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                                <option value="7">Domingo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Hora de inicio:</label>
                            <input type="time" name="hora_inicio" required>
                        </div>
                        <div class="form-group">
                            <label>Hora de fin:</label>
                            <input type="time" name="hora_fin" required>
                        </div>
                        <button type="submit" class="btn-primary">➕ Agregar Disponibilidad</button>
                    </form>
                </div>

                <!-- Vista de Semana -->
                <div class="card">
                    <div class="calendario-header">
                        <button id="prevWeek" class="btn-outline">← Semana Anterior</button>
                        <h3 id="semanaActual">Cargando...</h3>
                        <button id="nextWeek" class="btn-outline">Siguiente Semana →</button>
                    </div>
                    
                    <div class="vista-semana" id="vistaSemana">
                        <!-- Los días se generan dinámicamente -->
                    </div>
                </div>

                <!-- Mis Reuniones Agendadas -->
                <div class="card">
                    <h3>👥 Mis Reuniones Agendadas</h3>
                    <div id="lista-reuniones">
                        Cargando reuniones...
                    </div>
                </div>
            </div>

            <p id="mensaje" style="text-align:center;"></p>
        </section>
    `;

    let fechaActual = new Date();
    const mensaje = document.getElementById('mensaje');

    // Inicializar calendario
    cargarVistaSemana(fechaActual);
    cargarReuniones();
    configurarEventosCalendly();

    async function configurarEventosCalendly() {
        // Navegación de semanas
        document.getElementById('prevWeek').addEventListener('click', () => {
            fechaActual.setDate(fechaActual.getDate() - 7);
            cargarVistaSemana(fechaActual);
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            fechaActual.setDate(fechaActual.getDate() + 7);
            cargarVistaSemana(fechaActual);
        });

        // Formulario de disponibilidad
        document.getElementById('disponibilidad-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await agregarDisponibilidad();
        });
    }

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
        
        if (!usuario) {
            mensaje.textContent = '⚠️ Debes iniciar sesión para ver la disponibilidad';
            return;
        }
        
        // Cargar disponibilidad del profesor
        const { data: disponibilidad, error } = await supabase
            .from('disponibilidad')
            .select('*')
            .eq('profesor_id', usuario.id)
            .eq('activo', true);
        
        if (error) {
            console.error('Error cargando disponibilidad:', error);
            mensaje.textContent = '❌ Error al cargar disponibilidad';
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
        for (const disp of dispDia) {
            const inicio = new Date(`1970-01-01T${disp.hora_inicio}`);
            const fin = new Date(`1970-01-01T${disp.hora_fin}`);
            
            let horaActual = new Date(inicio);
            
            while (horaActual < fin) {
                const horaStr = horaActual.toTimeString().substring(0, 5);
                const fechaCompleta = new Date(fecha);
                fechaCompleta.setHours(horaActual.getHours(), horaActual.getMinutes());
                
                // Verificar si ya está reservado - CORREGIDO
                const { data: reservaExistente, error: reservaError } = await supabase
                    .from('reuniones')
                    .select('id')
                    .eq('fecha_reunion', fechaCompleta.toISOString())
                    .eq('profesor_id', disp.profesor_id);
                
                if (reservaError) {
                    console.error('Error verificando reserva:', reservaError);
                }
                
                const estaReservado = reservaExistente && reservaExistente.length > 0;
                
                html += `
                    <div class="slot-horario ${estaReservado ? 'reservado' : 'disponible'}" 
                         data-fecha="${fechaCompleta.toISOString()}"
                         data-profesor="${disp.profesor_id}">
                        ${horaStr}
                        ${!estaReservado ? 
                            `<button class="btn-reservar" onclick="reservarSlot('${fechaCompleta.toISOString()}', '${disp.profesor_id}')">
                                Reservar
                            </button>` : 
                            '<span class="reservado-text">Reservado</span>'
                        }
                    </div>
                `;
                
                horaActual.setMinutes(horaActual.getMinutes() + 30);
            }
        }
        
        elemento.innerHTML = html || '<p class="no-disponible">No hay horarios</p>';
    }

    async function agregarDisponibilidad() {
        const form = document.getElementById('disponibilidad-form');
        const { data: userData } = await supabase.auth.getUser();
        const usuario = userData.user;
        
        if (!usuario) {
            mensaje.textContent = '⚠️ Debes iniciar sesión';
            return;
        }
        
        const diaSemana = parseInt(form.dia_semana.value);
        const horaInicio = form.hora_inicio.value;
        const horaFin = form.hora_fin.value;
        
        const { error } = await supabase
            .from('disponibilidad')
            .insert({
                profesor_id: usuario.id,
                dia_semana: diaSemana,
                hora_inicio: horaInicio,
                hora_fin: horaFin,
                activo: true
            });
        
        if (error) {
            mensaje.textContent = '❌ Error al agregar disponibilidad: ' + error.message;
        } else {
            mensaje.textContent = '✅ Disponibilidad agregada correctamente';
            form.reset();
            cargarVistaSemana(fechaActual); // Recargar vista
        }
    }

    async function cargarReuniones() {
        const lista = document.getElementById('lista-reuniones');
        const { data: userData } = await supabase.auth.getUser();
        const usuario = userData.user;
        
        if (!usuario) {
            lista.innerHTML = '<p>Debes iniciar sesión para ver tus reuniones</p>';
            return;
        }
        
        const { data: reuniones, error } = await supabase
            .from('reuniones')
            .select('*')
            .or(`profesor_id.eq.${usuario.id},estudiante_id.eq.${usuario.id}`)
            .order('fecha_reunion', { ascending: true });
        
        if (error) {
            lista.innerHTML = 'Error al cargar reuniones';
            return;
        }
        
        if (!reuniones.length) {
            lista.innerHTML = '<p>No tienes reuniones agendadas</p>';
            return;
        }
        
        let html = '';
        reuniones.forEach(reunion => {
            const fecha = new Date(reunion.fecha_reunion);
            html += `
                <div class="reunion-item">
                    <strong>${reunion.titulo}</strong>
                    <p>${fecha.toLocaleString('es-ES')}</p>
                    <p>Estado: ${reunion.estado}</p>
                    ${reunion.descripcion ? `<p>${reunion.descripcion}</p>` : ''}
                </div>
                <hr>
            `;
        });
        
        lista.innerHTML = html;
    }
}

// Función global para reservar slots - CORREGIDA COMPLETAMENTE
window.reservarSlot = async function(fechaISO, profesorId = null) {
    const fecha = new Date(fechaISO);
    const { data: userData } = await supabase.auth.getUser();
    const usuario = userData.user;
    
    if (!usuario) {
        alert('Debes iniciar sesión para reservar');
        return;
    }
    
    // Si no tenemos el profesorId, lo buscamos
    if (!profesorId) {
        const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
        const horaStr = fecha.toTimeString().substring(0, 5);
        
        const { data: disponibilidad, error: dispError } = await supabase
            .from('disponibilidad')
            .select('profesor_id')
            .eq('dia_semana', diaSemana)
            .eq('activo', true)
            .lte('hora_inicio', horaStr)
            .gte('hora_fin', horaStr);
        
        if (dispError) {
            console.error('Error buscando disponibilidad:', dispError);
            alert('Error al buscar disponibilidad: ' + dispError.message);
            return;
        }
        
        if (!disponibilidad || disponibilidad.length === 0) {
            alert('Error: No se encontró disponibilidad para este horario');
            return;
        }
        
        profesorId = disponibilidad[0].profesor_id;
    }
    
    const titulo = prompt('Título de la reunión:');
    if (!titulo) return;
    
    const descripcion = prompt('Descripción (opcional):');
    
    // Insertar reunión
    const { data, error } = await supabase
        .from('reuniones')
        .insert({
            profesor_id: profesorId,
            estudiante_id: usuario.id,
            fecha_reunion: fecha.toISOString(),
            titulo: titulo,
            descripcion: descripcion,
            estado: 'confirmada',
            duracion_minutos: 30
        });
    
    if (error) {
        alert('Error al reservar: ' + error.message);
    } else {
        alert('✅ Reunión reservada exitosamente para ' + fecha.toLocaleString());
        mostrarMVP(); // Recargar vista completa
    }
};