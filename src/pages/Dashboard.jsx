import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Bell, Filter } from "lucide-react";
import { listAllPublications } from "../services/publications";
import { AUDIENCE_LABELS } from "../utils/constants";
import {
  sumViews, viewsByAudience, countThisMonth, formatNumber,
  viewsInMonth, availableMonths, monthLabel
} from "../utils/stats";
import "../styles/Publications.css";
import "../styles/PublicationForm.css";
import "../styles/Stats.css";

function Dashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  // months hidden by the filter (empty = show all)
  const [hidden, setHidden] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setList(await listAllPublications());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Cargando...</p>;

  const published = list.filter((p) => p.status === "published");
  const drafts = list.filter((p) => p.status === "draft").length;
  const totalViews = sumViews(list);
  const thisMonth = countThisMonth(list);
  const monthName = new Date().toLocaleDateString("es-MX", { month: "long" });
  const byAudience = viewsByAudience(list);
  const maxAudience = Math.max(1, ...Object.values(byAudience));
  const allMonths = availableMonths(list);
  const months = allMonths.filter((key) => !hidden.includes(key));
  const maxMonth = Math.max(1, ...months.map((key) => viewsInMonth(list, key)));

  function toggleMonth(key) {
    setHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumen general</h1>
          <p className="page-subtitle">Actividad reciente y rendimiento de las publicaciones.</p>
        </div>
        <div className="header-buttons">
          <Link to="/notifications/new" className="btn-new secondary">
            <Bell size={16} /> Nueva notificación
          </Link>
          <Link to="/publications/new" className="btn-new">
            <Plus size={16} /> Nueva publicación
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{list.length}</div>
          <div className="stat-label">Publicaciones totales</div>
          <div className="stat-note">+{thisMonth} este mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatNumber(totalViews)}</div>
          <div className="stat-label">Visualizaciones totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{thisMonth}</div>
          <div className="stat-label">Publicaciones este mes</div>
          <div className="stat-note" style={{ textTransform: "capitalize" }}>{monthName}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{published.length}</div>
          <div className="stat-label">Publicaciones activas</div>
          <div className="stat-note">{drafts} en borrador</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h2 className="card-title">Por audiencia</h2>
          {Object.keys(AUDIENCE_LABELS).map((type) => (
            <div className="bar-row compact" key={type}>
              <span className="bar-name">{AUDIENCE_LABELS[type]}</span>
              <div className="bar-track">
                <div
                  className="bar-fill top"
                  style={{ width: `${(byAudience[type] / maxAudience) * 100}%` }}
                />
              </div>
              <span className="bar-value">{formatNumber(byAudience[type])}</span>
            </div>
          ))}
        </div>

        <div className="card scroll-card">
          <div className="card-header">
            <h2 className="card-title">Vistas por mes</h2>
            <div className="card-header-actions">
              <button type="button" className="btn-export small" onClick={() => setFilterOpen(!filterOpen)}>
                <Filter size={14} /> Filtrar meses
              </button>
              <Link to="/statistics" className="card-link">Ver estadísticas</Link>
            </div>
          </div>
          {filterOpen && (
            <div className="month-chips">
              <button
                type="button"
                className={hidden.length === 0 ? "month-chip active" : "month-chip"}
                onClick={() => setHidden([])}
              >
                Todos
              </button>
              {allMonths.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={hidden.includes(key) ? "month-chip" : "month-chip active"}
                  onClick={() => toggleMonth(key)}
                >
                  {monthLabel(key)}
                </button>
              ))}
            </div>
          )}
          {months.length === 0 && <p className="empty-state">Elige al menos un mes.</p>}
          {months.map((key) => (
            <div className="bar-row compact" key={key}>
              <span className="bar-name" style={{ textTransform: "capitalize" }}>{monthLabel(key)}</span>
              <div className="bar-track">
                <div
                  className="bar-fill top"
                  style={{ width: `${(viewsInMonth(list, key) / maxMonth) * 100}%` }}
                />
              </div>
              <span className="bar-value">{formatNumber(viewsInMonth(list, key))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
