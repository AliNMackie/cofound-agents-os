"use client";

import { useEffect } from "react";

/**
 * Pre-warms the Sentinel backend on app load.
 * Cloud Run instances may be cold-started, so this ping
 * wakes them up before the user navigates to data-heavy pages.
 */
export function BackendPrewarm() {
    useEffect(() => {
        const prewarm = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sentinel-growth-1005792944830.europe-west2.run.app";
                console.log("[Prewarm] Pinging Sentinel backend:", apiUrl);

                const response = await fetch(`${apiUrl}/health`, {
                    method: "GET",
                    // Don't wait too long for prewarm
                    signal: AbortSignal.timeout(5000),
                });

                if (response.ok) {
                    console.log("[Prewarm] Sentinel backend is warm and ready");
                } else {
                    console.warn("[Prewarm] Sentinel responded with:", response.status);
                }
            } catch (err) {
                // Silent fail - prewarm is best-effort
                console.log("[Prewarm] Sentinel not reachable, will use cached data if needed");
            }
        };

        // Run prewarm after a short delay to not block initial render
        const timer = setTimeout(prewarm, 500);
        return () => clearTimeout(timer);
    }, []);

    // This component renders nothing
    return null;
}
