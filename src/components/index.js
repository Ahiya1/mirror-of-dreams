// components/index.js - Centralized component exports

// Mirror components
export { default as MirrorApp } from "./mirror/MirrorApp";
export { default as Questionnaire } from "./mirror/Questionnaire";
export { default as Output } from "./mirror/Output";

// Mirror sections
export { default as ArtifactSection } from "./mirror/sections/ArtifactSection";
export { default as FeedbackSection } from "./mirror/sections/FeedbackSection";
export { default as MarkdownRenderer } from "./mirror/sections/MarkdownRenderer";

// Shared components
export { default as CharacterCounter } from "./shared/CharacterCounter";
export { default as CosmicBackground } from "./shared/CosmicBackground";
export { default as QuestionCard } from "./shared/QuestionCard";
export { default as ToneElements } from "./shared/ToneElements";
export { default as ToneSelector } from "./shared/ToneSelector";

// Hooks
export { useAuth } from "../hooks/useAuth";
export { useArtifact } from "../hooks/useArtifact";
export { useFeedback } from "../hooks/useFeedback";
export { useFormPersistence } from "../hooks/useFormPersistence";

// Services
export { authService } from "../services/auth.service";
export { reflectionService } from "../services/reflection.service";
export { storageService } from "../services/storage.service";
export { apiClient } from "../services/api";

// Utils
export * from "../utils/constants";
export * from "../utils/validation";
