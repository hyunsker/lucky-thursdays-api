/**
 * 앱인토스 웹뷰: 노치·홈 인디케이터 대응 + 논리 폭 권장(약 360~420) 반영
 * @see https://developers-apps-in-toss.toss.im/design/resolution.html
 */

/** 세로 미니앱에서 많이 쓰이는 최대 콘텐츠 폭 상한 */
export const TOSS_MAX_CONTENT_WIDTH = 420;

/**
 * 기존 패딩 + safe-area (env는 iOS·일부 Android에서 동작)
 */
export const tossPadding = {
  input: {
    paddingTop: 'calc(32px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'calc(22px + env(safe-area-inset-left, 0px))',
    paddingRight: 'calc(22px + env(safe-area-inset-right, 0px))',
  },
  result: {
    paddingTop: 'calc(28px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(44px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'calc(22px + env(safe-area-inset-left, 0px))',
    paddingRight: 'calc(22px + env(safe-area-inset-right, 0px))',
  },
  loading: {
    paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'calc(28px + env(safe-area-inset-left, 0px))',
    paddingRight: 'calc(28px + env(safe-area-inset-right, 0px))',
  },
};

export const tossViewportShell = {
  width: '100%',
  maxWidth: TOSS_MAX_CONTENT_WIDTH,
  margin: '0 auto',
  boxSizing: 'border-box',
};
