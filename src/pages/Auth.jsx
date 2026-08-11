// src/pages/Auth.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import googleIcon from "../assets/images/icons/google-icon.svg";
import githubIcon from "../assets/images/icons/github-icon.svg";
import card1 from "../assets/images/showcase/card-1.png";
import card2 from "../assets/images/showcase/card-2.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/home` },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a sign-in link.");
    }
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/home` },
    });
  };

return (
  <div className="min-h-screen bg-white md:flex md:items-center md:justify-center md:p-8" style={{ backgroundColor: undefined }}>
    <div className="md:flex md:max-w-5xl md:w-full md:rounded-3xl md:overflow-hidden md:shadow-2xl">
      
      {/* Gradient panel */}
      <div
        className="relative overflow-hidden flex flex-col justify-center px-6 md:px-12 md:w-1/2"
        style={{
          height: "55vh",
          background: "linear-gradient(160deg, #14195A 0%, #2B3FC7 55%, #6B7FE8 100%)",
        }}
      >
        <img
          src={card1}
          alt=""
          className="absolute rounded-2xl shadow-2xl opacity-90"
          style={{ width: "140px", top: "12%", right: "8%", transform: "rotate(12deg)" }}
        />
        <img
          src={card2}
          alt=""
          className="absolute rounded-2xl shadow-2xl opacity-90"
          style={{ width: "160px", bottom: "10%", left: "8%", transform: "rotate(-10deg)" }}
        />

        <div className="relative z-10">
          <div
            className="inline-block px-5 py-4 rounded-2xl"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <h1
              className="text-3xl md:text-4xl font-bold leading-tight text-white justify-center text-center"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Turn text into cards
              <br />
              people actually use
            </h1>
          </div>
        </div>
      </div>

      {/* White form panel */}
      <div className="flex-1 px-6 -mt-6 md:mt-0 relative z-10 md:w-1/2 md:flex md:items-center md:px-12 md:py-10">
        <div
          className="w-full bg-white rounded-t-3xl md:rounded-none md:shadow-none p-6 md:p-0 mx-auto max-w-sm"
          style={{ minHeight: "45vh" }}
        >
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label
                htmlFor="auth-email"
                className="text-sm font-medium block mb-1"
                style={{ color: "#1A1A1A" }}
              >
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                style={{
                  borderColor: "#E8E8E8",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-50"
              style={{
                backgroundColor: "#3D5AFE",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? "Sending..." : "Continue"}
            </button>
          </form>

          {message && (
            <p
              className="text-sm text-center mt-3"
              style={{ color: "#6B6B6B" }}
            >
              {message}
            </p>
          )}

          <div className="flex items-center gap-3 my-4">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "#E8E8E8" }}
            />
            <span className="text-sm" style={{ color: "#6B6B6B" }}>
              Or
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "#E8E8E8" }}
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleOAuth("google")}
              className="w-full py-3 rounded-xl border font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              style={{
                borderColor: "#E8E8E8",
                color: "#1A1A1A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <img src={googleIcon} alt="" className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              className="w-full py-3 rounded-xl border font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              style={{
                borderColor: "#E8E8E8",
                color: "#1A1A1A",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <img src={githubIcon} alt="" className="w-6 h-6" />
              Continue with GitHub
            </button>
          </div>

          <p className="text-xs text-center mt-4" style={{ color: "#6B6B6B" }}>
            By continuing, you agree to HTTI Studio's{" "}
            <a
              href="/terms"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            .
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
