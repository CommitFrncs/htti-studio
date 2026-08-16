import { useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, LayoutTemplate, Code2, User } from "lucide-react";

const tabs = [
  { label: "Home", path: "/home", icon: HomeIcon },
  { label: "Templates", path: "/templates", icon: LayoutTemplate },
  { label: "Code", path: "/code", icon: Code2 },
  { label: "Profile", path: "/profile", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-40"
      style={{ borderColor: "#E8E8E8" }}
    >
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-1 px-3 py-1 cursor-pointer"
            style={{ color: active ? "#3D5AFE" : "#6B6B6B" }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
