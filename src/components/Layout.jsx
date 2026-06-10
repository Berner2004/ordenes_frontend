import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, FileText, LogOut, ShieldCheck, Tags } from 'lucide-react';
export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    };

  

// ...
    const menuItems = [
        { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
        { path: '/ordenes', name: 'Gestión de Órdenes', icon: FileText, roles: ['ADMIN', 'RECEPCION'] },
        { path: '/clientes', name: 'Directorio Clientes', icon: Users, roles: ['ADMIN', 'RECEPCION'] },
        { path: '/taller', name: 'Panel de Taller', icon: Wrench, roles: ['ADMIN', 'TALLER'] },
        { path: '/usuarios', name: 'Control de Acceso', icon: ShieldCheck, roles: ['ADMIN'] },
        { path: '/categorias', name: 'Tipos de Trabajo', icon: Tags, roles: ['ADMIN'] },
    ];
// ...

    return (
        <div className="flex h-screen bg-hidratec-light">
            {/* --- BARRA LATERAL (SIDEBAR) --- */}
            <aside className="w-64 bg-hidratec-dark text-white flex flex-col shadow-2xl relative z-10">
                
                {/* CABECERA DEL SIDEBAR CON LOGO (Sin margen blanco) */}
                <div className="border-b border-gray-800 bg-hidratec-primary flex flex-col items-center justify-center">
                    <img 
                        src="/hidratec-logo.png" 
                        alt="Logo HIDRATEC" 
                        className="w-full h-auto object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                    {menuItems.map((item) => (
                        item.roles.includes(usuario.rol) && (
                            <Link 
                                key={item.path} 
                                to={item.path}
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
                        className="flex items-center space-x-3 w-full px-2 py-2 text-gray-400 hover:text-hidratec-secondary transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}