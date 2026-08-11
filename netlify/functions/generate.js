// netlify/functions/generate.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing auth token" }),
      };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid auth token" }),
      };
    }

    const { html, css, width, height, bgColor, fileType } = JSON.parse(
      event.body,
    );

    if (!html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "HTML is required" }),
      };
    }

    const fullHtml = `
      <html>
        <head><style>
          * { box-sizing: border-box; }
          body { margin: 0; background: ${bgColor || "#ffffff"}; }
          ${css || ""}
        </style></head>
        <body>${html}</body>
      </html>
    `;

    const browserlessRes = await fetch(
      `https://production-sfo.browserless.io/screenshot?token=${process.env.BROWSERLESS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: fullHtml,
          options: { type: fileType || "png" },
          viewport: {
            width: width || 800,
            height: height || 600,
          },
        }),
      },
    );

    if (!browserlessRes.ok) {
      const errText = await browserlessRes.text();
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Render failed", detail: errText }),
      };
    }

    const imageBuffer = await browserlessRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:image/${fileType || "png"};base64,${base64Image}`;

    await supabase.from("renders").insert({
      user_id: user.id,
      mode: "custom-code",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: dataUrl,
        width: width || 800,
        height: height || 600,
        fileType: fileType || "png",
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
