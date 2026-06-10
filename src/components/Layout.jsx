import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, FileText, LogOut, ShieldCheck, Tags, Menu, X } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    // 1. Estado para controlar si el menú está abierto o cerrado en móvil
    const [menuAbierto, setMenuAbierto] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

    // 2. Función para cerrar el menú automáticamente al hacer clic en un enlace (solo afecta en móvil)
    const cerrarMenu = () => {
        setMenuAbierto(false);
    };

    const menuItems = [
        { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
        { path: '/ordenes', name: 'Gestión de Órdenes', icon: FileText, roles: ['ADMIN', 'RECEPCION'] },
        { path: '/clientes', name: 'Directorio Clientes', icon: Users, roles: ['ADMIN', 'RECEPCION'] },
        { path: '/taller', name: 'Panel de Taller', icon: Wrench, roles: ['ADMIN', 'TALLER'] },
        { path: '/usuarios', name: 'Control de Acceso', icon: ShieldCheck, roles: ['ADMIN'] },
        { path: '/categorias', name: 'Tipos de Trabajo', icon: Tags, roles: ['ADMIN'] },
    ];

    return (
        <div className="flex h-screen bg-hidratec-light overflow-hidden">
            
            {/* --- FONDO OSCURO (OVERLAY) MÓVIL --- */}
            {/* Solo aparece en pantallas pequeñas cuando el menú está abierto */}
            {menuAbierto && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
                    onClick={cerrarMenu}
                ></div>
            )}

            {/* --- BARRA LATERAL (SIDEBAR) --- */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-hidratec-dark text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 
                ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* CABECERA DEL SIDEBAR CON LOGO */}
                <div className="border-b border-gray-800 bg-hidratec-primary flex flex-col items-center justify-center relative">
                    <img 
                        src="/hidratec-logo.png" 
                        alt="Logo HIDRATEC" 
                        className="w-full h-auto object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                    {/* Botón de cerrar (X) que solo se ve en móvil */}
                    <button 
                        onClick={cerrarMenu} 
                        className="md:hidden absolute top-4 right-4 text-hidratec-dark hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                    {menuItems.map((item) => (
                        item.roles.includes(usuario.rol) && (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                onClick={cerrarMenu} // Cierra el menú al navegar
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                    location.pathname.startsWith(item.path) 
                                    ? 'bg-hidratec-primary text-hidratec-dark font-bold shadow-md' 
                                    : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    ))}
                </nav>

                {/* PIE DEL SIDEBAR (Usuario y Logout) */}
                <div className="p-4 border-t border-gray-800 bg-black/20">
                    <div className="mb-4 px-2">
                        <p className="text-sm font-bold text-gray-100 truncate">{usuario.nombre}</p>
                        <span className="inline-block px-2 py-1 mt-1 text-[10px] font-bold text-white bg-hidratec-secondary rounded-full tracking-wide">
                            {usuario.rol}
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-2 py-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* --- CONTENEDOR DERECHO (Encabezado móvil + Contenido Principal) --- */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* ENCABEZADO MÓVIL (Solo visible en pantallas pequeñas) */}
                <header className="bg-white shadow-sm p-4 md:hidden flex items-center justify-between z-10 relative">
                    <button 
                        onClick={() => setMenuAbierto(true)} 
                        className="p-2 -ml-2 text-hidratec-dark rounded-lg hover:bg-gray-100"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-black text-hidratec-primary text-xl">HIDRATEC</span>
                    <div className="w-6"></div> {/* Espaciador para centrar el título */}
                </header>

                {/* CONTENIDO PRINCIPAL */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            
        </div>
    );
}