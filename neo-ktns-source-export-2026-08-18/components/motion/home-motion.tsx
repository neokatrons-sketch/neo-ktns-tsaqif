"use client";

import { useEffect } from "react";

const ENHANCED_CLASS = "motion-enhanced";
const VISIBLE_CLASS = "is-visible";

export function HomeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    const footer = document.querySelector<HTMLElement>("[data-site-footer]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scrollFrame = 0;

    root.dataset.homeMotion = "active";

    const updateHeader = () => {
      header?.toggleAttribute("data-scrolled", window.scrollY > 24);
      scrollFrame = 0;
    };
    const handleScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeader);
    };

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (reducedMotion) {
      return () => {
        delete root.dataset.homeMotion;
        header?.removeAttribute("data-scrolled");
        window.removeEventListener("scroll", handleScroll);
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      };
    }

    const entryTargets = [
      ...(header ? [header] : []),
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-home-entry]")),
    ];
    entryTargets.forEach((element) => element.classList.add(ENHANCED_CLASS));

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        entryTargets.forEach((element) => element.classList.add(VISIBLE_CLASS));
      });
    });

    const revealTargets = [
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")),
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-stagger-group]")),
      ...(footer ? [footer] : []),
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add(VISIBLE_CLASS);
          observer.unobserve(element);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 },
    );

    revealTargets.forEach((element) => {
      element.classList.add(ENHANCED_CLASS);
      observer.observe(element);
    });

    return () => {
      delete root.dataset.homeMotion;
      header?.removeAttribute("data-scrolled");
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(firstFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      observer.disconnect();
      [...entryTargets, ...revealTargets].forEach((element) => {
        element.classList.remove(ENHANCED_CLASS, VISIBLE_CLASS);
      });
    };
  }, []);

  return null;
}
