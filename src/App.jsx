import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importaciones de Pantallas y Componentes
// ⚠️ IMPORTANTE: Asegúrate de que el archivo físico en tu carpeta se llame "Login.jsx" (con L mayúscula)
import Login from './pages/login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Categorias from './pages/Categorias';
import Ordenes from './pages/Ordenes';
import NuevaOrden from './pages/NuevaOrden';
import Clientes from './pages/Clientes';
import Taller from './pages/Taller';

// Middleware de protección de rutas en el Frontend
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas (Protegidas por Layout y Token) */}
        <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/ordenes/nueva" element={<NuevaOrden />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/taller" element={<Taller />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/categorias" element={<Categorias />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;