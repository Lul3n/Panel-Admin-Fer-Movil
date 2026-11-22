import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { listAllPublications, deletePublication } from "../services/publications";
import "../styles/Publications.css";

const PAGE_SIZE = 6;

const AUDIENCE_LABELS = {
  general: "General",
  scholars: "Becarios",
  applicants: "Aspirantes",
};

// lowercase and without accents, so "publicacion" finds "Publicación"
function normalize(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getTime(p) {
  const date = p.publishedAt || p.createdAt;
  return date ? date.toMillis() : 0;
}

function formatDate(p) {
  const date = p.publishedAt || p.createdAt;
  if (!date) return "";
  return date.toDate().toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Publications() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  async function loadPublications() {
    setList(await listAllPublications());
    setLoading(false);
  }

  useEffect(() => {
    loadPublications();
  }, []);

  async function handleDelete(id) {
    if (window.confirm("¿Seguro que quieres borrarla?")) {
      await deletePublication(id);
      loadPublications();
    }
  }

  const filtered = list
    .filter((p) => normalize(p.title).includes(normalize(search.trim())))
    .filter((p) => audience === "all" || p.type === audience);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "oldest") return getTime(a) - getTime(b);
    return getTime(b) - getTime(a);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // after deleting, the current page may no longer exist
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Publicaciones</h1>
          <p className="page-subtitle">Administra avisos de General, Becarios y Aspirantes.</p>
        </div>
        <Link to="/publications/new" className="btn-new">
          <Plus size={16} /> Nueva publicación
        </Link>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Buscar por título..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={audience}
            onChange={(e) => { setAudience(e.target.value); setPage(1); }}>
            <option value="all">Todas las audiencias</option>
            <option value="general">General</option>
            <option value="scholars">Becarios</option>
            <option value="applicants">Aspirantes</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="views">Más vistas</option>
          </select>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="table-wrapper">
          <table className="pub-table">
            <thead>
              <tr>
                <th>PUBLICACIÓN</th>
                <th>AUDIENCIA</th>
                <th>FECHA</th>
                <th>VISTAS</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No hay publicaciones con esos filtros.</td></tr>
              )}
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="pub-title">
                      {p.title}
                      {p.status === "draft" && <span className="draft-badge">Borrador</span>}
                      {p.status === "expired" && <span className="draft-badge">Vencida</span>}
                    </div>
                    <div className="pub-description">{p.description}</div>
                  </td>
                  <td><span className="audience-badge">{AUDIENCE_LABELS[p.type]}</span></td>
                  <td className="no-wrap">{formatDate(p)}</td>
                  <td>
                    <span className="views">
                      <Eye size={14} /> {(p.views || 0).toLocaleString("en-US")}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="icon-action" aria-label="Editar"
                        onClick={() => navigate(`/publications/${p.id}/edit`)}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-action danger" aria-label="Borrar"
                        onClick={() => handleDelete(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        <div className="table-footer">
          <span>Mostrando {visible.length} de {sorted.length} publicaciones</span>
          <div className="pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={n === currentPage ? "page-number active" : "page-number"}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Publications;