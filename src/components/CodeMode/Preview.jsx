export default function Preview({ status, result, errorMsg, onRetry }) {
  return (
    <div
      className="flex items-center justify-center p-6"
      style={{ backgroundColor: "#F4F4F2" }}
    >
      {status === "empty" && (
        <p className="text-center" style={{ color: "#6B6B6B" }}>
          Add HTML + CSS, then tap Generate Image
        </p>
      )}
      {status === "loading" && (
        <p className="text-center" style={{ color: "#6B6B6B" }}>
          Generating image...
        </p>
      )}
      {status === "result" && result && (
        <div className="text-center space-y-3">
          <img
            src={result.url}
            alt="Generated"
            className="max-w-full rounded-lg border"
            style={{ borderColor: "#E8E8E8" }}
          />
          <a
            href={result.url}
            download={`htti-${result.generatedAt}.${result.fileType}`}
            className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#3D5AFE" }}
          >
            Download
          </a>
        </div>
      )}
      {status === "error" && (
        <div className="text-center space-y-2">
          <p style={{ color: "#B00020" }}>{errorMsg}</p>
          <button
            onClick={onRetry}
            className="text-sm underline"
            style={{ color: "#3D5AFE" }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
