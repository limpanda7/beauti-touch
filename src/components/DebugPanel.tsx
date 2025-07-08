import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  data?: any;
}

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isWebView, setIsWebView] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const authStore = useAuthStore();
  const settingsStore = useSettingsStore();

  // 웹뷰 환경 감지
  useEffect(() => {
    const checkWebView = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isInWebView = userAgent.includes('wv') || 
                         userAgent.includes('webview') ||
                         window.ReactNativeWebView !== undefined;
      setIsWebView(isInWebView);
      console.log('웹뷰 환경 감지:', isInWebView);
    };
    
    checkWebView();
  }, []);

  // 로그 인터셉터 설정
  useEffect(() => {
    if (!isWebView) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (level: LogEntry['level'], ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        data: args.length > 1 ? args : undefined
      };

      setLogs(prev => [...prev.slice(-99), logEntry]); // 최대 100개 로그 유지
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [isWebView]);

  // 자동 스크롤
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 로그 클리어
  const clearLogs = () => {
    setLogs([]);
  };

  // 로그 내보내기
  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 웹뷰가 아니면 렌더링하지 않음
  if (!isWebView) return null;

  return (
    <>
      {/* 플로팅 토글 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        }}
        title="디버그 패널 토글"
      >
        🐛
      </button>

      {/* 디버그 패널 */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '400px',
            height: '300px',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '8px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              borderBottom: '1px solid #555',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>🐛 디버그 패널</span>
            <div>
              <button
                onClick={clearLogs}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  marginRight: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                클리어
              </button>
              <button
                onClick={exportLogs}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  marginRight: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                내보내기
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* 상태 정보 */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#2d2d2d',
              borderBottom: '1px solid #555',
              fontSize: '11px',
            }}
          >
            <div>👤 Auth: {authStore.user ? `${authStore.user.email} (${authStore.user.uid})` : '로그인 안됨'}</div>
            <div>🌍 Language: {settingsStore.language}</div>
            <div>📱 Platform: {navigator.userAgent.includes('wv') ? 'Android WebView' : 'iOS WebView'}</div>
          </div>

          {/* 로그 영역 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px',
              backgroundColor: '#1e1e1e',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                로그가 없습니다...
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    marginBottom: '4px',
                    padding: '4px',
                    borderRadius: '2px',
                    backgroundColor: log.level === 'error' ? '#4a1a1a' :
                                   log.level === 'warn' ? '#4a3a1a' :
                                   log.level === 'info' ? '#1a3a4a' : '#1a1a1a',
                    borderLeft: `3px solid ${
                      log.level === 'error' ? '#ff6b6b' :
                      log.level === 'warn' ? '#ffd93d' :
                      log.level === 'info' ? '#4ecdc4' : '#6c757d'
                    }`,
                  }}
                >
                  <div style={{ color: '#888', fontSize: '10px' }}>
                    [{log.timestamp}] {log.level.toUpperCase()}
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>
                    {log.message}
                  </div>
                  {log.data && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ cursor: 'pointer', color: '#888' }}>데이터 보기</summary>
                      <pre style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '10px', 
                        color: '#ccc',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel; 