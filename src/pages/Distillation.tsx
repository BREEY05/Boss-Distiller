import React, { useState } from 'react';
import { useStore } from '../store';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRESET_TEMPLATES = [
  { id: 't1', name: '职场PUA型', description: '喜欢谈理想、谈格局，经常反问“你觉得呢？”' },
  { id: 't2', name: '雷厉风行型', description: '只看结果，不听过程，回复简短直接。' },
  { id: 't3', name: '画大饼型', description: '承诺未来，画饼充饥，常用词“明年一定”。' },
  { id: 't4', name: '甩锅型', description: '遇事撇清关系，常说“这事你负责，你看着办”。' },
  { id: 't5', name: '温和指导型', description: '态度温和，循循善诱，会给出具体建议。' },
];

const Distillation: React.FC = () => {
  const { addTask, tasks, addSkill } = useStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      // 清空 input 的 value，确保同名文件可以再次选择
      e.target.value = '';
    }
  };

  const startDistillation = () => {
    if (!skillName) return alert('请输入老板Skill名称');
    if (!selectedTemplate) return alert('请选择一个预设风格模板');
    if (files.length === 0) return alert('请上传聊天记录或文件');

    const taskId = Date.now().toString();
    
    // Add task to store
    addTask({
      id: taskId,
      skillName,
      status: 'running',
      progress: 0,
      files: files.length,
      createdAt: Date.now(),
    });

    setStep(3);

    // Simulate distillation process
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        useStore.getState().updateTaskProgress(taskId, 100, 'completed');
        
        // Create the new skill
        const templateInfo = PRESET_TEMPLATES.find(t => t.id === selectedTemplate);
        addSkill({
          id: `skill_${Date.now()}`,
          name: skillName,
          modelName: `boss_${Date.now()}`,
          template: selectedTemplate,
          description: templateInfo ? `基于“${templateInfo.name}”风格蒸馏生成` : '自定义蒸馏',
          createdAt: Date.now(),
        });
      } else {
        useStore.getState().updateTaskProgress(taskId, progress, 'running');
      }
    }, 500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">新建蒸馏任务</h1>
        <p className="text-slate-500 mt-1">上传聊天记录，选择模板，一键生成老板数字分身。</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Progress Steps */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <div className={`flex-1 p-4 text-center font-medium text-sm ${step === 1 ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
            1. 基础配置与模板
          </div>
          <div className={`flex-1 p-4 text-center font-medium text-sm ${step === 2 ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
            2. 上传语料数据
          </div>
          <div className={`flex-1 p-4 text-center font-medium text-sm ${step === 3 ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
            3. 开始蒸馏
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">给这个老板Skill起个名字</label>
                <input 
                  type="text" 
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="例如：张总（日常版）、王总（发飙版）"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">选择预设老板模板 (基础人设)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <div 
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedTemplate === tpl.id 
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className={`font-bold ${selectedTemplate === tpl.id ? 'text-blue-700' : 'text-slate-900'}`}>
                          {tpl.name}
                        </h3>
                        {selectedTemplate === tpl.id && <CheckCircle2 size={18} className="text-blue-600" />}
                      </div>
                      <p className={`text-sm mt-1 ${selectedTemplate === tpl.id ? 'text-blue-600/80' : 'text-slate-500'}`}>
                        {tpl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => {
                    if(!skillName || !selectedTemplate) return alert('请完善信息');
                    setStep(2);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">点击或拖拽文件到此处</h3>
                <p className="text-slate-500 text-sm mb-6">支持聊天记录截图 (PNG/JPG)、导出的文本记录 (TXT/JSON/CSV)</p>
                
                <input 
                  type="file" 
                  id="file-upload" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="file-upload"
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium cursor-pointer inline-block shadow-sm"
                >
                  选择文件
                </label>
              </div>

              {files.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">已选文件 ({files.length})</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200 text-sm">
                        <FileText size={16} className="text-blue-500" />
                        <span className="truncate flex-1 text-slate-700">{f.name}</span>
                        <span className="text-slate-400 text-xs">{(f.size / 1024).toFixed(1)} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  上一步
                </button>
                <button 
                  onClick={startDistillation}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  开始蒸馏
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              {tasks[0]?.status === 'completed' ? (
                <>
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">蒸馏完成！</h2>
                  <p className="text-slate-500 mb-8">老板数字分身 "{skillName}" 已生成并保存至本地库中。</p>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => navigate('/')}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      返回工作台
                    </button>
                    <button 
                      onClick={() => navigate('/chat')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      立即去演练
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <svg className="animate-spin w-full h-full text-blue-200" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75 text-blue-600" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-700">
                      {tasks[0]?.progress || 0}%
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">正在提取特征与蒸馏模型...</h2>
                  <p className="text-slate-500 mb-2">这可能需要几分钟的时间，您可以离开此页面，后台将继续执行任务。</p>
                  
                  <div className="max-w-md mx-auto mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-left">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold mb-1">正在本地运行大模型分析</p>
                      <p>请确保您的计算机资源充足，提取过程中请勿关闭浏览器核心进程。</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Distillation;
