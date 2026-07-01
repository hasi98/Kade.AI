/**
 * Central agent identity. Change these values to rename the concierge
 * across the entire app (UI strings + system prompt) in one place.
 */
export const AGENT = {
  /** Display name used throughout the UI and the system prompt. */
  name: "Kapū",
  /** Localized (Sinhala) form, shown alongside the name in the system prompt. */
  nameLocal: "කපූ",
  /** Subjective pronoun used when referring to the agent in copy. */
  pronoun: "she",
  /** Possessive pronoun. */
  possessivePronoun: "her",
  /** Single-letter avatar glyph. */
  initial: "K",
  /** Short product/brand tagline shown next to the name in the header. */
  tagline: "Kapruka Concierge",
} as const;
