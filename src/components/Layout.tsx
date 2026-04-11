import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, MessageSquareText, FileUser } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC = () => {
  const navItems = [
    { name: '工作台', path: '/', icon: LayoutDashboard },
    { name: '蒸馏任务', path: '/distill', icon: FileUser },
    { name: '模拟演练', path: '/chat', icon: MessageSquareText },
    { name: '设置', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            B
          </div>
          <h1 className="text-white font-semibold text-lg tracking-wide">老板分身系统</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200',
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 font-medium' 
                      : 'hover:bg-slate-800 hover:text-slate-100'
                  )
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-800">
          本地私有化部署 · 隐私安全
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-sm rounded-l-2xl border-l border-slate-200 z-10 relative">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
