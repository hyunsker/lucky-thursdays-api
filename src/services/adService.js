import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

const DEFAULT_TIMEOUT_MS = 120_000;

function pausePlayableMedia() {
  if (typeof document === 'undefined') return () => {};

  const mediaEls = Array.from(document.querySelectorAll('audio, video'));
  const pausedByAd = [];

  for (const el of mediaEls) {
    if (!el.paused) {
      el.pause();
      pausedByAd.push(el);
    }
  }

  return () => {
    for (const el of pausedByAd) {
      void el.play().catch(() => {});
    }
  };
}

export async function playFullScreenAd({ adGroupId, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!adGroupId) return { status: 'error', reason: 'missing_ad_group_id' };

  const supported =
    typeof loadFullScreenAd?.isSupported === 'function' &&
    loadFullScreenAd.isSupported() &&
    typeof showFullScreenAd?.isSupported === 'function' &&
    showFullScreenAd.isSupported();

  if (!supported) return { status: 'skipped', reason: 'not_supported' };

  return new Promise((resolve) => {
    let settled = false;
    let cleanupLoad = () => {};
    let cleanupShow = () => {};
    let timeoutId = null;
    let restoreAudio = () => {};

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      cleanupLoad();
      cleanupShow();
      restoreAudio();
      resolve(result);
    };

    timeoutId = setTimeout(() => {
      finish({ status: 'error', reason: 'timeout' });
    }, timeoutMs);

    cleanupLoad = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event?.type !== 'loaded') return;

        restoreAudio = pausePlayableMedia();

        cleanupShow = showFullScreenAd({
          options: { adGroupId },
          onEvent: (showEvent) => {
            if (showEvent?.type === 'show') {
              return;
            }

            if (showEvent?.type === 'dismissed') {
              finish({ status: 'shown' });
              return;
            }

            if (showEvent?.type === 'failedToShow') {
              finish({ status: 'error', reason: 'failed_to_show' });
            }
          },
          onError: () => {
            finish({ status: 'error', reason: 'show_error' });
          },
        });
      },
      onError: () => {
        finish({ status: 'error', reason: 'load_error' });
      },
    });
  });
}
