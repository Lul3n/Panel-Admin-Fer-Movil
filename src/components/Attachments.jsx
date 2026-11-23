import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { isHttpsUrl, driveImageUrl } from "../utils/validation";

function Attachments({ linkImg, setLinkImg, documents, setDocuments }) {
  // URL that failed, the message goes away when the URL changes
  const [failedUrl, setFailedUrl] = useState("");
  const imageUrl = driveImageUrl(linkImg.trim());

  function updateDocument(index, field, value) {
    setDocuments(
      documents.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function removeDocument(index) {
    setDocuments(documents.filter((_, i) => i !== index));
  }

  function addDocument() {
    setDocuments([...documents, { name: "", url: "" }]);
  }

  return (
    <div>
      <label className="field-label">Imagen (URL)</label>
      <input
        className="field-input"
        placeholder="https://..."
        value={linkImg}
        onChange={(e) => setLinkImg(e.target.value)}
      />
      <p className="field-hint">
        Puedes pegar el enlace de Google Drive. La imagen debe estar compartida como
        "Cualquier persona con el enlace".
      </p>
      {isHttpsUrl(imageUrl) && (
        failedUrl === imageUrl ? (
          <p className="form-error image-error">
            No se pudo cargar la imagen. Revisa el enlace y que esté compartida
            como "Cualquier persona con el enlace".
          </p>
        ) : (
          <img
            className="image-check"
            src={imageUrl}
            alt="Imagen de la publicación"
            onError={() => setFailedUrl(imageUrl)}
          />
        )
      )}

      <label className="field-label">Archivos adjuntos</label>
      {documents.map((d, index) => (
        <div className="document-row" key={index}>
          <FileText size={20} />
          <input
            placeholder="Nombre (ej. Guía de renovación.pdf)"
            value={d.name}
            onChange={(e) => updateDocument(index, "name", e.target.value)}
          />
          <input
            placeholder="https://..."
            value={d.url}
            onChange={(e) => updateDocument(index, "url", e.target.value)}
          />
          <button
            type="button"
            className="icon-action danger"
            aria-label="Quitar documento"
            onClick={() => removeDocument(index)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button type="button" className="btn-add" onClick={addDocument}>
        <Plus size={16} /> Añadir documento
      </button>
    </div>
  );
}

export default Attachments;
