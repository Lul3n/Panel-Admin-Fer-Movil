import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { listAllPublications } from "../services/publications";
import { listNotifications } from "../services/notifications";
import { listUsageDays } from "../services/usage";
import { estimateUsage, formatBytes, dayKey, PAGE_SIZE, ADMIN_LOADS_PER_DAY } from "../utils/quota";
import { formatNumber } from "../utils/stats";
import "../styles/PublicationForm.css";
import "../styles/Stats.css";
import "../styles/Settings.css";
import "../styles/Usage.css";

const CONSOLE_URL = "https://console.firebase.google.com/project/fer-movil/usage";

const MESSAGES = {
  green: {
    title: "Todavía no les conviene Blaze",
    text: "El uso está muy por debajo de los límites gratis del plan Spark.",
  },
  yellow: {
    title: "Vigilen el uso",
    text: "Algún consumo ya pasó la mitad de su límite gratis. Todavía no hace falta pagar, pero conviene revisar esta pantalla seguido.",
  },
  red: {
    title: "Ya les conviene Blaze",
    text: "Algún consumo está cerca de su límite gratis. En Spark, al llegar al límite la app deja de cargar datos hasta el día siguiente; con Blaze seguiría funcionando. Blaze incluye la misma cuota gratis, así que solo pagarían lo que pase del límite.",
  },
};

// Only with Blaze, no matter the usage
const BLAZE_ONLY = [
  "Cambiar a vencidas las publicaciones sin abrir el panel (función programada).",
  "Subir imágenes y documentos desde el panel (Cloud Storage).",
];

function formatValue(meter) {
  return meter.unit === "bytes" ? formatBytes(meter.value) : formatNumber(meter.value);
}

function formatLimit(meter) {
  return meter.unit === "bytes" ? formatBytes(meter.limit) : formatNumber(meter.limit);
}

function barClass(percent) {
  if (percent >= 80) return "bar-fill red";
  if (percent >= 50) return "bar-fill yellow";
  return "bar-fill top";
}

function Usage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const from = new Date();
      from.setDate(from.getDate() - 13);
      const [publications, notifications, usageDays] = await Promise.all([
        listAllPublications(),
        listNotifications(),
        listUsageDays(dayKey(from)),
      ]);
      setData({ publications, notifications, usageDays });
    }
    load();
  }, []);

  if (!data) return <p>Cargando...</p>;

  const usage = estimateUsage(data.publications, data.notifications, data.usageDays);
  const message = MESSAGES[usage.level];
  const maxOpensDay = Math.max(1, ...data.usageDays.map((d) => d.appOpens));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Uso del plan</h1>
          <p className="page-subtitle">
            Estimación del consumo de Firebase comparado con los límites gratis del plan Spark.
          </p>
        </div>
        <a className="btn-export" href={CONSOLE_URL} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> Ver uso real en Firebase
        </a>
      </div>

      <div className={`card usage-banner ${usage.level}`}>
        <span className="usage-dot" />
        <div>
          <h2 className="card-title">{message.title}</h2>
          <p className="settings-text">{message.text}</p>
          <p className="settings-text">
            Con el uso actual, en Blaze pagarían aproximadamente{" "}
            <strong>${usage.blazeCostPerMonth.toFixed(2)} USD al mes</strong>.
            {usage.maxOpens > 0 && (
              <> El plan gratis aguanta unas <strong>{formatNumber(usage.maxOpens)} aperturas de la app al día</strong>.</>
            )}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        {usage.meters.map((m) => (
          <div className="stat-card" key={m.label}>
            <div className="stat-number">{formatValue(m)}</div>
            <div className="stat-label">{m.label} (límite {formatLimit(m)})</div>
            <div className="bar-track usage-track">
              <div className={barClass(m.percent)} style={{ width: `${Math.min(100, m.percent)}%` }} />
            </div>
            <div className="stat-note">{m.percent < 0.1 ? "menos de 0.1" : m.percent.toFixed(1)}% del límite</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <h2 className="card-title">Aperturas de la app por día</h2>
          {data.usageDays.length === 0 ? (
            <p className="empty-state">
              Todavía no hay datos del contador de aperturas. Mientras tanto, el cálculo usa
              las vistas de este mes.
            </p>
          ) : (
            data.usageDays.map((d) => (
              <div className="bar-row compact" key={d.day}>
                <span className="bar-name">{d.day.slice(5).split("-").reverse().join("/")}</span>
                <div className="bar-track">
                  <div className="bar-fill top" style={{ width: `${(d.appOpens / maxOpensDay) * 100}%` }} />
                </div>
                <span className="bar-value">{formatNumber(d.appOpens)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Cómo se calcula</h2>
          <ul className="usage-list">
            <li>
              {usage.hasCounter
                ? `Aperturas: día más alto de la última semana (${formatNumber(usage.peakOpens)}).`
                : `Aperturas: no hay contador todavía, se toma una por vista (${formatNumber(usage.peakOpens)} al día).`}
            </li>
            <li>Cada apertura lee hasta {PAGE_SIZE} publicaciones y {PAGE_SIZE} notificaciones ({usage.readsPerOpen} lecturas hoy).</li>
            <li>Cada vista de una publicación es 1 lectura y 1 escritura ({usage.views.toFixed(1)} vistas al día este mes).</li>
            <li>El panel suma unas {ADMIN_LOADS_PER_DAY} cargas al día del administrador.</li>
            <li>Los límites gratis se reinician cada día alrededor de la medianoche (hora del Pacífico).</li>
          </ul>
          <p className="field-hint">Es una estimación. El número exacto está en la consola de Firebase.</p>
        </div>
      </div>

      <div className="card usage-blaze">
        <h2 className="card-title">Solo existen con Blaze (sin importar el uso)</h2>
        <ul className="usage-list">
          {BLAZE_ONLY.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

export default Usage;
