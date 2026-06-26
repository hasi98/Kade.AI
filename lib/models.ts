export const MODELS = {
  chat: "gemini-3.1-flash-preview",
  vision: "gemini-3.1-flash-lite-preview",
  complex: "gemma-4-31b-it",
  classifier: "gemma-4-26b-a4b-it",
  voice: "gemini-3.1-flash-live-preview",
  voiceFallback: "gemini-2.5-flash-native-audio-latest",
} as const;

export type ModelKey = keyof typeof MODELS;
export type TextModel = typeof MODELS.chat | typeof MODELS.complex;

export function alternateTextModel(model: TextModel): TextModel {
  return model === MODELS.chat ? MODELS.complex : MODELS.chat;
}
