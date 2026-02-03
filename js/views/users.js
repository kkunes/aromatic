/**
 * User Management View
 * Only accessible by Administrator
 */

const usersView = {
    usuarios: [],

    async render() {
        this.usuarios = await db.getCollection('usuarios');
        const currentUser = db.getCurrentUser();

        if (currentUser.rol !== 'admin') {
            return `
                <div class="error-view fade-in" style="text-align: center; padding: 100px 20px;">
                    <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: #dc2626;">
                        <i data-lucide="shield-off" style="width: 40px; height: 40px;"></i>
                    </div>
                    <h1 style="font-family: 'Playfair Display', serif; color: var(--primary);">Acceso Denegado</h1>
                    <p style="color: var(--text-muted);">Solo el administrador puede gestionar los perfiles de usuario.</p>
                </div>
            `;
        }

        return `
            <div class="users-view fade-in">
                <div class="view-header" style="margin-bottom: 30px;">
                    <div>
                        <h1 style="margin: 0; font-family: 'Playfair Display', serif;">Gestión de Equipo</h1>
                        <p style="color: var(--text-muted); margin-top: 4px;">Configura los niveles de acceso y perfiles del personal.</p>
                    </div>
                    <button class="btn-primary" onclick="usersView.showUserModal()" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="user-plus"></i> NUEVO USUARIO
                    </button>
                </div>

                <div class="users-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                    ${this.usuarios.map(user => `
                        <div class="card user-card" style="padding: 0; overflow: hidden; border-radius: 24px; position: relative; transition: all 0.3s ease;">
                            <div style="height: 80px; background: linear-gradient(135deg, var(--primary), var(--primary-light));"></div>
                            <div style="padding: 24px; margin-top: -40px; text-align: center;">
                                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; border: 4px solid var(--bg-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.8rem; font-weight: 800; color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                    ${user.avatar || user.nombre.charAt(0).toUpperCase()}
                                </div>
                                <h3 style="margin: 0; font-family: 'Playfair Display', serif; color: var(--primary);">${user.nombre}</h3>
                                <div style="display: inline-block; margin: 8px 0; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; background: ${this.getRoleBadge(user.rol).bg}; color: ${this.getRoleBadge(user.rol).color};">
                                    ${user.rol}
                                </div>
                                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">@${user.usuario}</p>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                                    <button class="btn-secondary" onclick="usersView.showUserModal('${user.id}')" style="padding: 10px; border-radius: 12px; font-size: 0.85rem;">
                                        <i data-lucide="edit-2" style="width:14px; margin-right:5px;"></i> Editar
                                    </button>
                                    <button class="btn-secondary danger" onclick="usersView.deleteUser('${user.id}')" style="padding: 10px; border-radius: 12px; font-size: 0.85rem; color: #dc2626; border-color: #fecaca; background: #fff1f2;">
                                        <i data-lucide="trash-2" style="width:14px; margin-right:5px;"></i> Borrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getRoleBadge(rol) {
        switch (rol) {
            case 'admin': return { bg: '#dcfce7', color: '#166534' };
            case 'cajero': return { bg: '#fef9c3', color: '#854d0e' };
            case 'mesero': return { bg: '#dbeafe', color: '#1e40af' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    },

    bindEvents() {
        // No special global events
    },

    async showUserModal(id = null) {
        const user = id ? this.usuarios.find(u => u.id === id) : null;
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 450px;">
                <h2 style="margin-bottom: 24px; font-family: 'Playfair Display', serif; color: var(--primary);">
                    ${user ? 'Editar Perfil' : 'Nuevo Usuario'}
                </h2>
                
                <form id="userForm" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="input-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="userRealName" value="${user ? user.nombre : ''}" required class="large-input" style="font-size: 1rem; padding: 14px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="input-group">
                            <label>Nombre de Usuario</label>
                            <input type="text" id="userName" value="${user ? user.usuario : ''}" required class="large-input" style="font-size: 1rem; padding: 14px;">
                        </div>
                        <div class="input-group">
                            <label>Rol / Privilegios</label>
                            <select id="userRole" required class="large-input" style="font-size: 1rem; padding: 14px; cursor: pointer;">
                                <option value="mesero" ${user?.rol === 'mesero' ? 'selected' : ''}>Mesero</option>
                                <option value="cajero" ${user?.rol === 'cajero' ? 'selected' : ''}>Cajero</option>
                                <option value="admin" ${user?.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Contraseña (PIN de 4 dígitos)</label>
                        <input type="password" id="userPass" value="${user ? user.clave : ''}" required maxlength="4" class="large-input" style="font-size: 1rem; padding: 14px; text-align: center; letter-spacing: 5px;">
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 10px;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1; padding: 14px; border-radius: 12px;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 14px; border-radius: 12px; font-weight: 700;">
                            ${user ? 'GUARDAR CAMBIOS' : 'CREAR PERFIL'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('userForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('userRealName').value,
                usuario: document.getElementById('userName').value,
                rol: document.getElementById('userRole').value,
                clave: document.getElementById('userPass').value,
                avatar: document.getElementById('userRealName').value.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            };

            if (user) {
                await db.updateDocument('usuarios', user.id, data);
            } else {
                await db.addDocument('usuarios', data);
            }

            modal.classList.add('hidden');
            app.showToast('Usuario guardado correctamente');
            app.renderView('users');
        };
    },

    async deleteUser(id) {
        const currentUser = db.getCurrentUser();
        if (currentUser.rol !== 'admin') {
            return alert('No tienes permisos suficientes para eliminar usuarios.');
        }

        if (confirm('¿Estás seguro de eliminar este usuario? No podrá volver a iniciar sesión.')) {
            await db.deleteDocument('usuarios', id);
            app.renderView('users');
        }
    }
};
