export default function Controls({ settings, onChange, onGenerate }) {
  const update = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="p-3 border-t space-y-2" style={{ borderColor: "#E8E8E8" }}>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={settings.width}
          onChange={(e) => update("width", parseInt(e.target.value) || 800)}
          placeholder="Width"
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "#E8E8E8" }}
        />
        <input
          type="number"
          value={settings.height}
          onChange={(e) => update("height", parseInt(e.target.value) || 600)}
          placeholder="Height"
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "#E8E8E8" }}
        />
      </div>
      <select
        value={settings.fileType}
        onChange={(e) => update("fileType", e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm"
        style={{ borderColor: "#E8E8E8" }}
      >
        <option value="png">PNG</option>
        <option value="jpeg">JPEG</option>
      </select>
      <button
        onClick={onGenerate}
        className="w-full py-3 rounded-xl font-semibold text-white"
        style={{ backgroundColor: "#3D5AFE" }}
      >
        Generate Image
      </button>
    </div>
  );
}
