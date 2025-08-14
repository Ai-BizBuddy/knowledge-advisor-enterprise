import { DarkThemeToggle } from "flowbite-react";
import { useEffect, useState } from "react";

/**
 * Hydration-safe wrapper for DarkThemeToggle
 * Prevents SSR mismatch by only rendering after hydration
 */
export const SafeDarkThemeToggle = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the approximate size
    return (
      <div className="h-6 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    );
  }

  return <DarkThemeToggle />;
};

export default SafeDarkThemeToggle;
