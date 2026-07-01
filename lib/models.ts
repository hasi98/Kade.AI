export const MODELS = {
  chat: "gemini-3.1-flash-lite-preview",
  chatFallback1: "gemini-2.5-flash",
  chatFallback2: "gemini-2.5-flash-lite",
  vision: "gemini-3.1-flash-lite-preview",
  complex: "gemma-4-31b-it",
  classifier: "gemma-4-26b-a4b-it",
  voice: "gemini-3.1-flash-live-preview",
  voiceFallback: "gemini-2.5-flash-native-audio-latest",
} as const;

export type ModelKey = keyof typeof MODELS;
export type TextModel = typeof MODELS.chat | typeof MODELS.chatFallback1 | typeof MODELS.chatFallback2 | typeof MODELS.complex;

export function alternateTextModel(model: TextModel): TextModel {
  if (model === MODELS.chat) return MODELS.chatFallback1;
  if (model === MODELS.chatFallback1) return MODELS.chatFallback2;
  if (model === MODELS.chatFallback2) return MODELS.complex;
  return MODELS.chat;
}
