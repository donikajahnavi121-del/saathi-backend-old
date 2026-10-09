import React from 'react';
import { LayoutDashboard, Users, PhoneCall, FileText, HeartPulse, LogOut } from 'lucide-react';
import { CounsellorScreen } from '../../types';

interface Props {
  activeScreen: CounsellorScreen;
  onNavigate: (screen: CounsellorScreen) => void;
  onLogout: () => void;
  counsellorName?: string;
  district?: string;
}

export const CounsellorSidebar: React.FC<Props> = ({
  activeScreen,
  onNavigate,
  onLogout,
  counsellorName = 'Sunita Rao',
  district = 'South District PHC Unit',
}) => {
  const navItems: Array<{ id: CounsellorScreen; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'priority_queue', label: 'Patients', icon: Users },
    { id: 'follow_ups', label: 'Follow-ups', icon: PhoneCall },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#D0E3E1] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Portal Brand */}
        <div className="p-6 border-b border-[#E8F2F1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5F5C] flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#0F5F5C] tracking-tight">Saathi</div>
              <div className="text-xs font-semibold text-[#4B6361]">Counsellor Portal</div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-4 space-y-1.5" aria-label="Counsellor Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeScreen === item.id ||
              (item.id === 'priority_queue' && activeScreen === 'patient_profile');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors text-left ${
                  isActive
                    ? 'bg-[#E9F5EF] text-[#0F5F5C] shadow-xs'
                    : 'text-[#4B6361] hover:bg-[#F4F9F8] hover:text-[#1B2B2A]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F5F5C] stroke-[2.5]' : 'text-[#4B6361]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Counsellor Profile Footer & Logout */}
      <div className="p-4 m-4 bg-[#F4F9F8] rounded-2xl border border-[#D0E3E1]">
        <div className="text-sm font-bold text-[#1B2B2A]">{counsellorName}</div>
        <div className="text-xs text-[#4B6361]">Adherence Counsellor</div>
        <div className="text-[11px] text-[#0F5F5C] font-semibold mt-0.5 truncate">{district}</div>

        <button
          onClick={onLogout}
          className="mt-3 w-full py-2 px-3 bg-white hover:bg-[#FFE5D9] text-[#A62F18] border border-[#D0E3E1] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Lock & Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
