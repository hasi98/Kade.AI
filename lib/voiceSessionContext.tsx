"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { CartItem } from "@/lib/types";

export type ShownVoiceProduct = {
  index: number;
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
};

export type VoiceTranscriptEntry = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  hasProducts?: boolean;
};

export interface VoiceSessionState {
  shownProducts: ShownVoiceProduct[];
  detectedOccasion: string | null;
  detectedRecipient: string | null;
  detectedBudget: number | null;
  detectedCity: string | null;
  cartItems: CartItem[];
  transcript: VoiceTranscriptEntry[];
  isVoiceActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

type VoiceSessionAction =
  | { type: "SET_SHOWN_PRODUCTS"; products: ShownVoiceProduct[] }
  | { type: "ADD_TRANSCRIPT"; message: VoiceTranscriptEntry }
  | { type: "UPDATE_CART"; cartItems: CartItem[] }
  | { type: "SET_OCCASION"; occasion: string | null }
  | { type: "SET_RECIPIENT"; recipient: string | null }
  | { type: "SET_CITY"; city: string | null }
  | { type: "SET_BUDGET"; budget: number | null }
  | { type: "SET_VOICE_STATE"; active?: boolean; speaking?: boolean; listening?: boolean }
  | { type: "CLEAR_SESSION" };

const initialVoiceSessionState: VoiceSessionState = {
  shownProducts: [],
  detectedOccasion: null,
  detectedRecipient: null,
  detectedBudget: null,
  detectedCity: null,
  cartItems: [],
  transcript: [],
  isVoiceActive: false,
  isSpeaking: false,
  isListening: false,
};

function voiceSessionReducer(state: VoiceSessionState, action: VoiceSessionAction): VoiceSessionState {
  switch (action.type) {
    case "SET_SHOWN_PRODUCTS":
      return { ...state, shownProducts: action.products };
    case "ADD_TRANSCRIPT":
      return { ...state, transcript: [...state.transcript, action.message] };
    case "UPDATE_CART":
      return { ...state, cartItems: action.cartItems };
    case "SET_OCCASION":
      return { ...state, detectedOccasion: action.occasion };
    case "SET_RECIPIENT":
      return { ...state, detectedRecipient: action.recipient };
    case "SET_CITY":
      return { ...state, detectedCity: action.city };
    case "SET_BUDGET":
      return { ...state, detectedBudget: action.budget };
    case "SET_VOICE_STATE":
      return {
        ...state,
        isVoiceActive: action.active ?? state.isVoiceActive,
        isSpeaking: action.speaking ?? state.isSpeaking,
        isListening: action.listening ?? state.isListening,
      };
    case "CLEAR_SESSION":
      return { ...initialVoiceSessionState, cartItems: state.cartItems, shownProducts: state.shownProducts };
    default:
      return state;
  }
}

export type VoiceSessionContextType = {
  state: VoiceSessionState;
  dispatch: React.Dispatch<VoiceSessionAction>;
};

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(voiceSessionReducer, initialVoiceSessionState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <VoiceSessionContext.Provider value={value}>{children}</VoiceSessionContext.Provider>;
}

export function useVoiceSession() {
  const context = useContext(VoiceSessionContext);
  if (!context) {
    throw new Error("useVoiceSession must be used inside VoiceSessionProvider");
  }
  return context;
}

