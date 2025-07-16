// hooks/useArtifact.js - Fixed artifact creation and management hook

import { useState, useEffect, useCallback } from "react";
import { reflectionService } from "../services/reflection.service";
import { ApiError } from "../services/api";

/**
 * Artifact management hook for creating and managing reflection artifacts
 * @param {string} reflectionId - Reflection ID
 * @param {string} authToken - Authentication token
 * @returns {Object} - Artifact state and methods
 */
export const useArtifact = (reflectionId, authToken) => {
  const [artifactState, setArtifactState] = useState("checking"); // 'checking', 'create', 'loading', 'preview', 'error'
  const [artifactData, setArtifactData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check for existing artifact
   */
  const checkExistingArtifact = useCallback(async () => {
    if (!reflectionId) return;

    setArtifactState("checking");
    setError(null);

    try {
      console.log(`🔍 Checking for existing artifact: ${reflectionId}`);
      const existingArtifact = await reflectionService.checkExistingArtifact(
        reflectionId
      );

      if (existingArtifact) {
        console.log(`✅ Found existing artifact:`, existingArtifact);
        setArtifactData(existingArtifact);
        setArtifactState("preview");
      } else {
        console.log(`📝 No existing artifact found`);
        setArtifactState("create");
      }
    } catch (error) {
      console.log("📝 No existing artifact found:", error.message);
      setArtifactState("create");
    }
  }, [reflectionId]);

  /**
   * Create new artifact
   */
  const createArtifact = useCallback(async () => {
    if (!reflectionId) {
      setError("No reflection found to create artifact from.");
      return false;
    }

    setArtifactState("loading");
    setError(null);
    setIsLoading(true);

    try {
      console.log(`🎨 Creating artifact for reflection: ${reflectionId}`);
      const artifact = await reflectionService.createArtifact(reflectionId);

      console.log(`✨ Artifact created successfully:`, artifact);
      setArtifactData(artifact);
      setArtifactState("preview");
      return true;
    } catch (error) {
      console.error("🔥 Artifact creation failed:", error);

      const errorMessage =
        error instanceof ApiError
          ? error.getUserMessage()
          : "Failed to create artifact. Please try again.";

      setError(errorMessage);
      setArtifactState("error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [reflectionId]);

  /**
   * Regenerate artifact (create new one)
   */
  const regenerateArtifact = useCallback(async () => {
    const confirmed = window.confirm(
      "Are you sure you want to create a new artifact? This will replace your current one."
    );

    if (!confirmed) return false;

    setArtifactData(null);
    setArtifactState("create");

    return await createArtifact();
  }, [createArtifact]);

  /**
   * Share artifact via Web Share API or clipboard
   */
  const shareArtifact = useCallback(async () => {
    if (!artifactData?.image_url) {
      setError("No artifact to share");
      return false;
    }

    const url = artifactData.image_url;
    const shareData = {
      title: "My Mirror of Truth Artifact",
      text: "Check out my personalized reflection artifact",
      url: url,
    };

    try {
      // Try Web Share API first (mobile)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        return true;
      }

      // Fallback to clipboard
      await copyToClipboard(url);
      return true;
    } catch (error) {
      console.error("Share failed:", error);
      setError("Failed to share artifact");
      return false;
    }
  }, [artifactData]);

  /**
   * Copy URL to clipboard
   * @param {string} text - Text to copy
   */
  const copyToClipboard = useCallback(async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert("🔗 Link copied to clipboard");
      } else {
        // Fallback for older browsers
        fallbackCopy(text);
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      fallbackCopy(text);
    }
  }, []);

  /**
   * Fallback copy method for older browsers
   * @param {string} text - Text to copy
   */
  const fallbackCopy = useCallback((text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        alert("🔗 Link copied to clipboard");
      } else {
        alert("❌ Unable to copy link");
      }
    } catch (error) {
      console.error("Fallback copy failed:", error);
      alert("❌ Unable to copy link");
    }

    document.body.removeChild(textArea);
  }, []);

  /**
   * Download artifact image with CORS handling
   */
  const downloadArtifact = useCallback(async () => {
    if (!artifactData?.image_url) {
      setError("No artifact to download");
      return false;
    }

    try {
      console.log(`📥 Starting download from: ${artifactData.image_url}`);

      // Try direct fetch first
      let response;
      try {
        response = await fetch(artifactData.image_url, {
          mode: "cors",
          credentials: "omit",
        });
      } catch (corsError) {
        console.warn("CORS fetch failed, trying no-cors mode:", corsError);

        // Fallback: try no-cors mode (won't work for download but we can try)
        response = await fetch(artifactData.image_url, {
          mode: "no-cors",
        });
      }

      if (!response.ok && response.type !== "opaque") {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mirror-artifact-${Date.now()}.png`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      console.log(`✅ Download completed successfully`);
      return true;
    } catch (error) {
      console.error("🔥 Download failed:", error);

      // Fallback: open in new tab
      try {
        window.open(artifactData.image_url, "_blank");
        alert("📥 Opening image in new tab. You can save it from there.");
        return true;
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        setError(
          "Unable to download. Please try right-clicking the image and selecting 'Save image as...'"
        );
        return false;
      }
    }
  }, [artifactData]);

  /**
   * Validate artifact URL accessibility
   */
  const validateArtifactUrl = useCallback(async (url) => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "cors",
        credentials: "omit",
      });
      return response.ok;
    } catch (error) {
      console.warn("URL validation failed:", error);
      return false;
    }
  }, []);

  /**
   * Get artifact creation status text
   */
  const getStatusText = useCallback(() => {
    switch (artifactState) {
      case "checking":
        return "Checking for existing artifact...";
      case "create":
        return "Ready to create your artifact";
      case "loading":
        return "Creating your sacred artwork...";
      case "preview":
        return "Your artifact is ready";
      case "error":
        return "Error creating artifact";
      default:
        return "";
    }
  }, [artifactState]);

  /**
   * Get artifact creation progress
   */
  const getProgress = useCallback(() => {
    switch (artifactState) {
      case "checking":
        return 25;
      case "create":
        return 0;
      case "loading":
        return 75;
      case "preview":
        return 100;
      case "error":
        return 0;
      default:
        return 0;
    }
  }, [artifactState]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (artifactState === "error") {
      setArtifactState("create");
    }
  }, [artifactState]);

  /**
   * Retry artifact creation
   */
  const retryCreation = useCallback(async () => {
    clearError();
    return await createArtifact();
  }, [clearError, createArtifact]);

  /**
   * Reset artifact state
   */
  const resetArtifact = useCallback(() => {
    setArtifactData(null);
    setError(null);
    setArtifactState("create");
  }, []);

  // Initialize artifact check
  useEffect(() => {
    checkExistingArtifact();
  }, [checkExistingArtifact]);

  // Validate artifact URL when artifact data changes
  useEffect(() => {
    if (artifactData?.image_url && artifactState === "preview") {
      validateArtifactUrl(artifactData.image_url).then((isValid) => {
        if (!isValid) {
          console.warn(
            "Artifact URL may not be accessible:",
            artifactData.image_url
          );
        }
      });
    }
  }, [artifactData, artifactState, validateArtifactUrl]);

  return {
    // State
    artifactState,
    artifactData,
    error,
    isLoading,

    // Actions
    createArtifact,
    regenerateArtifact,
    shareArtifact,
    downloadArtifact,
    copyToClipboard,
    retryCreation,
    resetArtifact,
    clearError,

    // Utilities
    getStatusText,
    getProgress,
    validateArtifactUrl,

    // Status checks
    canCreate: artifactState === "create",
    isCreating: artifactState === "loading",
    hasArtifact: artifactState === "preview" && !!artifactData,
    hasError: artifactState === "error",
  };
};
