import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/ui';
import { deepseekChat } from '@/api/deepseek';

export function ApiKeyModal() {
  const { apiKey, setApiKey, apiUrl, setApiUrl, apiModel, setApiModel, isApiKeyModalOpen, setApiKeyModalOpen } = useUIStore();
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // 显示条件提前定义
  const shouldShow = isApiKeyModalOpen || (!apiKey && status !== 'success');
  
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [inputUrl, setInputUrl] = useState(apiUrl || '');
  const [inputModel, setInputModel] = useState(apiModel || '');
  const [lastError, setLastError] = useState<any>(null);

  // 每次显示时初始化输入框
  useEffect(() => {
    if (shouldShow) {
      setInputKey(apiKey || '');
      setInputUrl(apiUrl || '');
      setInputModel(apiModel || '');
    }
  }, [shouldShow, apiKey, apiUrl, apiModel]);

  const verifyAndSave = async (key: string, url: string, model: string) => {
    setStatus('testing');
    setLastError(null);
    try {
      // 简单测试 API Key 是否有效
      await deepseekChat({
        messages: [{ role: 'user', content: 'Hello' }],
        apiKey: key,
        apiUrl: url,
        apiModel: model,
        stream: false
      });
      setApiKey(key);
      setApiUrl(url);
      setApiModel(model);
      setStatus('success');
      setTimeout(() => {
        setApiKeyModalOpen(false);
        setStatus('idle');
      }, 1000);
    } catch (error) {
      console.error(error);
      setLastError(error);
      setStatus('error');
    }
  };

  const handleSave = () => verifyAndSave(inputKey, inputUrl, inputModel);

  const handleClose = () => {
    if (apiKey) {
      setApiKeyModalOpen(false);
      setStatus('idle');
    }
  };

  const exportErrorLog = () => {
    if (!lastError) return;
    const errorInfo = {
      message: lastError?.message || String(lastError),
      stack: lastError?.stack,
      time: new Date().toISOString(),
      userAgent: navigator.userAgent,
      inputKeyMasked: inputKey ? `${inputKey.slice(0, 3)}...${inputKey.slice(-4)}` : 'empty'
    };
    const blob = new Blob([JSON.stringify(errorInfo, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pale-notes-error.log';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div className="bg-surface border border-text-muted p-6 rounded-lg max-w-md w-full space-y-4 shadow-2xl relative">
        {apiKey && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
          >
            ✕
          </button>
        )}
        <h2 className="text-xl font-serif text-accent-lantern">欢迎来到苍白卷宗</h2>
        <div className="space-y-4 text-sm text-text-secondary">
          <p className="text-text-primary font-bold text-base">
            感谢大家的访问和支持！
          </p>
          <p>
            为了继续您的旅程，请在下方配置您的 OpenAI 或 DeepSeek (等兼容 API) 访问信息。
          </p>
          <div className="text-xs text-text-muted bg-surface/50 p-2 rounded border border-text-muted/20">
            您的配置仅存储在本地浏览器中，直接发送至接口，不会经过任何第三方服务器。如果不填接口与模型，将默认使用 DeepSeek 的官方模型。
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">API Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-background border border-text-muted rounded p-2 text-text-primary focus:border-accent-lantern outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Base URL (选填)</label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full bg-background border border-text-muted rounded p-2 text-text-primary focus:border-accent-lantern outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Model (选填)</label>
            <input
              type="text"
              value={inputModel}
              onChange={(e) => setInputModel(e.target.value)}
              placeholder="deepseek-reasoner"
              className="w-full bg-background border border-text-muted rounded p-2 text-text-primary focus:border-accent-lantern outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={handleSave}
            disabled={status === 'testing' || !inputKey}
            className="px-4 py-2 bg-accent-lantern/20 text-accent-lantern border border-accent-lantern/50 rounded hover:bg-accent-lantern/30 disabled:opacity-50 transition-colors"
          >
            {status === 'testing' ? '验证中...' : '保存并开始'}
          </button>
        </div>

        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-xs text-accent-grail">验证失败，请检查 Key 是否正确或额度是否充足。</p>
            <button
              onClick={exportErrorLog}
              className="text-xs text-text-muted underline hover:text-text-primary"
            >
              导出错误日志
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
