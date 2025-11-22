// src/user.js
import { supabase } from "./supabase.js";

export async function mostrarUser() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <section>
            <h2>👤 Perfil del Usuario</h2>
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar">👤</div>
                </div>
                
                <form id="user-form" class="profile-form">
                    <div class="form-group">
                        <label>Nombre completo</label>
                        <input type="text" id="nombre" class="form-control" required />
                    </div>
                    
                    <div class="form-group">
                        <label>Correo electrónico</label>
                        <input type="email" id="correo" class="form-control" disabled />
                    </div>
                    
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" id="telefono" class="form-control" />
                    </div>
                    
                    <button type="submit" class="btn btn-primary">💾 Actualizar datos</button>
                </form>
                
                <p id="mensaje" class="mensaje"></p>
                
                <div class="profile-stats">
                    <h3>Mis Estadísticas</h3>
                    <div id="estadisticas">
                        Cargando estadísticas...
                    </div>
                </div>
            </div>
        </section>
    `;

    const form = document.getElementById("user-form");
    const mensaje = document.getElementById("mensaje");
    const estadisticas = document.getElementById("estadisticas");

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        mensaje.textContent = "❌ Debes iniciar sesión";
        return;
    }

    // Cargar datos del estudiante
    const { data: estudiante, error } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("correo", user.email)
        .single();

    if (error) {
        mensaje.textContent = "❌ Error cargando datos: " + error.message;
        return;
    }

    // Llenar formulario
    document.getElementById("nombre").value = estudiante.nombre || "";
    document.getElementById("correo").value = estudiante.correo || "";
    document.getElementById("telefono").value = estudiante.telefono || "";

    // Cargar estadísticas
    await cargarEstadisticas(user.id, estadisticas);

    // Actualizar datos
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById("nombre").value.trim();
        const telefono = document.getElementById("telefono").value.trim();

        const { error: updateError } = await supabase
            .from("estudiantes")
            .update({ nombre, telefono })
            .eq("correo", user.email);

        if (updateError) {
            mensaje.textContent = "❌ Error al actualizar: " + updateError.message;
            mensaje.className = "mensaje error";
        } else {
            mensaje.textContent = "✅ Datos actualizados correctamente";
            mensaje.className = "mensaje success";
        }
    });
}

async function cargarEstadisticas(userId, container) {
    // Contar reuniones del usuario
    const { data: reuniones, error } = await supabase
        .from("reuniones")
        .select("id")
        .or(`profesor_id.eq.${userId},estudiante_id.eq.${userId}`);

    if (error) {
        container.innerHTML = "Error cargando estadísticas";
        return;
    }

    const totalReuniones = reuniones?.length || 0;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${totalReuniones}</div>
                <div class="stat-label">Reuniones Totales</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${Math.ceil(totalReuniones * 0.5)}</div>
                <div class="stat-label">Horas de Reunión</div>
            </div>
        </div>
    `;
}