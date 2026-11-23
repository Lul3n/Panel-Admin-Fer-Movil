import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createNotification } from "../services/notifications";
import { PUSH_FAILED_MESSAGE } from "../services/push";
import { listAllPublications } from "../services/publications";
import "../styles/PublicationForm.css";

const AUDIENCES = [
  { value: "general", label: "General" },
  { value: "scholars", label: "Becarios" },
  { value: "applicants", label: "Aspirantes" },
];

const MAX_MESSAGE = 300;

function NewNotification() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("general");
  const [publicationId, setPublicationId] = useState("");
  const [publications, setPublications] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await listAllPublications();
      // only published ones, the apps can't read the rest
      setPublications(all.filter((p) => p.status === "published"));
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const pushSent = await createNotification({
        title: title.trim(),
        message: message.trim(),
        target,
        publicationId,
      });
      if (!pushSent) window.alert(PUSH_FAILED_MESSAGE);
      navigate("/notifications");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la notificación. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <form className="publication-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva notificación</h1>
          <p className="page-subtitle">
            Crea un aviso o recordatorio para mostrarlo en la pestaña de notificaciones de la app.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/notifications" className="btn-cancel">Cancelar</Link>
          <button type="submit" className="btn-save" disabled={saving}>
            Crear notificación
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <div className="card">
          <h2 className="card-title">Contenido de la notificación</h2>

          <label className="field-label">Título</label>
          <input
            className="field-input"
            placeholder="Ej. Recordatorio: renovación de becas"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="field-label">Mensaje</label>
          <textarea
            className="field-textarea"
            placeholder="Escribe aquí el mensaje de la notificación..."
            value={message}
            maxLength={MAX_MESSAGE}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="char-count">{message.length} / {MAX_MESSAGE}</div>

          <label className="field-label">Publicación relacionada (opcional)</label>
          <select
            className="field-select"
            value={publicationId}
            onChange={(e) => setPublicationId(e.target.value)}
          >
            <option value="">Ninguna</option>
            {publications.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <p className="field-hint">
            Si la publicación se despublica o se borra, esta notificación también se borra.
          </p>
        </div>

        <div className="form-side">
          <div className="card">
            <h2 className="card-title">Configuración</h2>

            <label className="field-label">Audiencia</label>
            {AUDIENCES.map((a) => (
              <label
                key={a.value}
                className={target === a.value ? "radio-option selected" : "radio-option"}
              >
                <input
                  type="radio"
                  name="audience"
                  value={a.value}
                  checked={target === a.value}
                  onChange={() => setTarget(a.value)}
                />
                {a.label}
              </label>
            ))}
          </div>

          <div className="card">
            <h2 className="card-title">Vista previa</h2>
            <div className="preview-card">
              <div className="preview-head">
                <span>{title || "Título de la notificación"}</span>
                <span className="preview-time">Ahora</span>
              </div>
              <p className="preview-text">
                {message || "El mensaje se mostrará aquí..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default NewNotification;
