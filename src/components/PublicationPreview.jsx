import { FileText } from "lucide-react";
import { isHttpsUrl, driveImageUrl } from "../utils/validation";

// Card that shows how the publication will look in the app
function PublicationPreview({ title, description, linkImg }) {
  const image = driveImageUrl(linkImg.trim());

  return (
    <div className="card">
      <h2 className="card-title">Vista previa</h2>
      <div className="preview-card">
        <div className="preview-head">
          <span>{title || "Título de la publicación"}</span>
          <span className="preview-time">Ahora</span>
        </div>
        <p className="preview-text">
          {description ? description.slice(0, 120) : "El texto se mostrará aquí..."}
        </p>
        <div className="preview-image">
          {isHttpsUrl(image) ? (
            <img src={image} alt="Vista previa de la imagen" />
          ) : (
            <FileText size={24} />
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicationPreview;
