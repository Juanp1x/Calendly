// src/login.js
import { supabase } from './supabase.js';
import { mostrarRegistro } from './register.js';

export function mostrarLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="login-container fade-in">
            <div class="login-card">
                <div class="login-logo">📚</div>
                <h1 class="login-title">Bienvenido</h1>
                <p class="login-subtitle">Inicia sesión en tu cuenta</p>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="correo">Email</label>
                        <input type="email" id="correo" name="correo" class="form-control" placeholder="tu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="Tu contraseña" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
                </form>
                
                <div class="login-links mt-2">
                    <p>¿No tienes cuenta? <a href="#" class="login-link" id="ir-registro">Regístrate aquí</a></p>
                </div>
                
                <p id="error" class="mensaje error mt-2 hidden"></p>
            </div>
        </div>
    `;

    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error');
    const irRegistro = document.getElementById('ir-registro');

    // Ir al registro
    irRegistro.addEventListener('click', (e) => {
        e.preventDefault();
        mostrarRegistro();
    });

    // Enviar login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        errorMsg.classList.add('hidden');
        
        const correo = form.correo.value.trim();
        const password = form.password.value.trim();

        if (!correo || !password) {
            errorMsg.textContent = 'Por favor completa todos los campos.';
            errorMsg.classList.remove('hidden');
            return;
        }

        // Iniciar sesión en Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: password,
        });

        if (error) {
            errorMsg.textContent = 'Error al iniciar sesión: ' + error.message;
            errorMsg.classList.remove('hidden');
            return;
        }

        // Usuario autenticado - recargar para mostrar menú actualizado
        location.reload();
    });
}