'use client';

/**
 * PublicShell — pass-through wrapper.
 * Header/Footer are handled by (public)/layout.js for public routes
 * and admin routes skip them via admin/layout.js.
 */
export default function PublicShell({ children }) {
    return children;
}
