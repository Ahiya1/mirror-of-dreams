import React, { useState, useEffect } from "react";
import CosmicBackground from "../shared/CosmicBackground";

// Enhanced Markdown Parser Component
const MarkdownRenderer = ({ content }) => {
  const parseMarkdown = (markdown) => {
    if (!markdown || typeof markdown !== "string") {
      return "<p>No content available</p>";
    }

    const rules = [
      // Headers
      { pattern: /^### (.*$)/gm, replacement: "<h3>$1</h3>" },
      { pattern: /^## (.*$)/gm, replacement: "<h2>$1</h2>" },
      { pattern: /^# (.*$)/gm, replacement: "<h1>$1</h1>" },

      // Horizontal rules
      { pattern: /^---$/gm, replacement: "<hr>" },
      { pattern: /^\*\*\*$/gm, replacement: "<hr>" },

      // Blockquotes
      {
        pattern: /^> (.*)$/gm,
        replacement: "<blockquote><p>$1</p></blockquote>",
      },

      // Code blocks
      {
        pattern: /```([\s\S]*?)```/g,
        replacement: "<pre><code>$1</code></pre>",
      },

      // Inline code
      { pattern: /`([^`]+)`/g, replacement: "<code>$1</code>" },

      // Bold and italic combinations
      {
        pattern: /\*\*\*(.*?)\*\*\*/g,
        replacement: "<strong><em>$1</em></strong>",
      },
      {
        pattern: /\_\_\_(.*?)\_\_\_/g,
        replacement: "<strong><em>$1</em></strong>",
      },

      // Bold
      { pattern: /\*\*(.*?)\*\*/g, replacement: "<strong>$1</strong>" },
      { pattern: /\_\_(.*?)\_\_/g, replacement: "<strong>$1</strong>" },

      // Italic
      { pattern: /\*(.*?)\*/g, replacement: "<em>$1</em>" },
      { pattern: /\_(.*?)\_/g, replacement: "<em>$1</em>" },

      // Strikethrough
      { pattern: /~~(.*?)~~/g, replacement: "<del>$1</del>" },

      // Highlight
      { pattern: /==(.*?)==/g, replacement: "<mark>$1</mark>" },

      // Links
      {
        pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
        replacement: '<a href="$2">$1</a>',
      },

      // Lists
      { pattern: /^\* (.*)$/gm, replacement: "<li>$1</li>" },
      { pattern: /^- (.*)$/gm, replacement: "<li>$1</li>" },
      { pattern: /^\+ (.*)$/gm, replacement: "<li>$1</li>" },
      { pattern: /^\d+\. (.*)$/gm, replacement: "<li>$1</li>" },

      // Line breaks
      { pattern: /\n\n/g, replacement: "</p><p>" },
    ];

    let html = markdown.trim();

    rules.forEach((rule) => {
      html = html.replace(rule.pattern, rule.replacement);
    });

    // Process lists
    html = html.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    // Wrap in paragraphs if needed
    if (
      !html.includes("<p>") &&
      !html.includes("<h1>") &&
      !html.includes("<h2>") &&
      !html.includes("<h3>")
    ) {
      html = `<p>${html}</p>`;
    } else if (!html.startsWith("<")) {
      html = `<p>${html}`;
    }

    if (!html.endsWith("</p>") && !html.endsWith(">")) {
      html += "</p>";
    }

    return html;
  };

  return (
    <div
      className="mirror-response"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};

// Artifact Section Component
const ArtifactSection = ({ reflectionId, authToken }) => {
  const [artifactState, setArtifactState] = useState("create"); // 'create', 'loading', 'preview'
  const [artifactData, setArtifactData] = useState(null);

  useEffect(() => {
    checkExistingArtifact();
  }, [reflectionId]);

  const checkExistingArtifact = async () => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/artifact", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "check-existing",
          reflectionId,
        }),
      });

      const data = await response.json();
      if (data.success && data.artifact) {
        setArtifactData(data.artifact);
        setArtifactState("preview");
      }
    } catch (error) {
      console.log("No existing artifact found");
    }
  };

  const createArtifact = async () => {
    if (!reflectionId) {
      alert("No reflection found to create artifact from.");
      return;
    }

    setArtifactState("loading");

    try {
      const headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/artifact", {
        method: "POST",
        headers,
        body: JSON.stringify({ reflectionId }),
      });

      const data = await response.json();

      if (data.success && data.artifact) {
        setArtifactData(data.artifact);
        setArtifactState("preview");
      } else {
        throw new Error(data.error || "Artifact creation failed");
      }
    } catch (error) {
      console.error("Artifact creation failed:", error);
      alert("Failed to create artifact. Please try again.");
      setArtifactState("create");
    }
  };

  const shareArtifact = () => {
    if (!artifactData?.image_url) return;

    const url = artifactData.image_url;

    if (navigator.share) {
      navigator
        .share({
          title: "My Mirror of Truth Artifact",
          text: "Check out my personalized reflection artifact",
          url: url,
        })
        .catch(() => {
          copyToClipboard(url);
        });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("🔗 Link copied to clipboard"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      alert("🔗 Link copied to clipboard");
    } catch (err) {
      alert("❌ Unable to copy link");
    }

    document.body.removeChild(textArea);
  };

  const regenerateArtifact = async () => {
    if (
      !confirm(
        "Are you sure you want to create a new artifact? This will replace your current one."
      )
    ) {
      return;
    }

    setArtifactState("create");
    setArtifactData(null);
    await createArtifact();
  };

  return (
    <div
      className="glass-card"
      style={{ marginTop: "var(--space-2xl)", padding: "var(--space-xl)" }}
    >
      <h2
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: 300,
          textAlign: "center",
          marginBottom: "var(--space-xl)",
          color: "var(--cosmic-text)",
          position: "relative",
        }}
      >
        Your Sacred Artifact
        <div
          style={{
            content: '""',
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
          }}
        />
      </h2>

      {artifactState === "create" && (
        <div style={{ textAlign: "center" }}>
          <button
            className="cosmic-button cosmic-button--fusion"
            onClick={createArtifact}
            style={{
              padding: "var(--space-lg) var(--space-xl)",
              fontSize: "var(--text-base)",
              minHeight: "64px",
            }}
          >
            <span style={{ fontSize: "1.2em" }}>🎨</span>
            <span>Create Your Artifact</span>
          </button>
          <div
            style={{
              marginTop: "var(--space-lg)",
              fontSize: "var(--text-base)",
              color: "var(--cosmic-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Transform your reflection into a personalized visual that captures
            your essence and insights
          </div>
        </div>
      )}

      {artifactState === "loading" && (
        <div style={{ textAlign: "center", padding: "var(--space-xl) 0" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto var(--space-lg)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.05) 70%, transparent 100%)",
              animation: "artifactSpin 2s linear infinite",
              position: "relative",
            }}
          >
            <div
              style={{
                content: '""',
                position: "absolute",
                inset: "20%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)",
                animation: "artifactPulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--fusion-primary)",
              fontWeight: 500,
            }}
          >
            Creating your artifact...
          </div>
        </div>
      )}

      {artifactState === "preview" && artifactData && (
        <div style={{ animation: "artifactReveal 1s ease-out" }}>
          <div style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
            <img
              src={artifactData.image_url}
              alt="Your Sacred Artifact"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "16px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                border: "2px solid rgba(251, 191, 36, 0.2)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href={artifactData.image_url}
              download={`mirror-artifact-${Date.now()}.png`}
              className="cosmic-button cosmic-button--gentle"
            >
              <span>⬇️</span>
              <span>Download</span>
            </a>
            <button className="cosmic-button" onClick={shareArtifact}>
              <span>🔗</span>
              <span>Share</span>
            </button>
            <button className="cosmic-button" onClick={regenerateArtifact}>
              <span>🔄</span>
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes artifactSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes artifactPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes artifactReveal {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Feedback Section Component
const FeedbackSection = ({ reflectionId, authToken, onComplete }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (!selectedRating) {
      alert("Please select a rating from 1-10");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "submit-feedback",
          reflectionId,
          rating: selectedRating,
          feedback: feedbackText.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete();
      } else {
        console.error("Failed to submit feedback:", data.error);
        onComplete();
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        margin: "var(--space-2xl) 0",
        padding: "var(--space-xl)",
        animation: "feedbackAppear 0.8s ease-out",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 300,
            color: "var(--cosmic-text)",
            marginBottom: "var(--space-xl)",
            lineHeight: 1.4,
          }}
        >
          How deeply did this help you access your truth?
        </h3>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-sm)",
            flexWrap: "wrap",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              className={`cosmic-button ${
                selectedRating === rating ? "cosmic-button--gentle" : ""
              }`}
              onClick={() => setSelectedRating(rating)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                fontSize: "var(--text-base)",
                fontWeight: 500,
                transform: selectedRating === rating ? "scale(1.1)" : undefined,
                boxShadow:
                  selectedRating === rating
                    ? "0 0 20px rgba(255, 255, 255, 0.12)"
                    : undefined,
              }}
              aria-pressed={selectedRating === rating}
            >
              {rating}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "500px",
            margin: "0 auto var(--space-xl)",
            fontSize: "var(--text-sm)",
            opacity: 0.6,
          }}
        >
          <span>Not at all</span>
          <span>Deeply</span>
        </div>

        <textarea
          className="cosmic-textarea"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="What emerged for you? (optional)"
          maxLength={500}
          rows={3}
          style={{
            width: "100%",
            marginBottom: "var(--space-xl)",
            minHeight: "80px",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="cosmic-button cosmic-button--gentle"
            onClick={submitFeedback}
            disabled={isSubmitting || !selectedRating}
            style={{
              padding: "var(--space-md) var(--space-xl)",
              opacity: !selectedRating || isSubmitting ? 0.7 : 1,
              cursor:
                !selectedRating || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit & Continue"}
          </button>
          <button
            className="cosmic-button"
            onClick={onComplete}
            disabled={isSubmitting}
          >
            Skip
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes feedbackAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Main Output Component
const Output = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reflection, setReflection] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [reflectionId, setReflectionId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAndLoad();
  }, []);

  // Show feedback after delay
  useEffect(() => {
    if (reflection && !showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reflection, showFeedback]);

  const initializeAndLoad = async () => {
    try {
      await initializeAuth();
      await loadReflection();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAuth = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const premium = urlParams.get("premium");
    const id = urlParams.get("id");

    setReflectionId(id);

    if (!id) {
      throw new Error("No reflection ID provided");
    }

    const token = localStorage.getItem("mirror_auth_token");
    setAuthToken(token);

    if (mode === "creator") {
      const user = {
        isCreator: true,
        name: "Ahiya",
        email: "ahiya.butman@gmail.com",
        tier: "premium",
        id: "creator_ahiya",
      };
      setUserData(user);
    } else if (mode === "user") {
      const user = {
        name: "Test User",
        email: "test@example.com",
        tier: premium === "true" ? "premium" : "essential",
        testMode: true,
        id: `test_user_${Date.now()}`,
      };
      setUserData(user);
    } else if (!token) {
      throw new Error("Authentication required");
    } else {
      const user = await verifyAuthToken(token);
      setUserData(user);
    }
  };

  const verifyAuthToken = async (token) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "verify-token" }),
    });

    const result = await response.json();
    if (!result.success || !result.user) {
      throw new Error("Token verification failed");
    }
    return result.user;
  };

  const loadReflection = async () => {
    if (!reflectionId) return;

    try {
      const headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/reflections", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "get-reflection",
          id: reflectionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reflection: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.reflection) {
        throw new Error("Invalid reflection response");
      }

      setReflection(data.reflection);
    } catch (error) {
      throw new Error("Unable to load reflection");
    }
  };

  const emailReflection = async () => {
    try {
      const response = await fetch("/api/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-reflection",
          email: userData.email,
          content: reflection.ai_response,
          userName: userData.name || "Friend",
          language: "en",
          isPremium: userData.tier === "premium" || userData.isCreator,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Reflection sent to your email!");
      } else {
        throw new Error(data.error || "Email failed");
      }
    } catch (error) {
      console.error("Email failed:", error);
      alert("❌ Failed to send email. Please try again.");
    }
  };

  const hideFeedback = () => {
    setShowFeedback(false);
  };

  if (error) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            textAlign: "center",
            color: "var(--cosmic-text)",
            padding: "var(--space-2xl)",
          }}
        >
          <h1
            style={{
              fontSize: "var(--text-3xl)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Reflection Unavailable
          </h1>
          <p style={{ marginBottom: "var(--space-xl)", opacity: 0.8 }}>
            {error}
          </p>
          <button
            className="cosmic-button cosmic-button--primary"
            onClick={() => (window.location.href = "/mirror/questionnaire")}
          >
            Try New Reflection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-2xl)",
            padding: "var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <div className="loading-circle" />
          <div
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 300,
              opacity: 0.8,
              letterSpacing: "1px",
              color: "var(--cosmic-text-secondary)",
              animation: "loadingPulse 3s ease-in-out infinite",
            }}
          >
            Preparing your reflection...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mirror-container">
      <CosmicBackground />

      {/* Back Navigation */}
      <a href="/" className="back-link">
        <span>←</span>
        <span>Return to Portal</span>
      </a>

      <div className="mirror-content">
        {/* Artifact CTA Banner */}
        <div
          style={{
            marginTop: "var(--space-2xl)",
            marginBottom: "var(--space-xl)",
            padding: "var(--space-xl)",
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            borderRadius: "20px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            animation: "artifactGlow 4s ease-in-out infinite",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-3xl)",
              marginBottom: "var(--space-md)",
            }}
          >
            ✨
          </div>
          <div
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 500,
              color: "var(--fusion-primary)",
              marginBottom: "var(--space-xs)",
            }}
          >
            Transform Your Truth Into Art
          </div>
          <div
            style={{
              fontSize: "var(--text-base)",
              color: "var(--cosmic-text-secondary)",
              marginBottom: "var(--space-xs)",
            }}
          >
            Create a beautiful visual artifact from your reflection
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--cosmic-text-muted)",
              fontStyle: "italic",
            }}
          >
            See your personalized artwork below
          </div>
        </div>

        {/* Admin Notice */}
        {(userData?.isCreator || userData?.testMode) && (
          <div
            style={{
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              color: "#d8b4fe",
              padding: "var(--space-md) var(--space-lg)",
              borderRadius: "16px",
              marginBottom: "var(--space-xl)",
              fontSize: "var(--text-sm)",
              fontWeight: 400,
              letterSpacing: "0.3px",
              textAlign: "center",
            }}
          >
            <span>
              ✨{" "}
              {userData.isCreator
                ? "Creator mode — unlimited premium reflections"
                : `Test mode — ${userData.tier} reflection`}
            </span>
          </div>
        )}

        {/* Reflection Content */}
        <div
          className="glass-card"
          style={{
            padding: "var(--space-xl) var(--space-lg)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <MarkdownRenderer content={reflection?.ai_response} />
        </div>

        {/* Artifact Section */}
        <ArtifactSection reflectionId={reflectionId} authToken={authToken} />

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "var(--space-2xl)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--space-md)",
          }}
        >
          <button className="cosmic-button" onClick={emailReflection}>
            <span>📧</span>
            <span>Mail Reflection</span>
          </button>
          <button
            className="cosmic-button cosmic-button--gentle"
            onClick={() =>
              (window.location.href = "/mirror/questionnaire?fresh=true")
            }
          >
            <span>🆕</span>
            <span>New Reflection</span>
          </button>
          <a href="/reflections/history" className="cosmic-button">
            <span>📚</span>
            <span>Your Journey</span>
          </a>
          <a href="/about" className="cosmic-button">
            <span>🤲</span>
            <span>Who created this?</span>
          </a>
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <FeedbackSection
            reflectionId={reflectionId}
            authToken={authToken}
            onComplete={hideFeedback}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes loadingPulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes artifactGlow {
          0%,
          100% {
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.08) 0%,
              rgba(245, 158, 11, 0.04) 100%
            );
            bordercolor: rgba(251, 191, 36, 0.2);
          }
          50% {
            background: linear-gradient(
              135deg,
              rgba(251, 191, 36, 0.12) 0%,
              rgba(245, 158, 11, 0.06) 100%
            );
            bordercolor: rgba(251, 191, 36, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default Output;
