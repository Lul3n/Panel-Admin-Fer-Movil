import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPublication, publishPublication } from "../services/publications";
import { validateAttachments, driveImageUrl } from "../utils/validation";
import { dateFromInput } from "../utils/dates";
import Attachments from "../components/Attachments";
import Expiration from "../components/Expiration";
import PublicationPreview from "../components/PublicationPreview";
import "../styles/PublicationForm.css";

const AUDIENCES = [
  { value: "general", label: "General" },
  { value: "scholars", label: "Becarios" },
  { value: "applicants", label: "Aspirantes" },
];

const MAX_DESCRIPTION = 3000;

function NewPublication() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");
  const [status, setStatus] = useState("published");
  const [linkImg, setLinkImg] = useState("");
  const [documents, setDocuments] = useState([]);
  const [expiresEnabled, setExpiresEnabled] = useState(false);
  const [expiresDate, setExpiresDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const image = driveImageUrl(linkImg.trim());
    const check = validateAttachments(image, documents);
    if (check.error) {
      setError(check.error);
      return;
    }

    const expiresAt = expiresEnabled ? dateFromInput(expiresDate) : null;
    if (status === "published" && expiresAt && expiresAt < new Date()) {
      setError("La fecha de expiración ya pasó. Elige una fecha futura o desactiva la expiración.");
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      type,
      linkImg: image,
      documents: check.documents,
      expiresAt,
    };

    setSaving(true);
    try {
      const ref = await createPublication(data);
      if (status === "published") {
        await publishPublication({ id: ref.id, ...data });
      }
      navigate("/publications");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la publicación. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <form className="publication-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva publicación</h1>
          <p className="page-subtitle">Crea un aviso para mostrarlo en la aplicación móvil.</p>
        </div>
        <div className="header-actions">
          <Link to="/publications" className="btn-cancel">Cancelar</Link>
          <button type="submit" className="btn-save" disabled={saving}>
            {status === "published" ? "Publicar" : "Guardar borrador"}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <div className="card">
          <h2 className="card-title">Contenido de la publicación</h2>

          <label className="field-label">Título</label>
          <input
            className="field-input"
            placeholder="Ej. Renovación de becas 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="field-label">Descripción</label>
          <textarea
            className="field-textarea"
            placeholder="Escribe aquí el contenido completo de tu publicación..."
            value={description}
            maxLength={MAX_DESCRIPTION}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="char-count">{description.length} / {MAX_DESCRIPTION}</div>

          <Attachments
            linkImg={linkImg}
            setLinkImg={setLinkImg}
            documents={documents}
            setDocuments={setDocuments}
          />
        </div>

        <div className="form-side">
          <div className="card">
            <h2 className="card-title">Configuración</h2>

            <label className="field-label">Audiencia</label>
            {AUDIENCES.map((a) => (
              <label
                key={a.value}
                className={type === a.value ? "radio-option selected" : "radio-option"}
              >
                <input
                  type="radio"
                  name="audience"
                  value={a.value}
                  checked={type === a.value}
                  onChange={() => setType(a.value)}
                />
                {a.label}
              </label>
            ))}

            <label className="field-label">Estado</label>
            <select
              className="field-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="published">Publicar ahora</option>
              <option value="draft">Guardar como borrador</option>
            </select>

            <Expiration
              enabled={expiresEnabled}
              setEnabled={setExpiresEnabled}
              date={expiresDate}
              setDate={setExpiresDate}
            />
          </div>

          <PublicationPreview title={title} description={description} linkImg={linkImg} />
        </div>
      </div>
    </form>
  );
}

export default NewPublication;
