// src/pages/CodeMode.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Editor from "../components/CodeMode/Editor";
import Preview from "../components/CodeMode/Preview";
import Controls from "../components/CodeMode/Controls";

const DEMO_HTML = `<div class="card">
  <h1>Turn code into images.</h1>
  <p>Paste HTML + CSS. Get a pixel-perfect image.</p>
</div>`;

const DEMO_CSS = `body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: sans-serif;
}
.card {
  background: #F4F4F2;
  border-radius: 16px;
  padding: 36px;
  max-width: 400px;
}
h1 { color: #1A1A1A; font-size: 28px; }
p { color: #6B6B6B; }`;

export default function CodeMode() {
  const [html, setHtml] = useState(DEMO_HTML);
  const [css, setCss] = useState(DEMO_CSS);
  const [activeTab, setActiveTab] = useState("html");
  const [settings, setSettings] = useState({
    width: 800,
    height: 600,
    bgColor: "#ffffff",
    fileType: "png",
  });
  const [status, setStatus] = useState("empty"); // empty | loading | result | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate() {
    if (!html.trim()) {
      setActiveTab("html");
      return;
    }

    setActiveTab("preview");
    setStatus("loading");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ html, css, ...settings }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || `Error ${response.status}`);

      setResult({ ...data, generatedAt: Date.now() });
      setStatus("result");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b px-6 py-4" style={{ borderColor: "#E8E8E8" }}>
        <span
          className="font-bold text-lg"
          style={{ fontFamily: "Space Grotesk, sans-serif", color: "#1A1A1A" }}
        >
          HTTI.Studio — Code Mode
        </span>
      </header>

      <div className="flex-1 grid md:grid-cols-2">
        <div
          className="border-r flex flex-col"
          style={{ borderColor: "#E8E8E8" }}
        >
          <div className="flex border-b" style={{ borderColor: "#E8E8E8" }}>
            {["html", "css"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 text-sm font-medium uppercase"
                style={{
                  color: activeTab === tab ? "#3D5AFE" : "#6B6B6B",
                  borderBottom:
                    activeTab === tab ? "2px solid #3D5AFE" : "none",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Editor
            activeTab={activeTab}
            html={html}
            css={css}
            onHtmlChange={setHtml}
            onCssChange={setCss}
          />
          <Controls
            settings={settings}
            onChange={setSettings}
            onGenerate={handleGenerate}
          />
        </div>

        <Preview
          status={status}
          result={result}
          errorMsg={errorMsg}
          onRetry={handleGenerate}
        />
      </div>
    </div>
  );
}