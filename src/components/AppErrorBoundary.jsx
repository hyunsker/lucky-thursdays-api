import { Component } from 'react';

const shell = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f0f0f',
  color: '#f0ead6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Segoe UI", Roboto, sans-serif',
  padding: 20,
  boxSizing: 'border-box',
};

const card = {
  width: '100%',
  maxWidth: 360,
  background: '#1a1a1a',
  border: '0.5px solid #2a2a2a',
  borderRadius: 16,
  padding: '24px 18px',
  textAlign: 'center',
};

const btn = {
  width: '100%',
  minHeight: 44,
  border: 'none',
  borderRadius: 12,
  marginTop: 14,
  background: '#c9a84c',
  color: '#0f0f0f',
  fontSize: 15,
  fontWeight: 700,
};

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary] render crash', error, info);
  }

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={shell} role="alert" aria-live="assertive">
        <div style={card}>
          <h1 style={{ margin: 0, fontSize: 20 }}>일시적인 오류가 발생했어요</h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.5, color: '#888888' }}>
            잠시 후 다시 시도하면 대부분 정상 동작합니다.
          </p>
          <button type="button" onClick={this.handleReload} style={btn}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }
}
