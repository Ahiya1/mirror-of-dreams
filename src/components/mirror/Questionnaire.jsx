import React, { useState, useEffect, useRef, useCallback } from "react";
import CosmicBackground from "../shared/CosmicBackground";
import ToneElements from "../shared/ToneElements";
import ToneSelector from "../shared/ToneSelector";
import QuestionCard from "../shared/QuestionCard";

const Questionnaire = () => {
  // Form state
  const [selectedTone, setSelectedTone] = useState("fusion");
  const [formData, setFormData] = useState({
    dream: "",
    plan: "",
    hasDate: "",
    dreamDate: "",
    relationship: "",
    offering: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // User state
  const [userData, setUserData] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Refs for form persistence
  const formRef = useRef(null);
  const persistTimeoutRef = useRef(null);

  // Initialize authentication and form state
  useEffect(() => {
    initializeAuth();
    restoreFormState();

    // Cleanup on unmount
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      clearFormState();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get("mode");
      const premium = urlParams.get("premium");

      // Clear any existing form states for security
      clearAllFormStates();

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
        redirectToAuth("Authentication required for reflections");
        return;
      } else {
        // Verify token with backend
        const user = await verifyAuthToken(token);
        setUserData(user);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      redirectToAuth("Authentication failed, please sign in again");
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

  const redirectToAuth = (message) => {
    alert(message);
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `/auth/signin?returnTo=${returnUrl}`;
  };

  // Form persistence
  const getStateKey = () =>
    userData?.id ? `mirror_form_state_${userData.id}` : null;

  const clearAllFormStates = () => {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("mirror_form_state")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear form states:", error);
    }
  };

  const saveFormState = useCallback(() => {
    if (!userData?.id) return;

    // Debounce saves
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      try {
        const stateKey = getStateKey();
        if (!stateKey) return;

        const state = {
          ...formData,
          selectedTone,
          timestamp: Date.now(),
          userId: userData.id,
        };

        sessionStorage.setItem(stateKey, JSON.stringify(state));
        console.log("Form state saved");
      } catch (error) {
        console.warn("Failed to save form state:", error);
      }
    }, 1000);
  }, [formData, selectedTone, userData?.id]);

  const restoreFormState = () => {
    try {
      const stateKey = getStateKey();
      if (!stateKey) return;

      const savedData = sessionStorage.getItem(stateKey);
      if (!savedData) return;

      const state = JSON.parse(savedData);

      // Security check
      if (state.userId !== userData?.id) {
        sessionStorage.removeItem(stateKey);
        return;
      }

      // Check if state is too old (2 hours)
      const now = Date.now();
      const stateAge = now - state.timestamp;
      const maxAge = 2 * 60 * 60 * 1000;

      if (stateAge > maxAge) {
        sessionStorage.removeItem(stateKey);
        return;
      }

      // Check for fresh start URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("fresh") === "true" ||
        urlParams.get("new") === "true"
      ) {
        return;
      }

      // Restore state
      setFormData({
        dream: state.dream || "",
        plan: state.plan || "",
        hasDate: state.hasDate || "",
        dreamDate: state.dreamDate || "",
        relationship: state.relationship || "",
        offering: state.offering || "",
      });

      if (state.selectedTone) {
        setSelectedTone(state.selectedTone);
      }

      console.log("Form state restored");
    } catch (error) {
      console.warn("Failed to restore form state:", error);
    }
  };

  const clearFormState = () => {
    try {
      const stateKey = getStateKey();
      if (stateKey) {
        sessionStorage.removeItem(stateKey);
      }
    } catch (error) {
      console.warn("Failed to clear form state:", error);
    }
  };

  // Auto-save form changes
  useEffect(() => {
    if (userData?.id) {
      saveFormState();
    }
  }, [formData, selectedTone, saveFormState, userData?.id]);

  // Form handlers
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToneChange = (tone) => {
    setSelectedTone(tone);
    // Add subtle haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "dream",
      "plan",
      "hasDate",
      "relationship",
      "offering",
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim().length === 0) {
        return { isValid: false, field };
      }
    }

    // If hasDate is 'yes', dreamDate is required
    if (formData.hasDate === "yes" && !formData.dreamDate) {
      return { isValid: false, field: "dreamDate" };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validation = validateForm();
    if (!validation.isValid) {
      alert("Please fill in all required fields with your authentic response.");
      return;
    }

    setIsSubmitting(true);
    setShowLoading(true);

    try {
      const payload = {
        dream: formData.dream,
        plan: formData.plan,
        hasDate: formData.hasDate,
        dreamDate: formData.dreamDate,
        relationship: formData.relationship,
        offering: formData.offering,
        userName: userData?.name || "Friend",
        userEmail: userData?.email || "",
        language: "en",
        isAdmin: userData?.isCreator || userData?.testMode,
        isCreator: userData?.isCreator,
        isPremium: userData?.tier === "premium" || userData?.isCreator,
        tone: selectedTone,
      };

      const headers = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/reflection", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 403 && data.needsUpgrade) {
        alert(data.message || "Reflection limit reached");
        return;
      }

      if (!data.success) {
        throw new Error(data.error || "Reflection failed");
      }

      // Clear form state for security
      clearFormState();

      // Redirect to output page
      window.location.href = `/mirror/output?id=${data.reflectionId}`;
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        "A moment of silence… Your reflection is being prepared. Please try again soon."
      );
    } finally {
      setIsSubmitting(false);
      setShowLoading(false);
    }
  };

  if (showLoading) {
    return (
      <div className="mirror-container">
        <CosmicBackground />
        <ToneElements tone={selectedTone} />

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
            Reflecting your truth...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mirror-container">
      <CosmicBackground />
      <ToneElements tone={selectedTone} />

      {/* Back Navigation */}
      <a href="/" className="back-link">
        <span>←</span>
        <span>Return to Portal</span>
      </a>

      <div className="mirror-content">
        <ToneSelector
          selectedTone={selectedTone}
          onToneChange={handleToneChange}
        />

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Question 1: Dream */}
          <QuestionCard
            questionNumber={1}
            title="What is your dream?"
            subtitle="Choose just one — the one that calls you most right now."
            type="textarea"
            value={formData.dream}
            onChange={(value) => updateFormData("dream", value)}
            maxLength={3200}
            placeholder="Write the dream that calls you..."
          />

          {/* Question 2: Plan */}
          <QuestionCard
            questionNumber={2}
            title="What is your plan for achieving this dream?"
            subtitle="Write what you already know. It's okay if it's unclear."
            type="textarea"
            value={formData.plan}
            onChange={(value) => updateFormData("plan", value)}
            maxLength={4000}
            placeholder="Describe any plan (or absence of plan)..."
          />

          {/* Question 3: Date */}
          <QuestionCard
            questionNumber={3}
            title="Have you set a definite date for fulfilling your dream?"
            type="choice"
            choices={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            selectedChoice={formData.hasDate}
            onChoiceSelect={(value) => updateFormData("hasDate", value)}
            showDateInput={formData.hasDate === "yes"}
            dateValue={formData.dreamDate}
            onDateChange={(value) => updateFormData("dreamDate", value)}
          />

          {/* Question 4: Relationship */}
          <QuestionCard
            questionNumber={4}
            title="What is your current relationship with this dream?"
            subtitle="Do you believe you'll achieve it? Why or why not?"
            type="textarea"
            value={formData.relationship}
            onChange={(value) => updateFormData("relationship", value)}
            maxLength={4000}
            placeholder="How do you relate to this dream now?"
          />

          {/* Question 5: Offering */}
          <QuestionCard
            questionNumber={5}
            title="What are you willing to give in return?"
            subtitle="Energy, focus, love, time — what will you offer to this dream?"
            type="textarea"
            value={formData.offering}
            onChange={(value) => updateFormData("offering", value)}
            maxLength={2400}
            placeholder="What will you offer in return?"
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="cosmic-button cosmic-button--primary"
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: "var(--space-2xl)",
              padding: "var(--space-lg) var(--space-xl)",
              fontSize: "var(--text-lg)",
              fontWeight: 500,
              letterSpacing: "1px",
              textTransform: "uppercase",
              minHeight: "64px",
            }}
          >
            {isSubmitting
              ? "Creating your reflection..."
              : "Receive Your Reflection"}
          </button>
        </form>
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
      `}</style>
    </div>
  );
};

export default Questionnaire;
