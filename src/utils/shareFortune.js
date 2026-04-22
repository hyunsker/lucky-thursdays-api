/** WebView 등에서 clipboard API 가 막힐 때 */
function copyWithExecCommand(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

/** Web Share API(모바일에서 카톡 등) → 실패 시 조용히 클립보드 */
export async function shareFortuneContent({ title, text, url }) {
  const message = url ? `${text}\n${url}` : text;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const payload = { title, text: message };
    if (url) payload.url = url;
    try {
      await navigator.share(payload);
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
      return;
    }
  } catch {
    /* ignore */
  }
  copyWithExecCommand(message);
}
