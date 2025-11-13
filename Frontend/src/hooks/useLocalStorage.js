/**
 * A React hook that syncs a state variable with localStorage.
 *
 * Automatically loads initial value from localStorage
 * Automatically updates localStorage whenever the value changes
 * JSON-safe (handles parsing errors gracefully)
 *
 * Usage:
 * const [user, setUser] = useLocalStorage("user", { name: "Guest" });
 *
 * @param {string} key - The localStorage key to use
 * @param {*} defaultValue - The default value if none is found in storage
 * @returns {[any, function]} - The stored value and a setter function
 */

import { useState, useEffect } from "react";

export function useLocalStorage(key, defaultValue) {
  // Load initial value (lazy initialization to prevent re-renders)
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage whenever value changes
  useEffect(() => {
    try {
      if (value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
