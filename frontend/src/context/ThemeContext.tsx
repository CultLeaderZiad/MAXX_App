import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK_THEME, LIGHT_THEME, ThemeColors } from "../constants/theme";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DARK_THEME,
  mode: "dark",
  toggleTheme: () => {},
  isReady: false,
});

const STORAGE_KEY = "maxx_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") setMode(stored);
      })
      .catch(() => {})
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  }, [mode]);

  const theme = mode === "dark" ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
