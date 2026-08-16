import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOption(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const displayLabel =
    selected.length === 0 ? label : `${label} (${selected.length})`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{
          backgroundColor: selected.length > 0 ? "#EEF1FF" : "white",
          color: selected.length > 0 ? "#3D5AFE" : "#6B6B6B",
          borderColor: selected.length > 0 ? "#3D5AFE" : "#E8E8E8",
        }}
      >
        {displayLabel}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-9 w-48 bg-white rounded-xl shadow-lg border z-50 py-1 max-h-64 overflow-y-auto"
          style={{ borderColor: "#E8E8E8" }}
        >
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50"
                style={{ color: "#1A1A1A" }}
              >
                <span className="capitalize">{opt.label}</span>
                {isSelected && <Check size={14} color="#3D5AFE" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
