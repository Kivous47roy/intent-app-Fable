'use client';

// Lightweight analytics (PRD decision 13): ritual completions, streak
// milestones, signup→2nd-visit. PostHog when NEXT_PUBLIC_POSTHOG_KEY is set;
// silent no-op otherwise so the app works without the key.

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized || typeof window === 'undefined') return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    persistence: 'localStorage',
  });
  initialized = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (initialized) posthog.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (initialized) posthog.identify(userId, props);
}

/** signup→2nd-visit conversion: fires `second_visit` once, on the first
 * visit on a later local date than the recorded first visit. */
export function trackVisit() {
  try {
    const first = localStorage.getItem('intent.firstVisitDate');
    const today = new Date().toDateString();
    if (!first) {
      localStorage.setItem('intent.firstVisitDate', today);
    } else if (first !== today && !localStorage.getItem('intent.secondVisitTracked')) {
      localStorage.setItem('intent.secondVisitTracked', '1');
      track('second_visit');
    }
  } catch {
    // localStorage unavailable (private mode) — skip
  }
}
