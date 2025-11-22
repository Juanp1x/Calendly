// src/disponibilidad.js
import { supabase } from './supabase.js';

export function mostrarDisponibilidad() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <section>
            <h2>📅 Gestionar Mi Disponibilidad</h2>
            
            <div class="disponibilidad-form">
                <h3>Agregar Horario Disponible</h3>
                <form id="formDisponibilidad">
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
                        <label>Hora inicio:</label>
                        <input type="time" name="hora_inicio" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Hora fin:</label>
                        <input type="time" name="hora_fin" required>
                    </div>
                    
                    <button type="submit">➕ Agregar Horario</button>
                </form>
            </div>
            
            <div class="horarios-activos">
                <h3>Mis Horarios Activos</h3>
                <div id="listaHorarios"></div>
            </div>
        </section>
    `;

    cargarHorariosActivos();
    configurarFormDisponibilidad();
}

async function cargarHorariosActivos() {
    const { data: userData } = await supabase.auth.getUser();
    const usuario = userData.user;
    
    if (!usuario) return;
    
    const { data: horarios, error } = await supabase
        .from('disponibilidad')
        .select('*')
        .eq('profesor_id', usuario.id)
        .eq('activo', true)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });
    
    const lista = document.getElementById('listaHorarios');
    
    if (error || !horarios.length) {
        lista.innerHTML = '<p>No tienes horarios configurados</p>';
        return;
    }
    
    const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    lista.innerHTML = horarios.map(horario => `
        <div class="horario-item">
            <span>${dias[horario.dia_semana]} - ${horario.hora_inicio} a ${horario.hora_fin}</span>
            <button onclick="eliminarHorario('${horario.id}')" class="btn-eliminar">❌ Eliminar</button>
        </div>
    `).join('');
}

async function configurarFormDisponibilidad() {
    const form = document.getElementById('formDisponibilidad');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { data: userData } = await supabase.auth.getUser();
        const usuario = userData.user;
        
        if (!usuario) {
            alert('Debes iniciar sesión');
            return;
        }
        
        const formData = new FormData(form);
        const diaSemana = parseInt(formData.get('dia_semana'));
        const horaInicio = formData.get('hora_inicio');
        const horaFin = formData.get('hora_fin');
        
        // Validar que hora fin sea mayor que hora inicio
        if (horaInicio >= horaFin) {
            alert('La hora de fin debe ser mayor a la hora de inicio');
            return;
        }
        
        const { error } = await supabase
            .from('disponibilidad')
            .insert({
                profesor_id: usuario.id,
                dia_semana: diaSemana,
                hora_inicio: horaInicio + ':00',
                hora_fin: horaFin + ':00'
            });
        
        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            alert('✅ Horario agregado exitosamente');
            form.reset();
            cargarHorariosActivos();
        }
    });
}

// Función global para eliminar horarios
window.eliminarHorario = async function(id) {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;
    
    const { error } = await supabase
        .from('disponibilidad')
        .update({ activo: false })
        .eq('id', id);
    
    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        cargarHorariosActivos();
    }
};