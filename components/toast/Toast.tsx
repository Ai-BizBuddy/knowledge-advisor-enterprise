"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ToastMessage, ToastType } from "./Toast.types";

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const getToastStyles = (type: ToastType) => {
    const baseStyles =
      "flex items-center w-full max-w-xs p-4 text-sm rounded-lg shadow-lg backdrop-blur-sm border";

    switch (type) {
      case "success":
        return `${baseStyles} bg-green-50/90 text-green-800 border-green-200 dark:bg-green-900/90 dark:text-green-200 dark:border-green-800`;
      case "error":
        return `${baseStyles} bg-red-50/90 text-red-800 border-red-200 dark:bg-red-900/90 dark:text-red-200 dark:border-red-800`;
      case "warning":
        return `${baseStyles} bg-yellow-50/90 text-yellow-800 border-yellow-200 dark:bg-yellow-900/90 dark:text-yellow-200 dark:border-yellow-800`;
      case "info":
      default:
        return `${baseStyles} bg-blue-50/90 text-blue-800 border-blue-200 dark:bg-blue-900/90 dark:text-blue-200 dark:border-blue-800`;
    }
  };

  const getIcon = (type: ToastType) => {
    const iconClasses =
      "inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg";

    switch (type) {
      case "success":
        return (
          <div
            className={`${iconClasses} bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200`}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div
            className={`${iconClasses} bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200`}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div
            className={`${iconClasses} bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200`}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div
            className={`${iconClasses} bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200`}
          >
            <svg
              className="h-5 w-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            duration: 0.3,
          }}
          className={getToastStyles(toast.type)}
          role="alert"
        >
          {getIcon(toast.type)}
          <div className="ml-3 flex-1 text-sm font-medium">{toast.message}</div>
          <button
            type="button"
            className="-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-white/20 focus:ring-2 focus:ring-gray-300"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onRemove(toast.id), 300);
            }}
            aria-label="Close"
          >
            <svg
              className="h-3 w-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
