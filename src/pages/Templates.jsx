import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BottomNav from "../components/BottomNav";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { Lock, Search } from "lucide-react";

function ThumbIframe({ template }) {
  return (
    <iframe
      title={template.name}
      srcDoc={`<style>html,body{margin:0;padding:0;overflow:hidden;}${template.css}</style>${template.html_structure}`}
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: "500px",
        height: "500px",
        transform: "scale(var(--thumb-scale))",
        transformOrigin: "top left",
        border: "none",
      }}
      ref={(el) => {
        if (el) {
          const container = el.parentElement;
          const scale = container.offsetWidth / 500;
          el.style.setProperty("--thumb-scale", scale);
        }
      }}
    />
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]); // "free" | "premium"

  useEffect(() => {
    supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Templates fetch error:", error);
        setTemplates(data || []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    return [...new Set(templates.map((t) => t.category))];
  }, [templates]);

  const featured = useMemo(
    () => templates.filter((t) => t.is_featured),
    [templates],
  );

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const haystack = `${t.name} ${t.category}`.toLowerCase();
      const matchesQuery =
        query.trim() === "" || haystack.includes(query.trim().toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(t.category);
      const matchesPlan =
        selectedPlans.length === 0 ||
        (selectedPlans.includes("free") && !t.is_premium) ||
        (selectedPlans.includes("premium") && t.is_premium);
      return matchesQuery && matchesCategory && matchesPlan;
    });
  }, [templates, query, selectedCategories, selectedPlans]);

  const featuredVisible =
    selectedCategories.length === 0 &&
    selectedPlans.length === 0 &&
    query === "";

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-10 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            color: "#1A1A1A",
          }}
        >
          Templates
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>
          Pick one and make it yours.
        </p>
      </div>

      {/* Top Bar */}
      <div className="px-6 flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            color="#6B6B6B"
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E8E8E8" }}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 shrink-0">
          <MultiSelectDropdown
            label="Category"
            options={categories.map((c) => ({
              value: c,
              label: c.replace("-", " "),
            }))}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
          <MultiSelectDropdown
            label="Plan"
            options={[
              { value: "free", label: "Free" },
              { value: "premium", label: "Premium" },
            ]}
            selected={selectedPlans}
            onChange={setSelectedPlans}
          />
        </div>
      </div>

      {/* Featured section */}
      {featured.length > 0 && featuredVisible && (
        <div className="mb-6">
          <p
            className="px-6 text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "#6B6B6B" }}
          >
            Featured
          </p>
          <div
            className="px-6 flex gap-4 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {featured.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/templates/${t.id}`)}
                className="shrink-0 rounded-2xl border overflow-hidden text-left cursor-pointer hover:shadow-md transition"
                style={{ borderColor: "#E8E8E8", width: "160px" }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ paddingBottom: "100%" }}
                >
                  <ThumbIframe template={t} />
                  {t.is_premium && (
                    <div
                      className="absolute top-2 right-2 p-1.5 rounded-full z-10"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <Lock size={12} color="white" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "#1A1A1A" }}
                  >
                    {t.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="px-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "#6B6B6B" }}>
            No templates match your search.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/templates/${t.id}`)}
                className="rounded-2xl border overflow-hidden text-left hover:shadow-md transition cursor-pointer"
                style={{ borderColor: "#E8E8E8" }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{ paddingBottom: "100%" }}
                >
                  <ThumbIframe template={t} />
                  {t.is_premium && (
                    <div
                      className="absolute top-2 right-2 p-1.5 rounded-full z-10"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <Lock size={12} color="white" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#1A1A1A" }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{ color: "#6B6B6B" }}
                  >
                    {t.category.replace("-", " ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
