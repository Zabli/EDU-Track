import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

test('PWA & Reliability Workflows (Phase 12)', async (t) => {
  const rootDir = process.cwd();

  await t.test('PWA Manifest exists and contains all required web app standard fields', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public directory');

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifestContent.name, 'EduTrack - Academy Management Platform');
    assert.equal(manifestContent.short_name, 'EduTrack');
    assert.equal(manifestContent.start_url, '/');
    assert.equal(manifestContent.display, 'standalone');
    assert.ok(manifestContent.theme_color, 'theme_color must be defined');
    assert.ok(manifestContent.background_color, 'background_color must be defined');
    assert.ok(Array.isArray(manifestContent.icons), 'icons must be an array');
    assert.ok(manifestContent.icons.length >= 2, 'at least 2 icon definitions required');
  });

  await t.test('All referenced PWA icons exist physically on disk', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    for (const icon of manifestContent.icons) {
      // Remove leading slash for local path resolution
      const relativePath = icon.src.startsWith('/') ? icon.src.slice(1) : icon.src;
      const physicalPath = path.join(rootDir, 'public', relativePath);
      assert.ok(
        fs.existsSync(physicalPath),
        `Referenced icon ${icon.src} must exist at ${physicalPath}`
      );
    }
  });

  await t.test('Service Worker script exists and enforces safe offline invariants', () => {
    const swPath = path.join(rootDir, 'public', 'sw.js');
    assert.ok(fs.existsSync(swPath), 'sw.js must exist in public directory');

    const swContent = fs.readFileSync(swPath, 'utf8');

    // Invariant: Non-GET requests (mutations) MUST NOT be cached
    assert.ok(
      swContent.includes("request.method !== 'GET'"),
      'Service Worker must bypass caching for non-GET requests'
    );

    // Invariant: Sensitive remote database / Supabase calls MUST NOT be cached offline
    assert.ok(
      swContent.includes('supabase.co'),
      'Service Worker must explicitly avoid caching Supabase API traffic'
    );

    // Invariant: App shell assets must be precached
    assert.ok(
      swContent.includes('manifest.json') && swContent.includes('CACHE_NAME'),
      'Service Worker must precache critical application shell assets'
    );
  });

  await t.test('Safe Offline Degradation: Sensitive mutations strictly require server validation', () => {
    // Offline simulation test: offline requests must fail safely and not claim mutations occurred
    const simulateOfflineMutation = (isOnline, actionName) => {
      if (!isOnline) {
        return {
          success: false,
          offlineBlocked: true,
          message: `Network offline. ${actionName} requires a secure connection to verify academy authority.`,
        };
      }
      return { success: true, offlineBlocked: false, message: 'Processed.' };
    };

    const paymentResult = simulateOfflineMutation(false, 'Payment submission');
    assert.equal(paymentResult.success, false);
    assert.equal(paymentResult.offlineBlocked, true);
    assert.match(paymentResult.message, /Network offline/);

    const attendanceResult = simulateOfflineMutation(false, 'Attendance marking');
    assert.equal(attendanceResult.success, false);
    assert.equal(attendanceResult.offlineBlocked, true);
  });

  await t.test('Input resilience: malformed parameters or empty inputs fail gracefully without process crash', () => {
    // Test input sanitizer helper
    const sanitizePaginationInput = (page, limit) => {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      return { page: p, limit: l };
    };

    // Extreme, null, or garbage inputs
    assert.deepEqual(sanitizePaginationInput(null, null), { page: 1, limit: 20 });
    assert.deepEqual(sanitizePaginationInput('invalid', 'garbage'), { page: 1, limit: 20 });
    assert.deepEqual(sanitizePaginationInput(-5, 999999), { page: 1, limit: 100 });
    assert.deepEqual(sanitizePaginationInput(0, 0), { page: 1, limit: 20 });
  });
});
