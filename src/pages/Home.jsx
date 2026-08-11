// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Home as HomeIcon,
  LayoutTemplate,
  Code2,
  User,
  Sparkles,
  History,
  Zap,
  Bell
} from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showGuide, setShowGuide] = useState(false);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recentRenders, setRecentRenders] = useState([]);
  const [planLimits, setPlanLimits] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const [{ data: profileData, error: profileError }, { data: renders }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("has_seen_guide, plan, renders_this_month")
            .eq("id", user.id)
            .single(),
          supabase
            .from("renders")
            .select("id, mode, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      } else {
        setProfile(profileData);
        setShowGuide(!profileData?.has_seen_guide);

        const { data: limits } = await supabase
          .from("plan_limits")
          .select("monthly_export_limit")
          .eq("plan", profileData.plan)
          .single();
        setPlanLimits(limits);
      }

      setRecentRenders(renders || []);
      setChecking(false);
    }

    loadData();
  }, [user]);

  async function dismissGuide() {
    if (!user) return;
    setShowGuide(false);
    await supabase
      .from("profiles")
      .update({ has_seen_guide: true })
      .eq("id", user.id);
  }

  if (loading || (user && checking)) return null;
  if (!user) return null;

  console.log(
    "RENDER — loading:",
    loading,
    "user:",
    user,
    "checking:",
    checking,
  );

  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const used = profile?.renders_this_month ?? 0;
  const limit = planLimits?.monthly_export_limit;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const tabs = [
    { label: "Home", path: "/home", icon: HomeIcon },
    { label: "Templates", path: "/templates", icon: LayoutTemplate },
    { label: "Code", path: "/code", icon: Code2 },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const quickActions = [
    { label: "New from Template", icon: Sparkles, path: "/templates" },
    { label: "Paste Code", icon: Code2, path: "/code" },
    { label: "View History", icon: History, path: "/history" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <div
        className="px-6 pt-10 pb-8 rounded-b-3xl flex items-start justify-between"
        style={{
          background:
            "linear-gradient(160deg, #14195A 0%, #2B3FC7 55%, #6B7FE8 100%)",
        }}
      >
        <div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {greeting()}
          </p>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Hi {firstName} 👋
          </h1>
        </div>
        <button
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <Bell size={20} color="white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 mt-4">
        {showGuide && (
          <div
            className="bg-gray-400 rounded-2xl shadow-lg border p-5 mb-6"
            style={{ borderColor: "#E8E8E8" }}
          >
            <h2
              className="font-bold mb-1"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                color: "#1A1A1A",
              }}
            >
              Welcome to HTTI.Studio
            </h2>
            <p className="text-sm mb-3" style={{ color: "#6B6B6B" }}>
              Pick a template and fill in your text, or paste your own HTML/CSS
              if you're a dev. Either way, you'll get a downloadable image in
              seconds.
            </p>
            <button
              onClick={dismissGuide}
              className="text-sm font-semibold"
              style={{ color: "#3D5AFE" }}
            >
              Got it →
            </button>
          </div>
        )}

        {/* Usage stats */}
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{ borderColor: "#E8E8E8" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#3D5AFE" }}
            >
              {profile?.plan === "free"
                ? "Free Plan"
                : profile?.plan?.toUpperCase()}
            </span>
            <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>
              {limit ? `${used} / ${limit} renders` : `${used} renders`}
            </span>
          </div>
          {limit && (
            <div
              className="w-full h-2 rounded-full"
              style={{ backgroundColor: "#EEF1FF" }}
            >
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: "#3D5AFE" }}
              />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "#6B6B6B" }}
        >
          Quick actions
        </p>
        <div
          className="flex gap-3 mb-6 overflow-x-auto pl-1"
          style={{ scrollbarWidth: "none" }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 shrink-0 px-4 py-3 rounded-2xl border"
                style={{ borderColor: "#E8E8E8", minWidth: "90px" }}
              >
                <div
                  className="p-2 rounded-full"
                  style={{ backgroundColor: "#EEF1FF" }}
                >
                  <Icon size={18} color="#3D5AFE" />
                </div>
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: "#1A1A1A" }}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mode cards */}
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: "#6B6B6B" }}
        >
          Get started
        </p>
        <div className="grid gap-4 mb-6">
          <button
            onClick={() => navigate("/templates")}
            className="text-left p-5 rounded-2xl border hover:shadow-md transition flex items-start gap-4"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div
              className="p-3 rounded-xl shrink-0"
              style={{ backgroundColor: "#EEF1FF" }}
            >
              <LayoutTemplate size={22} color="#3D5AFE" />
            </div>
            <div>
              <h3
                className="font-bold mb-1"
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  color: "#1A1A1A",
                }}
              >
                Use a Template
              </h3>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>
                Fill in text, pick colors, done.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/code")}
            className="text-left p-5 rounded-2xl border hover:shadow-md transition flex items-start gap-4"
            style={{ borderColor: "#E8E8E8" }}
          >
            <div
              className="p-3 rounded-xl shrink-0"
              style={{ backgroundColor: "#EEF1FF" }}
            >
              <Code2 size={22} color="#3D5AFE" />
            </div>
            <div>
              <h3
                className="font-bold mb-1"
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  color: "#1A1A1A",
                }}
              >
                Code Mode
              </h3>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>
                Paste your own HTML + CSS.
              </p>
            </div>
          </button>
        </div>

        {/* Recent renders */}
        {recentRenders.length > 0 && (
          <>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "#6B6B6B" }}
            >
              Recent
            </p>
            <div className="space-y-2">
              {recentRenders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: "#E8E8E8" }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: "#F4F4F2" }}
                  >
                    <Zap size={16} color="#6B6B6B" />
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#1A1A1A" }}
                    >
                      {r.mode === "template"
                        ? "Template render"
                        : "Code render"}
                    </p>
                    <p className="text-xs" style={{ color: "#6B6B6B" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2"
        style={{ borderColor: "#E8E8E8" }}
      >
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 px-3 py-1"
              style={{ color: active ? "#3D5AFE" : "#6B6B6B" }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
