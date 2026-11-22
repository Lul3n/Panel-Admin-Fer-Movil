import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Eye } from "lucide-react";
import {
  getPublication, updatePublication,
  publishPublication, unpublishPublication, syncNotification
} from "../services/publications";
import { validateAttachments, driveImageUrl } from "../utils/validation";
import { dateFromInput, formatInputDate } from "../utils/dates";
import Attachments from "../components/Attachments";
import Expiration from "../components/Expiration";
import PublicationPreview from "../components/PublicationPreview";
import "../styles/PublicationForm.css";

const MAX_DESCRIPTION = 3000;

function formatLongDate(date) {
  return date.toDate().toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function EditPublication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("general");
  const [status, setStatus] = useState("draft");
  const [linkImg, setLinkImg] = useState("");
  const [documents, setDocuments] = useState([]);
  const [expiresEnabled, setExpiresEnabled] = useState(false);
  const [expiresDate, setExpiresDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getPublication(id);
      if (p) {
        setOriginal(p);
        setTitle(p.title);
        setDescription(p.description);
        setType(p.type);
        setStatus(p.status);
        setLinkImg(p.linkImg || "");
        setDocuments(p.documents || []);
        setExpiresEnabled(!!p.expiresAt);
        setExpiresDate(p.expiresAt ? formatInputDate(p.expiresAt.toDate()) : "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

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
      await updatePublication(id, data);
      if (status !== original.status) {
        if (status === "published") {
          await publishPublication({ id, ...data });
        } else if (status === "draft") {
          await unpublishPublication(id);
        }
      } else if (status === "published") {
        await syncNotification({ id, ...data });
      }
      navigate("/publications");
    } catch (err) {
      console.error(err);
      setError("No se pudieron guardar los cambios. Intenta de nuevo.");
      setSaving(false);
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (!original) {
    return (
      <div>
        <h1 className="page-title">Publicación no encontrada</h1>
        <Link to="/publications" className="btn-cancel">Volver a publicaciones</Link>
      </div>
    );
  }

  return (
    <form className="publication-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Editar publicación</h1>
          <p className="page-subtitle">Actualiza la información de una publicación existente.</p>
        </div>
        <div className="header-actions">
          <Link to="/publications" className="btn-cancel">Cancelar</Link>
          <button type="submit" className="btn-save" disabled={saving}>
            <Check size={16} /> Guardar
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <div className="card">
          <h2 className="card-title">Contenido</h2>

          <label className="field-label">Título</label>
          <input
            className="field-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="field-label">Descripción</label>
          <textarea
            className="field-textarea"
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
            <h2 className="card-title">Opciones de publicación</h2>

            <label className="field-label">Audiencia</label>
            <select
              className="field-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="general">General</option>
              <option value="scholars">Becarios</option>
              <option value="applicants">Aspirantes</option>
            </select>

            <label className="field-label">Estado</label>
            <select
              className="field-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="published">Publicada</option>
              <option value="draft">Borrador</option>
              {original.status === "expired" && <option value="expired">Vencida</option>}
            </select>

            <Expiration
              enabled={expiresEnabled}
              setEnabled={setExpiresEnabled}
              date={expiresDate}
              setDate={setExpiresDate}
            />

            {original.publishedAt && (
              <p className="field-hint">Publicado el {formatLongDate(original.publishedAt)}</p>
            )}
          </div>

          <PublicationPreview title={title} description={description} linkImg={linkImg} />

          <div className="card">
            <h2 className="card-title">Rendimiento</h2>
            <div className="performance">
              <Eye size={20} />
              {(original.views || 0).toLocaleString("en-US")} visualizaciones
            </div>
            <p className="field-hint">Dato visible solo para administradores</p>
          </div>
        </div>
      </div>
    </form>
  );
}

export default EditPublication;
