// src/media/utils/video-url.ts

export type VideoProvider = 'aparat' | 'youtube';

export interface ParsedVideo {
  provider: VideoProvider;
  /**
   * Normalised embed URL, e.g. https://www.aparat.com/video/video/embed/videohash/abc/vt/frame
   *
   * Derived here rather than accepting raw <iframe> markup from the client: storing a
   * URL keeps the value safe to render, easy to validate, and impossible to use for
   * injecting arbitrary markup into the public gallery.
   */
  embedUrl: string;
  /** Preview image when the provider exposes a predictable one. */
  thumbnailUrl?: string;
}

/**
 * Recognises the URL shapes an editor is likely to paste.
 *
 * Aparat is the dominant Iranian video host, so it is handled first; YouTube stays
 * supported because older content and imported material may live there.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  const url = rawUrl.trim();
  if (!url) return null;

  // --- Aparat -----------------------------------------------------------------
  // Accepts:
  //   https://www.aparat.com/v/abc123
  //   https://aparat.com/v/abc123/
  //   https://www.aparat.com/video/video/embed/videohash/abc123/vt/frame  (already an embed)
  const aparatHash =
    url.match(/aparat\.com\/v\/([A-Za-z0-9]+)/i)?.[1] ??
    url.match(/aparat\.com\/video\/video\/embed\/videohash\/([A-Za-z0-9]+)/i)?.[1];

  if (aparatHash) {
    return {
      provider: 'aparat',
      embedUrl: `https://www.aparat.com/video/video/embed/videohash/${aparatHash}/vt/frame`,
      // Aparat does not expose a predictable thumbnail URL pattern.
    };
  }

  // --- YouTube ----------------------------------------------------------------
  // Accepts watch URLs, youtu.be short links, /embed/, /shorts/ and the bare id.
  const youtubeId =
    url.match(/youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,})/i)?.[1] ??
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i)?.[1] ??
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,})/i)?.[1] ??
    (/^[A-Za-z0-9_-]{11}$/.test(url) ? url : undefined);

  if (youtubeId) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  return null;
}

/** Providers this API can render, for error messages and Swagger. */
export const SUPPORTED_VIDEO_HOSTS = ['aparat.com', 'youtube.com', 'youtu.be'];
