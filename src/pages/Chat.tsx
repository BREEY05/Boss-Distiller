import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Send, Bot, User, BrainCircuit, Lightbulb, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Chat: React.FC = () => {
  const { 
    skills, 
    sessions, 
    activeSessionId, 
    setActiveSession, 
    createSession, 
    addMessage,
    updateLastMessageAnalysis,
    ollamaUrl,
    baseModel
  } = useStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || '');

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  useEffect(() => {
    if (skills.length > 0 && !selectedSkillId) {
      setSelectedSkillId(skills[0].id);
    }
  }, [skills]);

  const handleStartSession = () => {
    if (!selectedSkillId) return;
    createSession(selectedSkillId);
  };

  const generateAnalysis = async (userMsg: string, aiMsg: string, sessionId: string) => {
    // Generate Intent and Suggestion using baseModel
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000); // 增加超时到 60 秒
    try {
      const prompt = `请分析以下员工和老板的对话：
员工说：${userMsg}
老板说：${aiMsg}

请提供：
1. 老板真实意图（简短分析）
2. 员工的高情商回复建议（提供一句可以直接说的话）

请务必只输出合法的 JSON 格式，不要包含任何多余的文本或 markdown 标记。
返回格式必须严格如下：
{"intent": "老板的真实意图分析", "suggestion": "建议回复的话术"}`;

      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: baseModel,
          prompt,
          stream: false,
          // 取消 format: 'json'，因为很多国内模型 (比如 qwen) 强行开启 json mode 会导致死循环或者卡住
          options: {
            temperature: 0.1 // 降低温度以保证 JSON 格式更稳定
          }
        }),
      });

      if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`);

      const data = await res.json();
      const raw = typeof data?.response === 'string' ? data.response : JSON.stringify(data?.response ?? {});

      let intent = '';
      let suggestion = '';

      try {
        // 去掉可能的 markdown json 块包裹
        const cleanedRaw = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const analysis = JSON.parse(cleanedRaw);
        intent = typeof analysis?.intent === 'string' ? analysis.intent : '';
        suggestion = typeof analysis?.suggestion === 'string' ? analysis.suggestion : '';
      } catch (parseError) {
        console.warn('Failed to parse strict JSON, trying fallback regex extraction:', raw);
        // 容错提取
        const intentMatch = raw.match(/\"intent\"\s*:\s*\"([\s\S]*?)\"/);
        const suggestionMatch = raw.match(/\"suggestion\"\s*:\s*\"([\s\S]*?)\"/);
        intent = intentMatch?.[1] ? intentMatch[1].replace(/\\n/g, '\n') : '';
        suggestion = suggestionMatch?.[1] ? suggestionMatch[1].replace(/\\n/g, '\n') : '';
        
        if (!intent && !suggestion) {
           // 如果正则也提取不到，直接把原文放进去展示（防止转圈）
           intent = raw;
           suggestion = "无法从模型输出中提取建议。";
        }
      }

      updateLastMessageAnalysis(
        sessionId,
        intent || '分析失败：模型未返回可解析的意图结果',
        suggestion || '建议生成失败：请检查 Ollama 服务、模型名称与跨域配置'
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '未知错误';
      updateLastMessageAnalysis(
        sessionId,
        `分析失败：${errMsg}`,
        '建议生成失败：请检查 Ollama 是否启动、设置页 API 地址是否正确，以及是否使用 OLLAMA_ORIGINS="*" 启动'
      );
    }
    window.clearTimeout(timeoutId);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSessionId || !activeSession) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage(activeSessionId, {
      role: 'user',
      content: userMessage
    });

    setIsTyping(true);

    try {
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: baseModel, // Using base model since custom modelfile isn't actually pushed in this UI-only demo
          messages: [
            { 
              role: 'system', 
              content: `你是一个扮演老板的AI。你需要模拟老板的语气和思维方式回答员工。请保持老板的口吻。`
            },
            ...activeSession.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiContent = data.message.content;
        
        addMessage(activeSessionId, {
          role: 'assistant',
          content: aiContent
        });

        // Run analysis asynchronously
        generateAnalysis(userMessage, aiContent, activeSessionId);
      } else {
        addMessage(activeSessionId, {
          role: 'system',
          content: '连接Ollama服务失败，请检查设置。'
        });
      }
    } catch (e) {
      addMessage(activeSessionId, {
        role: 'system',
        content: '网络错误，无法连接到本地大模型。'
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (skills.length === 0) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">还没有可用的老板Skill</h2>
        <p className="text-slate-500 mb-6">您需要先去创建一个蒸馏任务，生成老板分身后才能进行演练。</p>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">发起模拟演练</h2>
          
          <label className="block text-sm font-medium text-slate-700 mb-2">选择要推演的老板Skill</label>
          <select 
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-8 bg-white"
          >
            {skills.map(s => (
              <option key={s.id} value={s.id}>{s.name} - {s.template}</option>
            ))}
          </select>

          <button 
            onClick={handleStartSession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors"
          >
            进入沙盘演练
          </button>
        </div>
      </div>
    );
  }

  const currentSkill = skills.find(s => s.id === activeSession.skillId);
  const lastAssistantMessage = [...activeSession.messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50 relative">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {currentSkill?.name.charAt(0) || 'B'}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">{currentSkill?.name}</h2>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                模型已就绪
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveSession(null)}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium px-3 py-1.5 rounded-md hover:bg-slate-100"
          >
            结束演练
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession.messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <Bot size={40} className="mx-auto mb-3 opacity-50" />
              <p>开始与 {currentSkill?.name} 进行推演吧</p>
              <p className="text-sm mt-1">例如：“老板，我这周想请假两天”</p>
            </div>
          )}

          {activeSession.messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 
                msg.role === 'system' ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : 
                 msg.role === 'system' ? <AlertTriangle size={16} /> : 
                 currentSkill?.name.charAt(0)}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 
                msg.role === 'system' ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' :
                'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                {currentSkill?.name.charAt(0)}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto relative flex items-end">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入你的话术，按 Enter 发送..."
              className="w-full border border-slate-300 rounded-xl pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-14 min-h-[56px] max-h-32 bg-slate-50"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="w-80 bg-white flex flex-col shrink-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-6 shrink-0 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit size={18} className="text-blue-600" />
            AI 实时分析
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {!lastAssistantMessage ? (
            <div className="text-center text-slate-400 mt-10">
              <BrainCircuit size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">对话开始后，AI将实时分析老板的真实意图，并给出高情商回复建议。</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 shadow-sm">
                <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
                  <Bot size={16} /> 真实意图剖析
                </h4>
                {lastAssistantMessage.intent ? (
                  <p className="text-amber-900 text-sm leading-relaxed">{lastAssistantMessage.intent}</p>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700/50 text-sm">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在深度分析中...
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
                <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-3">
                  <Lightbulb size={16} /> 高情商回复建议
                </h4>
                {lastAssistantMessage.suggestion ? (
                  <div>
                    <p className="text-emerald-900 text-sm leading-relaxed mb-4">{lastAssistantMessage.suggestion}</p>
                    <button 
                      onClick={() => setInput(lastAssistantMessage.suggestion || '')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      使用此建议
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700/50 text-sm">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在生成话术...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
