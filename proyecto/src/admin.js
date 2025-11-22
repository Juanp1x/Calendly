// src/admin.js
import { supabase } from "./supabase.js";

export async function mostrarAdmin() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <section>
            <h2>Panel Administrativo</h2>
            <div class="admin-container">
                <div class="admin-section">
                    <h3>👥 Lista de Estudiantes</h3>
                    <div id="estudiantes"></div>
                </div>
                
                <div class="admin-section">
                    <h3>📅 Reuniones Programadas</h3>
                    <div id="reuniones"></div>
                </div>
                
                <div class="admin-section">
                    <h3>🕐 Disponibilidades</h3>
                    <div id="disponibilidades"></div>
                </div>
                
                <p id="mensaje"></p>
            </div>
        </section>
    `;

    const mensaje = document.getElementById('mensaje');
    const estudiantesDiv = document.getElementById('estudiantes');
    const reunionesDiv = document.getElementById('reuniones');
    const disponibilidadesDiv = document.getElementById('disponibilidades');

    // Verificar admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.email !== 'admin@mail.com') {
        app.innerHTML = "<p>⛔ No tienes permisos para acceder a este panel.</p>";
        return;
    }

    // Cargar estudiantes
    await cargarEstudiantes(estudiantesDiv);
    
    // Cargar reuniones
    await cargarReuniones(reunionesDiv);
    
    // Cargar disponibilidades
    await cargarDisponibilidades(disponibilidadesDiv);
}

async function cargarEstudiantes(container) {
    const { data: estudiantes, error } = await supabase
        .from("estudiantes")
        .select("id, nombre, correo, telefono, creado_en")
        .order("nombre", { ascending: true });

    if (error) {
        container.innerHTML = `<p>Error cargando estudiantes: ${error.message}</p>`;
        return;
    }

    container.innerHTML = estudiantes.length === 0 
        ? "<p>No hay estudiantes registrados.</p>"
        : `
            <div class="lista-estudiantes">
                ${estudiantes.map(est => `
                    <div class="estudiante-item">
                        <div class="estudiante-info">
                            <strong>${escapeHtml(est.nombre)}</strong>
                            <div>${escapeHtml(est.correo)}</div>
                            <div>${escapeHtml(est.telefono || "Sin teléfono")}</div>
                            <small>Registrado: ${new Date(est.creado_en).toLocaleDateString()}</small>
                        </div>
                        <button class="btn-eliminar" onclick="eliminarEstudiante('${est.id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
}

async function cargarReuniones(container) {
    const { data: reuniones, error } = await supabase
        .from("reuniones")
        .select(`
            *,
            estudiantes:estudiante_id(nombre, correo)
        `)
        .order("fecha_reunion", { ascending: true });

    if (error) {
        container.innerHTML = `<p>Error cargando reuniones: ${error.message}</p>`;
        return;
    }

    container.innerHTML = reuniones.length === 0 
        ? "<p>No hay reuniones programadas.</p>"
        : `
            <div class="lista-reuniones">
                ${reuniones.map(reunion => `
                    <div class="reunion-item">
                        <div class="reunion-info">
                            <strong>${escapeHtml(reunion.titulo)}</strong>
                            <div>${new Date(reunion.fecha_reunion).toLocaleString()}</div>
                            <div>Estudiante: ${reunion.estudiantes?.nombre || 'N/A'}</div>
                            <div>Estado: ${escapeHtml(reunion.estado)}</div>
                            ${reunion.descripcion ? `<div>${escapeHtml(reunion.descripcion)}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
}

async function cargarDisponibilidades(container) {
    const { data: disponibilidades, error } = await supabase
        .from("disponibilidad")
        .select("*")
        .eq("activo", true)
        .order("dia_semana", { ascending: true });

    if (error) {
        container.innerHTML = `<p>Error cargando disponibilidades: ${error.message}</p>`;
        return;
    }

    const dias = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    container.innerHTML = disponibilidades.length === 0 
        ? "<p>No hay disponibilidades configuradas.</p>"
        : `
            <div class="lista-disponibilidades">
                ${disponibilidades.map(disp => `
                    <div class="disponibilidad-item">
                        <div class="disponibilidad-info">
                            <strong>${dias[disp.dia_semana]}</strong>
                            <div>${disp.hora_inicio} - ${disp.hora_fin}</div>
                            <small>Profesor ID: ${disp.profesor_id}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
}

// Función global para eliminar estudiantes
window.eliminarEstudiante = async function(id) {
    if (!confirm('¿Estás seguro de eliminar este estudiante? Esta acción también eliminará sus reuniones.')) return;
    
    const { error } = await supabase
        .from("estudiantes")
        .delete()
        .eq("id", id);
    
    if (error) {
        alert('Error eliminando estudiante: ' + error.message);
    } else {
        alert('✅ Estudiante eliminado correctamente');
        mostrarAdmin(); // Recargar panel
    }
};

function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}