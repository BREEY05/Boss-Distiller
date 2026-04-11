import React from 'react';
import { useStore } from '../store';
import { Bot, Clock, Plus, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { skills, tasks, sessions } = useStore();
  const navigate = useNavigate();

  const activeTasks = tasks.filter((t) => t.status === 'running' || t.status === 'pending');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">早安，打工人</h1>
          <p className="text-slate-500 mt-1">这里是您的老板数字分身管理中心，掌控每一次职场沟通。</p>
        </div>
        <button 
          onClick={() => navigate('/distill')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          新建蒸馏任务
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">已生成老板Skill</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{skills.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">进行中的任务</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{activeTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">总演练次数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">我的老板Skill库</h2>
            {skills.length > 0 && (
              <button 
                onClick={() => navigate('/chat')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                去演练 <ArrowRight size={16} />
              </button>
            )}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {skills.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Bot size={32} />
                </div>
                <p className="text-slate-600 font-medium">暂无老板Skill</p>
                <p className="text-sm text-slate-400 mt-1">上传聊天记录，即可生成专属数字分身</p>
                <button 
                  onClick={() => navigate('/distill')}
                  className="mt-4 text-blue-600 font-medium text-sm hover:underline"
                >
                  立即去创建
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {skills.map((skill) => (
                  <li key={skill.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        {skill.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{skill.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{skill.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/chat')}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm font-medium transition-all"
                    >
                      演练
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">最近的任务进程</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-2">
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                最近没有进行过蒸馏任务
              </div>
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <li key={task.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-900 text-sm">蒸馏目标：{task.skillName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {task.status === 'completed' ? '已完成' : 
                         task.status === 'running' ? '进行中' : 
                         task.status === 'error' ? '失败' : '排队中'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
                      <div 
                        className={`h-1.5 rounded-full ${task.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>处理文件数: {task.files}</span>
                      <span>{task.progress}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
