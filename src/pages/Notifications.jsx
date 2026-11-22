import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { listNotifications, deleteNotification } from "../services/notifications";
import { AUDIENCE_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/dates";
import "../styles/Publications.css";
import "../styles/PublicationForm.css";
import "../styles/Stats.css";

function Notifications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setList(await listNotifications());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (window.confirm("¿Seguro que quieres borrar esta notificación?")) {
      await deleteNotification(id);
      load();
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-subtitle">
            Consulta los avisos que ven los usuarios en la pestaña de notificaciones de la app.
          </p>
        </div>
        <Link to="/notifications/new" className="btn-new">
          <Plus size={16} /> Nueva notificación
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : list.length === 0 ? (
          <p className="empty-state">Todavía no hay notificaciones.</p>
        ) : (
          <div className="table-wrapper">
          <table className="pub-table">
            <thead>
              <tr>
                <th>NOTIFICACIÓN</th>
                <th>AUDIENCIA</th>
                <th>FECHA</th>
                <th>ORIGEN</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="pub-title">{n.title}</div>
                    <div className="pub-description">{n.message}</div>
                  </td>
                  <td><span className="audience-badge">{AUDIENCE_LABELS[n.target]}</span></td>
                  <td className="no-wrap">{formatDateTime(n.date)}</td>
                  <td>{n.publicationId ? "Automática" : "Manual"}</td>
                  <td>
                    <button
                      className="icon-action danger"
                      aria-label="Borrar"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
