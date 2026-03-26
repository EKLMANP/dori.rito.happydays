'use client';

import { useEffect } from 'react';

/**
 * Activates Ghost CMS video cards by wiring up the play overlay.
 * Click overlay → hides overlay, adds native controls, plays video.
 */
export default function GhostVideoPlayer() {
    useEffect(() => {
        const cards = document.querySelectorAll('.kg-video-card');
        if (!cards.length) return;

        const handlers = [];

        cards.forEach((card) => {
            const video = card.querySelector('video');
            const overlay = card.querySelector('.kg-video-overlay');
            if (!video || !overlay) return;

            const handleClick = () => {
                overlay.style.display = 'none';
                video.controls = true;
                video.play().catch(() => {});
            };

            overlay.addEventListener('click', handleClick);
            video.addEventListener('click', () => {
                if (video.paused) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });

            handlers.push(() => overlay.removeEventListener('click', handleClick));
        });

        return () => handlers.forEach((cleanup) => cleanup());
    }, []);

    return null;
}
