import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { auth } from "../services/firebase";
import logo from "../assets/logo.png";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // same message for email or password on purpose
      setError("Correo o contraseña incorrectos");
    }
    setSubmitting(false);
  }

  return (
    <div className="login">
      <aside className="login-side">
        <img src={logo} alt="Fundación Esposos Rodríguez" className="login-logo" />
        <h1>Fundación Esposos Rodríguez</h1>
        <h2>Panel de administración</h2>
        <p>Gestiona publicaciones y consulta su alcance desde un solo lugar.</p>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleLogin}>
          <h3>Bienvenido</h3>
          <p className="login-subtitle">Inicia sesión para administrar el contenido de FER.</p>

          <label>Correo electrónico</label>
          <input type="email" placeholder="admin@fer.org.mx" value={email}
            onChange={(e) => setEmail(e.target.value)} required />

          <label>Contraseña</label>
          <div className="password-field">
            <input type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            Iniciar sesión
          </button>
          <p className="login-note">Acceso exclusivo para personal autorizado</p>
        </form>
        <footer>FER · Panel administrativo</footer>
      </main>
    </div>
  );
}

export default Login;