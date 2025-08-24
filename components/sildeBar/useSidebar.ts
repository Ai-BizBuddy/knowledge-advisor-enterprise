import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getDefaultNavigationItems } from './constants';
import type { NavigationMenuItem } from './types';

/**
 * Custom hook for managing sidebar state and navigation logic
 */
export const useSidebar = () => {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationMenuItem[]>(
    [],
  );
  const isInitialMount = useRef(true);

  /**
   * Filter navigation items based on user permissions
   */
  const getFilteredNavigationItems = useCallback(() => {
    const allItems = getDefaultNavigationItems();
    return allItems;
  }, []);

  /**
   * Initialize navigation items with permission filtering
   */
  useEffect(() => {
    const filteredItems = getFilteredNavigationItems();
    setNavigationItems(filteredItems);
  }, [getFilteredNavigationItems]);

  /**
   * Handles menu item activation and loading state
   */
  const handleMenuItemClick = useCallback((index: number) => {
    setNavigationItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        active: i === index,
      })),
    );
    // Loading logic will be handled by parent via prop
  }, []);

  /**
   * Toggle user dropdown menu
   */
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
  }, []);

  /**
   * Close user dropdown menu
   */
  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  /**
   * Update active menu item based on current pathname
   */
  useEffect(() => {
    if (!pathname) return;

    setNavigationItems((prev) => {
      const activeIndex = prev.findIndex((item) => item.url === pathname);
      if (activeIndex !== -1 && !prev[activeIndex].active) {
        return prev.map((item, i) => ({
          ...item,
          active: i === activeIndex,
        }));
      }
      return prev;
    });
    isInitialMount.current = false;
  }, [pathname]);

  return {
    navigationItems,
    isUserMenuOpen,
    handleMenuItemClick,
    toggleUserMenu,
    closeUserMenu,
  };
};
