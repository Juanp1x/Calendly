// src/register.js
import { supabase } from './supabase.js';

export function mostrarRegistro() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="register-container fade-in">
            <div class="register-card">
                <h1 class="register-title">Crear Cuenta</h1>
                <p class="register-subtitle">Regístrate para comenzar</p>
                
                <form id="registro-form" class="register-form">
                    <div class="form-group">
                        <label for="nombre">Nombre completo</label>
                        <input type="text" id="nombre" name="nombre" class="form-control" placeholder="Tu nombre completo" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="correo">Email</label>
                        <input type="email" id="correo" name="correo" class="form-control" placeholder="tu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="Crea una contraseña segura" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="telefono">Teléfono</label>
                        <input type="tel" id="telefono" name="telefono" class="form-control" placeholder="+57 300 123 4567">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Crear Cuenta</button>
                </form>
                
                <div class="login-links mt-2">
                    <p>¿Ya tienes cuenta? <a href="#" class="login-link" id="ir-login">Inicia sesión aquí</a></p>
                </div>
                
                <p id="error" class="mensaje error mt-2 hidden"></p>
            </div>
        </div>
    `;

    const form = document.getElementById('registro-form');
    const errorMsg = document.getElementById('error');
    const irLogin = document.getElementById('ir-login');

    // Ir al login
    irLogin.addEventListener('click', (e) => {
        e.preventDefault();
        import('./login.js').then(module => {
            module.mostrarLogin();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');

        const nombre = form.nombre.value.trim();
        const correo = form.correo.value.trim();
        const password = form.password.value.trim();
        const telefono = form.telefono.value.trim();

        if (!nombre || !correo || !password) {
            errorMsg.textContent = 'Por favor completa todos los campos requeridos.';
            errorMsg.classList.remove('hidden');
            return;
        }

        // Crear usuario en Auth
        const { data: dataAuth, error: errorAuth } = await supabase.auth.signUp({
            email: correo,
            password: password,
        });

        if (errorAuth) {
            errorMsg.textContent = `Error en autenticación: ${errorAuth.message}`;
            errorMsg.classList.remove('hidden');
            return;
        }

        const uid = dataAuth.user?.id;
        if (!uid) {
            errorMsg.textContent = 'No se pudo obtener el ID del usuario.';
            errorMsg.classList.remove('hidden');
            return;
        }

        // Insertar en tabla "estudiantes"
        const { error: errorInsert } = await supabase.from('estudiantes').insert({
            id: uid, nombre, correo, telefono
        });

        if (errorInsert) {
            errorMsg.textContent = 'Error guardando datos del estudiante: ' + errorInsert.message;
            errorMsg.classList.remove('hidden');
            return;
        }

        alert('✅ Registro exitoso. Revisa tu email para confirmar la cuenta.');
        import('./login.js').then(module => {
            module.mostrarLogin();
        });
    });
}