import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings2, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { ollamaUrl, setOllamaUrl, baseModel, setBaseModel } = useStore();
  const [urlInput, setUrlInput] = useState(ollamaUrl);
  const [modelInput, setModelInput] = useState(baseModel);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSave = () => {
    setOllamaUrl(urlInput);
    setBaseModel(modelInput);
    alert('设置已保存');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch(`${urlInput}/api/tags`);
      if (res.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (err) {
      setTestStatus('error');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
        <p className="text-slate-500 mt-1">配置本地模型连接，管理您的数据。</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Settings2 className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-slate-900">Ollama 服务配置</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                本地 API 地址
              </label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {testStatus === 'testing' ? '测试中...' : '测试连接'}
                </button>
              </div>
              
              {testStatus === 'success' && (
                <p className="text-emerald-600 text-sm mt-2 flex items-center gap-1">
                  <CheckCircle2 size={16} /> 连接成功！
                </p>
              )}
              {testStatus === 'error' && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle size={16} /> 连接失败，请检查服务是否开启或跨域配置。
                </p>
              )}
              <p className="text-slate-400 text-xs mt-2">
                提示：请确保在启动 Ollama 时设置了环境变量 OLLAMA_ORIGINS="*"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                基础基座模型 (Base Model)
              </label>
              <input 
                type="text" 
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="例如: llama3.2, qwen2"
                className="w-full md:w-1/2 border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                用于蒸馏和对话的基础模型，需要在本地 Ollama 中已拉取该模型。
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                保存配置
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Trash2 className="text-red-600" size={24} />
            <h2 className="text-lg font-bold text-slate-900">数据管理</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <h3 className="font-bold text-red-900">清除所有本地数据</h3>
              <p className="text-red-700/80 text-sm mt-1">此操作将删除所有蒸馏的老板Skill、对话记录和设置，且不可恢复。</p>
            </div>
            <button 
              onClick={() => {
                if(window.confirm('确定要清除所有数据吗？此操作不可逆！')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              清除数据
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
