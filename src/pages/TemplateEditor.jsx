import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft, Download } from "lucide-react";

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("Template fetch error:", error);
        setTemplate(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!template || !previewRef.current) return;

    const doc = previewRef.current.contentDocument;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            html, body { margin: 0; padding: 0; }
            .editable-heading, .editable-body, .editable-accent {
              outline: none;
              cursor: text;
            }
            .editable-heading:hover, .editable-body:hover, .editable-accent:hover {
              outline: 2px dashed #3D5AFE;
              outline-offset: 2px;
            }
            .editable-heading:focus, .editable-body:focus, .editable-accent:focus {
              outline: 2px solid #3D5AFE;
              outline-offset: 2px;
            }
            ${template.css}
          </style>
        </head>
        <body>${template.html_structure}</body>
      </html>
    `);
    doc.close();

    const editableEls = doc.querySelectorAll(
      ".editable-heading, .editable-body, .editable-accent",
    );
    editableEls.forEach((el) => {
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "false");
    });
  }, [template]);

  async function handleGenerate() {
    if (!previewRef.current || !user) return;
    setGenerating(true);

    const doc = previewRef.current.contentDocument;
    const currentHtml = doc.body.innerHTML;

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
        body: JSON.stringify({
          html: currentHtml,
          css: template.css,
          width: 500,
          height: 500,
          fileType: "png",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      setResult({ ...data, generatedAt: Date.now() });

      await supabase.from("renders").insert({
        user_id: user.id,
        mode: "template",
        template_id: template.id,
      });
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return null;
  if (!template) return <div className="p-6">Template not found.</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "#E8E8E8" }}
      >
        <button onClick={() => navigate("/templates")} className="p-2">
          <ArrowLeft size={20} color="#1A1A1A" />
        </button>
        <span
          className="font-semibold"
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            color: "#1A1A1A",
          }}
        >
          {template.name}
        </span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "#3D5AFE" }}
        >
          {generating ? "Generating..." : "Generate"}
        </button>
      </header>

      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundColor: "#F4F4F2" }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{
            width: "500px",
            height: "500px",
            maxWidth: "90vw",
            maxHeight: "90vw",
          }}
        >
          <iframe
            ref={previewRef}
            title="Template editor preview"
            style={{
              width: "500px",
              height: "500px",
              border: "none",
              display: "block",
            }}
          />
        </div>
      </div>

      {result && (
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{ borderColor: "#E8E8E8" }}
        >
          <span className="text-sm" style={{ color: "#6B6B6B" }}>
            Ready to download
          </span>
          <a
            href={result.url}
            download={`htti-${result.generatedAt}.${result.fileType}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#3D5AFE" }}
          >
            <Download size={16} />
            Download
          </a>
        </div>
      )}
    </div>
  );
}
