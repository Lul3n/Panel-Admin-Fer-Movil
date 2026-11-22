import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { listAllPublications } from "../services/publications";
import { AUDIENCE_LABELS } from "../utils/constants";
import { formatNumber, availableYears, periodViews } from "../utils/stats";
import "../styles/PublicationForm.css";
import "../styles/Stats.css";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABELS = { published: "Publicada", draft: "Borrador", expired: "Vencida" };

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Downloads the publications as a CSV file that opens in Excel
function exportReport(list, year, month) {
  const header = ["Título", "Audiencia", "Estado", "Fecha", "Vistas"];
  const rows = list.map((p) => {
    const date = p.publishedAt || p.createdAt;
    return [
      p.title,
      AUDIENCE_LABELS[p.type],
      STATUS_LABELS[p.status] || p.status,
      date ? date.toDate().toLocaleDateString("es-MX") : "",
      periodViews(p, year, month),
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  // the BOM makes Excel read the accents correctly
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte-publicaciones.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function Statistics() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState("all");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");

  useEffect(() => {
    async function load() {
      setList(await listAllPublications());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Cargando...</p>;

  const filtered = list.filter((p) => audience === "all" || p.type === audience);
  const published = filtered.filter((p) => p.status === "published");
  const withViews = published.map((p) => ({ ...p, shownViews: periodViews(p, year, month) }));
  const totalViews = withViews.reduce((sum, p) => sum + p.shownViews, 0);
  const top = [...withViews].sort((a, b) => b.shownViews - a.shownViews).slice(0, 5);
  const maxViews = Math.max(1, ...top.map((p) => p.shownViews));
  const years = availableYears(list);
  const average = published.length === 0 ? 0 : Math.round(totalViews / published.length);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-subtitle">Consulta las visualizaciones de cada publicación.</p>
        </div>
        <button className="btn-export" onClick={() => exportReport(published, year, month)}>
          <Download size={16} /> Exportar reporte
        </button>
      </div>

      <div className="card filters">
        <div>
          <label className="field-label">Audiencia</label>
          <select
            className="field-select"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="general">General</option>
            <option value="scholars">Becarios</option>
            <option value="applicants">Aspirantes</option>
          </select>
        </div>
        <div>
          <label className="field-label">Año</label>
          <select className="field-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Mes</label>
          <select className="field-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">Todos</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={String(i + 1).padStart(2, "0")}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-number">{formatNumber(totalViews)}</div>
          <div className="stat-label">Visualizaciones totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatNumber(top[0]?.shownViews || 0)}</div>
          <div className="stat-label">Publicación más vista</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatNumber(average)}</div>
          <div className="stat-label">Promedio por publicación</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{published.length}</div>
          <div className="stat-label">Publicaciones activas</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Visualizaciones por publicación</h2>
        {top.length === 0 ? (
          <p className="empty-state">Todavía no hay publicaciones publicadas.</p>
        ) : (
          top.map((p, index) => (
            <div className="bar-row" key={p.id}>
              <span className="bar-name">{p.title}</span>
              <div className="bar-track">
                <div
                  className={index === 0 ? "bar-fill top" : "bar-fill"}
                  style={{ width: `${(p.shownViews / maxViews) * 100}%` }}
                />
              </div>
              <span className="bar-value">{formatNumber(p.shownViews)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Statistics;
