import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function GoogleTracking() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    // Fetch public settings once
    fetch("/api/public-settings")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.settings?.googlePixelId) {
          setPixelId(data.settings.googlePixelId);
        }
      })
      .catch(() => {
        // Ignore errors quietly
      });
  }, []);

  useEffect(() => {
    if (!pixelId) return;

    // Check if script already exists to avoid duplicates
    if (document.getElementById("google-pixel-script")) return;

    // 1. Add gtag script
    const script = document.createElement("script");
    script.id = "google-pixel-script";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${pixelId}`;
    script.async = true;
    document.head.appendChild(script);

    // 2. Add inline config script
    const inlineScript = document.createElement("script");
    inlineScript.id = "google-pixel-config";
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${pixelId}', {
        page_path: window.location.pathname
      });
    `;
    document.head.appendChild(inlineScript);

    return () => {
      // Optional: Cleanup if needed, but usually we leave tracking active
    };
  }, [pixelId]);

  useEffect(() => {
    // Track page views on route change
    if (!pixelId) return;
    
    // Ensure gtag is defined
    // @ts-ignore
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      // @ts-ignore
      window.gtag("event", "page_view", {
        page_path: location,
      });
    }
  }, [location, pixelId]);

  return null;
}
