// src/main.js
import './style.css'
import { supabase } from './supabase.js';
import { mostrarRegistro } from './register.js';
import { mostrarLogin } from './login.js';
import { mostrarMVP } from './mvp.js';
import { mostrarUser } from './user.js';
import { mostrarAdmin } from './admin.js';

// Funciones de navegación disponibles
const routes = {
    'registro': mostrarRegistro,
    'login': mostrarLogin,
    'calendario': mostrarMVP,  // Cambiado de 'actividades' a 'calendario'
    'usuarios': mostrarUser,
    'admin': mostrarAdmin
};

async function cerrarSesion() {
    await supabase.auth.signOut();
    await cargarMenu();
    mostrarLogin();
}

// Control de navegación según el estado del usuario
export async function cargarMenu() {
    const menu = document.getElementById("menu");
    const { data: { user } } = await supabase.auth.getUser();

    // Si NO hay usuario logueado
    if (!user) {
        menu.innerHTML = `
            <div class="menu-container">
                <button class="menu-btn" data-action="registro">Registrarse</button>
                <button class="menu-btn" data-action="login">Iniciar sesión</button>
            </div>
        `;
    } else {
        // Usuario logueado
        menu.innerHTML = `
            <div class="menu-container">
                <button class="menu-btn" data-action="calendario">📅 Mi Calendario</button>
                <button class="menu-btn" data-action="usuarios">👤 Perfil</button>
                ${user.email === 'admin@mail.com' ? '<button class="menu-btn admin" data-action="admin">⚙️ Admin</button>' : ''}
                <button class="menu-btn logout" data-action="logout">🚪 Cerrar sesión</button>
            </div>
        `;
    }

    // Asignación de event listeners
    menu.querySelectorAll('button').forEach(button => {
        const action = button.getAttribute('data-action');
        if (action === 'logout') {
            button.addEventListener('click', cerrarSesion);
        } else if (routes[action]) {
            button.addEventListener('click', routes[action]);
        }
    });
}

// Llamamos la función apenas cargue la página
document.addEventListener("DOMContentLoaded", async () => {
    await cargarMenu();
    
    // Mostrar login por defecto si no hay usuario
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        mostrarLogin();
    } else {
        mostrarMVP(); // Mostrar calendario por defecto
    }
});