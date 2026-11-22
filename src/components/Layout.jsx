import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { LayoutDashboard, FileText, BarChart3, SlidersHorizontal, LogOut, Bell, Gauge } from "lucide-react";
import { auth } from "../services/firebase";
import { getAdminProfile } from "../services/admin";
import logo from "../assets/logo.png";
import "../styles/Layout.css";

function Layout() {
  const [name, setName] = useState("Administrador");

  useEffect(() => {
    getAdminProfile().then((profile) => setName(profile.name));
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Fundación Esposos Rodríguez" />
          <span>FUNDACIÓN<br />ESPOSOS RODRÍGUEZ</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard"><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/publications"><FileText size={18} /> Publicaciones</NavLink>
          <NavLink to="/notifications"><Bell size={18} /> Notificaciones</NavLink>
          <NavLink to="/statistics"><BarChart3 size={18} /> Estadísticas</NavLink>
          <NavLink to="/usage"><Gauge size={18} /> Uso del plan</NavLink>
          <NavLink to="/settings"><SlidersHorizontal size={18} /> Configuración</NavLink>
        </nav>

        <button className="sidebar-logout" onClick={() => signOut(auth)}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      <div className="layout-content">
        <div className="topbar-user">
          <div className="user-chip">
            <span className="avatar">{name.charAt(0).toUpperCase()}</span>
            {name}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
