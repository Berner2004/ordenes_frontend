import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Categorias from './pages/Categorias';
// ... más abajo en tus rutas:

// Importamos las pantallas reales
import Ordenes from './pages/Ordenes';
import NuevaOrden from './pages/NuevaOrden';
import Clientes from './pages/Clientes';
import Taller from './pages/Taller';

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        
        <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        
          {/* Rutas reales de la aplicación */}
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

// ¡ESTA ES LA LÍNEA QUE TE FALTABA PARA QUE REACT NO SE QUEJE!
export default App;