// hooks/useArtifact.js - Updated for manual creation only

import { useState, useEffect, useCallback, useRef } from "react";
import { reflectionService } from "../services/reflection.service";

/**
 * Enhanced artifact hook with manual creation only
 * No automatic checking or creation unless explicitly requested
 */
export const useArtifact = (reflectionId, authToken, options = {}) => {
  const {
    autoCheck = false, // Disabled by default now
    autoCreate = false, // Never auto-create
    timeout = 60000, // 60 second timeout
  } = options;

  // State
  const [artifactState, setArtifactState] = useState("idle"); // idle, checking, creating, success, error
  const [artifactData, setArtifactData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  /**
   * Check for existing artifact (only when explicitly called)
   */
  const checkExistingArtifact = useCallback(async () => {
    if (!reflectionId) return null;

    try {
      setArtifactState("checking");
      setIsLoading(true);
      setError(null);

      const existingArtifact = await reflectionService.checkExistingArtifact(
        reflectionId
      );

      if (existingArtifact) {
        setArtifactData(existingArtifact);
        setArtifactState("success");
        return existingArtifact;
      } else {
        setArtifactState("idle");
        return null;
      }
    } catch (error) {
      console.error("Failed to check existing artifact:", error);
      setError(error.message || "Failed to check for existing artifact");
      setArtifactState("error");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [reflectionId]);

  /**
   * Create new artifact (manual only)
   */
  const createArtifact = useCallback(async () => {
    if (!reflectionId) {
      throw new Error("No reflection ID provided");
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setArtifactState("creating");
      setIsLoading(true);
      setError(null);

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        abortControllerRef.current?.abort();
        setError("Artifact creation timed out");
        setArtifactState("error");
        setIsLoading(false);
      }, timeout);

      const newArtifact = await reflectionService.createArtifact(reflectionId);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setArtifactData(newArtifact);
      setArtifactState("success");
      return newArtifact;
    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (error.name === "AbortError") {
        setError("Artifact creation was cancelled");
      } else {
        setError(error.message || "Failed to create artifact");
      }

      setArtifactState("error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [reflectionId, timeout]);

  /**
   * Regenerate artifact (create new one)
   */
  const regenerateArtifact = useCallback(async () => {
    // Clear existing artifact data first
    setArtifactData(null);
    setArtifactState("idle");

    // Create new artifact
    return createArtifact();
  }, [createArtifact]);

  /**
   * Share artifact
   */
  const shareArtifact = useCallback(async () => {
    if (!artifactData) {
      throw new Error("No artifact to share");
    }

    try {
      const shareUrl = artifactData.share_url || artifactData.image_url;

      if (navigator.share) {
        await navigator.share({
          title: "My Sacred Artifact",
          text: "Check out my reflection artifact from Mirror of Truth",
          url: shareUrl,
        });
        return true;
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } else {
        // Fallback: show share URL
        prompt("Copy this link to share:", shareUrl);
        return true;
      }
    } catch (error) {
      console.error("Share failed:", error);
      setError("Failed to share artifact");
      return false;
    }
  }, [artifactData]);

  /**
   * Download artifact
   */
  const downloadArtifact = useCallback(async () => {
    if (!artifactData) {
      throw new Error("No artifact to download");
    }

    try {
      const downloadUrl = artifactData.download_url || artifactData.image_url;

      // Try direct download first
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `sacred-artifact-${Date.now()}.jpg`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("Download failed:", error);

      // Fallback: open in new tab
      try {
        window.open(artifactData.image_url, "_blank");
        return true;
      } catch (fallbackError) {
        setError("Failed to download artifact");
        return false;
      }
    }
  }, [artifactData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (artifactState === "error") {
      setArtifactState("idle");
    }
  }, [artifactState]);

  /**
   * Retry creation after error
   */
  const retryCreation = useCallback(async () => {
    clearError();
    return createArtifact();
  }, [clearError, createArtifact]);

  /**
   * Get status text for UI
   */
  const getStatusText = useCallback(() => {
    switch (artifactState) {
      case "checking":
        return "Checking for artifact...";
      case "creating":
        return "Weaving your sacred artifact...";
      case "success":
        return "Artifact ready";
      case "error":
        return "Creation failed";
      default:
        return "Ready to create";
    }
  }, [artifactState]);

  /**
   * Computed state helpers
   */
  const canCreate = artifactState === "idle" && !isLoading;
  const isCreating = artifactState === "creating";
  const hasArtifact = artifactState === "success" && artifactData;
  const hasError = artifactState === "error";

  /**
   * Auto-check on mount (only if enabled)
   */
  useEffect(() => {
    if (autoCheck && reflectionId && authToken && artifactState === "idle") {
      checkExistingArtifact();
    }
  }, [
    autoCheck,
    reflectionId,
    authToken,
    artifactState,
    checkExistingArtifact,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Validate artifact URL when artifact data changes
   */
  useEffect(() => {
    if (artifactData?.image_url) {
      // Validate URL accessibility (non-blocking)
      reflectionService
        .validateArtifactUrl(artifactData.image_url)
        .then((isValid) => {
          if (!isValid) {
            console.warn(
              "Artifact URL may not be accessible:",
              artifactData.image_url
            );
            // Don't set error state, just warn
          }
        })
        .catch((error) => {
          console.warn("Failed to validate artifact URL:", error);
        });
    }
  }, [artifactData]);

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
    clearError,
    retryCreation,
    checkExistingArtifact,

    // Helpers
    getStatusText,

    // Computed state
    canCreate,
    isCreating,
    hasArtifact,
    hasError,
  };
};

export default useArtifact;
