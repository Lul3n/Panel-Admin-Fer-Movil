// Optional expiration date, off by default
function Expiration({ enabled, setEnabled, date, setDate }) {
  return (
    <div>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Fecha de expiración
      </label>
      <input
        type="date"
        className="field-input"
        value={date}
        disabled={!enabled}
        required={enabled}
        onChange={(e) => setDate(e.target.value)}
      />
    </div>
  );
}

export default Expiration;
