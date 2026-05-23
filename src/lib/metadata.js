'use client';

const TIMEOUT_MS = 4000;

export async function fetchLinkPreview(url) {
  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return null;
    const json = await res.json();
    const d    = json.data;

    return {
      imageUrl: d?.image?.url ?? d?.logo?.url ?? null,
      title:    d?.title ?? null,
    };
  } catch {
    return null;
  }
}
