import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { getAdminProfile } from "../services/admin";
import "../styles/PublicationForm.css";
import "../styles/Settings.css";

function Settings() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getAdminProfile().then(setProfile);
  }, []);

  async function handlePasswordReset() {
    setMessage("");
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setMessage(`Te enviamos un correo a ${profile.email} para cambiar tu contraseña.`);
    } catch (err) {
      console.error(err);
      setMessage("No se pudo enviar el correo. Intenta de nuevo.");
    }
    setSending(false);
  }

  if (!profile) return <p>Cargando...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Opciones generales del panel administrativo.</p>
        </div>
      </div>

      <div className="card settings-card">
        <div className="settings-section">
          <h2>Cuenta de administrador</h2>
          <p className="settings-label">Nombre</p>
          <p className="settings-value">{profile.name}</p>
          <p className="settings-label">Correo electrónico</p>
          <p className="settings-value">{profile.email}</p>
        </div>

        <div className="settings-section">
          <h2>Seguridad</h2>
          <div className="settings-row">
            <p className="settings-text">Cambia la contraseña de acceso al panel.</p>
            <button className="btn-cancel" onClick={handlePasswordReset} disabled={sending}>
              Cambiar contraseña
            </button>
          </div>
          {message && <p className="settings-message">{message}</p>}
        </div>

        <div className="settings-section">
          <h2>Permisos</h2>
          <p className="settings-text">
            Solo los administradores autorizados pueden publicar, editar o eliminar contenido.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
