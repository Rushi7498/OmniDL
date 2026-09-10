import { apiUrl } from "./api-url.js";
import { useState } from "react";
import {
  Image as ImageIcon,
  Video,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

export default function MediaPreview({ item, index }) {
  const [state, setState] = useState(item.previewUrl ? "loading" : "error");
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      {item.previewUrl && state !== "error" && (
        <img
          key={attempt}
          src={apiUrl(item.previewUrl) + (attempt ? `?retry=${attempt}` : "")}
          alt={`Preview of media item ${index + 1}`}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
        />
      )}
      {state !== "loaded" && (
        <div className="preview-status" role="status">
          {state === "loading" ? (
            <>
              <LoaderCircle size={24} className="spin" />
              <span>Loading preview…</span>
            </>
          ) : (
            <>
              {item.type === "video" ? (
                <Video size={26} />
              ) : (
                <ImageIcon size={26} />
              )}
              <span>Preview unavailable</span>
              {item.previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAttempt((n) => n + 1);
                    setState("loading");
                  }}
                >
                  <RefreshCw size={14} />
                  Retry preview
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
