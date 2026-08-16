import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import CodeMode from "./pages/CodeMode";
import Privacy from "./assets/Privacy";
import Terms from "./assets/Terms";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates/:id"
        element={
          <ProtectedRoute>
            <TemplateEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/code"
        element={
          <ProtectedRoute>
            <CodeMode />
          </ProtectedRoute>
        }
      />

      <Route path="/privacy" element={<Privacy />} />

      <Route path="/terms" element={<Terms />} />
    </Routes>
  );
}

export default App;
