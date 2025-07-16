import React, { useState, useEffect } from "react";
import AuthLayout from "./AuthLayout";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";
import { storageService } from "../../services/storage.service";

/**
 * Main auth application component that handles routing between signin and signup
 * @returns {JSX.Element} - Auth app component
 */
const AuthApp = () => {
  const [currentPage, setCurrentPage] = useState("signin");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Determine which page to show based on URL
    const path = window.location.pathname;

    if (path.includes("/signup") || path.includes("/register")) {
      setCurrentPage("signup");
    } else {
      setCurrentPage("signin");
    }
  }, []);

  /**
   * Handle page transitions with smooth animations
   * @param {string} page - Target page ('signin' or 'signup')
   */
  const handlePageTransition = (page) => {
    if (page === currentPage || isTransitioning) return;

    setIsTransitioning(true);

    // Update URL without page reload
    const newPath = page === "signup" ? "/auth/signup" : "/auth/signin";
    window.history.pushState(null, "", newPath);

    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
    }, 300);
  };

  /**
   * Handle authentication success
   * @param {Object} result - Auth result from API
   */
  const handleAuthSuccess = (result) => {
    // Store auth data using storage service
    storageService.setAuthToken(result.token);
    localStorage.setItem("mirrorVerifiedUser", JSON.stringify(result.user));

    // Add celebration effect for signup
    if (currentPage === "signup") {
      createCelebrationEffect();
    }

    // Redirect to dashboard
    setTimeout(
      () => {
        window.location.href = "/dashboard";
      },
      currentPage === "signup" ? 2500 : 1000
    );
  };
  /**
   * Create celebration effect for successful signup
   */
  const createCelebrationEffect = () => {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const sparkle = document.createElement("div");
        sparkle.style.position = "fixed";
        sparkle.style.width = "6px";
        sparkle.style.height = "6px";
        sparkle.style.background = "rgba(110, 231, 183, 0.8)";
        sparkle.style.borderRadius = "50%";
        sparkle.style.pointerEvents = "none";
        sparkle.style.zIndex = "1000";
        sparkle.style.left =
          Math.random() * window.innerWidth * 0.6 +
          window.innerWidth * 0.2 +
          "px";
        sparkle.style.top =
          Math.random() * window.innerHeight * 0.4 +
          window.innerHeight * 0.3 +
          "px";

        document.body.appendChild(sparkle);

        sparkle.animate(
          [
            {
              opacity: 0,
              transform: "scale(0) rotate(0deg)",
            },
            {
              opacity: 1,
              transform: "scale(1.5) rotate(180deg)",
            },
            {
              opacity: 0,
              transform: "scale(0) rotate(360deg)",
            },
          ],
          {
            duration: 2000,
            easing: "ease-out",
          }
        ).onfinish = () => {
          if (document.body.contains(sparkle)) {
            document.body.removeChild(sparkle);
          }
        };
      }, i * 100);
    }
  };

  /**
   * Get page title based on current page
   */
  const getPageTitle = () => {
    switch (currentPage) {
      case "signup":
        return "Begin Your Journey";
      case "signin":
      default:
        return "Welcome Back";
    }
  };

  /**
   * Get page subtitle based on current page
   */
  const getPageSubtitle = () => {
    switch (currentPage) {
      case "signup":
        return "Your path to self-discovery starts here";
      case "signin":
      default:
        return "Continue your consciousness journey";
    }
  };

  return (
    <AuthLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      showBackButton={true}
      backUrl="/portal"
    >
      {/* Form Container with Transition */}
      <div
        className={`auth-form-wrapper ${
          isTransitioning ? "transitioning" : ""
        }`}
      >
        {currentPage === "signin" && (
          <SigninForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => handlePageTransition("signup")}
          />
        )}

        {currentPage === "signup" && (
          <SignupForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignin={() => handlePageTransition("signin")}
          />
        )}
      </div>

      {/* Transition Styles */}
      <style jsx>{`
        .auth-form-wrapper {
          width: 100%;
          opacity: 1;
          transform: translateY(0);
          transition: all 0.3s ease;
        }

        .auth-form-wrapper.transitioning {
          opacity: 0;
          transform: translateY(20px);
        }

        /* Smooth page transitions */
        .auth-form-wrapper > * {
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Reduce animations for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .auth-form-wrapper,
          .auth-form-wrapper > * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AuthLayout>
  );
};

export default AuthApp;
