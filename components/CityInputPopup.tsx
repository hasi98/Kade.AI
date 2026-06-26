"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import styles from "./CityInputPopup.module.css";

const COMMON_CITIES = [
  "Colombo",
  "Kandy",
  "Galle",
  "Matara",
  "Negombo",
  "Kurunegala",
  "Ratnapura",
  "Badulla",
  "Anuradhapura",
  "Polonnaruwa",
  "Trincomalee",
  "Batticaloa",
  "Jaffna",
  "Vavuniya",
  "Mannar",
  "Balangoda",
  "Embilipitiya",
  "Hambantota",
  "Tangalle",
  "Weligama",
  "Hikkaduwa",
  "Ambalangoda",
  "Kalutara",
  "Panadura",
  "Moratuwa",
  "Dehiwala",
  "Nugegoda",
  "Maharagama",
  "Kaduwela",
  "Malabe",
  "Kadawatha",
  "Kelaniya",
  "Gampaha",
  "Veyangoda",
  "Mirigama",
  "Kuliyapitiya",
  "Chilaw",
  "Puttalam",
  "Dambulla",
  "Matale",
  "Nuwara Eliya",
  "Hatton",
  "Nawalapitiya",
  "Kegalle",
  "Mawanella",
  "Avissawella",
  "Horana",
  "Bandaragama",
  "Beruwala",
  "Aluthgama",
];

interface CityInputPopupProps {
  visible: boolean;
  reason: string;
  onSubmit: (city: string) => void;
  onCancel: () => void;
}

export function CityInputPopup({ visible, reason, onSubmit, onCancel }: CityInputPopupProps) {
  const [city, setCity] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) return;
    setCity("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, [visible]);

  const suggestions = useMemo(() => {
    const query = city.trim().toLowerCase();
    if (!query) return COMMON_CITIES.slice(0, 6);
    return COMMON_CITIES.filter((item) => item.toLowerCase().includes(query)).slice(0, 6);
  }, [city]);

  if (!visible) return null;

  const submit = (value = city) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="city-popup-title">
        <button type="button" className={styles.close} aria-label="Cancel city input" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className={styles.icon}>
          <MapPin size={24} />
        </div>
        <h2 id="city-popup-title">Just one thing...</h2>
        <p>{reason || "I could not hear the city clearly. Type it here and I will continue."}</p>
        <div className={styles.inputWrap}>
          <input
            id="city-voice-input"
            ref={inputRef}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
            }}
            placeholder="e.g. Colombo, Balangoda, Kandy"
          />
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => submit(item)}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={styles.submit} onClick={() => submit()}>
          Got it →
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
      </section>
    </div>
  );
}
