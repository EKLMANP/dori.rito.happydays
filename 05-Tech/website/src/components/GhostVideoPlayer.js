'use client';

import { useEffect } from 'react';

/**
 * Activates Ghost CMS video cards by wiring up the play overlay.
 * Click overlay → hides overlay, adds native controls, plays video.
 * Also handles video load errors with a user-friendly fallback.
 */
export default function GhostVideoPlayer() {
    useEffect(() => {
        const cards = document.querySelectorAll('.kg-video-card');
        if (!cards.length) return;

        const cleanups = [];

        cards.forEach((card) => {
            const video = card.querySelector('video');
            const overlay = card.querySelector('.kg-video-overlay');
            if (!video) return;

            /** Show a friendly fallback when video fails to load (safe DOM methods, no innerHTML) */
            const showFallback = () => {
                const container = card.querySelector('.kg-video-container') || card;
                container.classList.add('kg-video-error');

                // Clear existing children safely
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'kg-video-error-content';

                const icon = document.createElement('span');
                icon.className = 'kg-video-error-icon';
                icon.textContent = '\uD83C\uDFAC'; // 🎬

                const title = document.createElement('p');
                title.className = 'kg-video-error-title';
                title.textContent = '影片暫時無法播放';

                const hint = document.createElement('p');
                hint.className = 'kg-video-error-hint';
                hint.textContent = '請稍後再試或聯繫我們';

                wrapper.appendChild(icon);
                wrapper.appendChild(title);
                wrapper.appendChild(hint);
                container.appendChild(wrapper);
            };

            /** Handle video element errors (404, network, decode) */
            const handleError = () => {
                console.warn('[GhostVideoPlayer] Video failed to load:', video.src);
                showFallback();
            };

            video.addEventListener('error', handleError);
            cleanups.push(() => video.removeEventListener('error', handleError));

            if (overlay) {
                const handleClick = () => {
                    overlay.style.display = 'none';
                    video.controls = true;
                    video.play().catch((err) => {
                        console.warn('[GhostVideoPlayer] Play failed:', err.message);
                    });
                };

                overlay.addEventListener('click', handleClick);
                cleanups.push(() => overlay.removeEventListener('click', handleClick));
            }

            video.addEventListener('click', () => {
                if (video.paused) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        });

        return () => cleanups.forEach((fn) => fn());
    }, []);

    return null;
}
