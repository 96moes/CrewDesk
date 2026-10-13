import { describe, expect, it } from 'vitest';
import { parseVideoUrl } from './video-url';

/**
 * The video URL parser is the one piece of the media module with real branching logic, so it
 * carries unit tests. Everything else is a thin repository pass-through covered by the e2e
 * suite.
 *
 * The accepted shapes are deliberately broad: admins paste whatever the browser's address bar
 * showed them, which is rarely the canonical form.
 */
describe('parseVideoUrl', () => {
  describe('Aparat', () => {
    it('normalises a short watch URL to an embed URL', () => {
      const parsed = parseVideoUrl('https://www.aparat.com/v/abc123');
      expect(parsed?.provider).toBe('aparat');
      expect(parsed?.embedUrl).toBe(
        'https://www.aparat.com/video/video/embed/videohash/abc123/vt/frame',
      );
    });

    it('tolerates a missing www and a trailing slash', () => {
      const parsed = parseVideoUrl('https://aparat.com/v/xyz789/');
      expect(parsed?.embedUrl).toContain('videohash/xyz789');
    });

    it('accepts an already-embedded URL without double-wrapping it', () => {
      const parsed = parseVideoUrl(
        'https://www.aparat.com/video/video/embed/videohash/abc123/vt/frame',
      );
      expect(parsed?.embedUrl).toBe(
        'https://www.aparat.com/video/video/embed/videohash/abc123/vt/frame',
      );
    });

    it('has no predictable thumbnail, so it leaves that to the admin', () => {
      expect(parseVideoUrl('https://www.aparat.com/v/abc123')?.thumbnailUrl).toBeUndefined();
    });
  });

  describe('YouTube', () => {
    it.each([
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      ['https://youtu.be/dQw4w9WgXcQ'],
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'],
      ['https://www.youtube.com/shorts/dQw4w9WgXcQ'],
      ['dQw4w9WgXcQ'],
    ])('extracts the id from %s', (input) => {
      const parsed = parseVideoUrl(input);
      expect(parsed?.provider).toBe('youtube');
      expect(parsed?.embedUrl).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      );
      expect(parsed?.thumbnailUrl).toBe(
        'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      );
    });

    it('uses the no-cookie host so the embed sets no tracking cookies', () => {
      expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl).toContain(
        'youtube-nocookie.com',
      );
    });
  });

  describe('unsupported input', () => {
    it.each([
      ['https://vimeo.com/12345'],
      ['https://example.com/video.mp4'],
      ['not a url at all'],
      [''],
      ['   '],
    ])('returns null for %j', (input) => {
      expect(parseVideoUrl(input)).toBeNull();
    });
  });
});
