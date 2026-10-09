import React from 'react';
import { Smartphone, Monitor, Columns, Sparkles, Lock, ShieldCheck } from 'lucide-react';
import { PatientScreen, CounsellorScreen } from '../types';

export type AppViewMode = 'patient' | 'counsellor' | 'split';

interface Props {
  viewMode: AppViewMode;
  onSetViewMode: (mode: AppViewMode) => void;
  patientScreen: PatientScreen;
  onSetPatientScreen: (screen: PatientScreen) => void;
  counsellorScreen: CounsellorScreen;
  onSetCounsellorScreen: (screen: CounsellorScreen) => void;
  onJumpToScreen: (screenNumber: number) => void;
  activeScreenNumber: number;
  isCounsellorAuthenticated: boolean;
  onCounsellorLogout: () => void;
}

export const NavigationController: React.FC<Props> = ({
  viewMode,
  onSetViewMode,
  onJumpToScreen,
  activeScreenNumber,
  isCounsellorAuthenticated,
  onCounsellorLogout,
}) => {
  const screens = [
    { num: 1, label: 'Style System' },
    { num: 2, label: 'Patient Home (Zero Login)' },
    { num: 3, label: 'Patient Success' },
    { num: 4, label: 'Patient Home Missed' },
    { num: 5, label: 'Photo Viewfinder' },
    { num: 6, label: 'Review Photo' },
    { num: 7, label: 'Patient Magic Link' },
    { num: 8, label: 'My History' },
    { num: 9, label: 'Side Effects' },
    { num: 10, label: 'Help & Language' },
    { num: 11, label: 'Counsellor Dashboard (Protected)' },
    { num: 12, label: 'Priority Queue' },
    { num: 13, label: 'Patient Profile' },
    { num: 14, label: 'Why Flagged (Explainability)' },
    { num: 15, label: 'Log Follow-up Drawer' },
  ];

  return (
    <div className="bg-[#1B2B2A] text-white px-4 py-2.5 border-b border-[#0F5F5C] select-none sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Role Protection Notice */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F5F5C] flex items-center justify-center font-bold text-white text-base">
            S
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">Saathi</span>
            <span className="text-[11px] text-[#A3C5C2] ml-2 font-medium hidden sm:inline">
              Role-Separated Adherence Architecture
            </span>
          </div>
        </div>

        {/* View Mode & Access Control Switcher */}
        <div className="flex items-center bg-[#243332] p-1 rounded-xl border border-[#3E5250]">
          {/* Patient App: Zero Login Needed */}
          <button
            onClick={() => onSetViewMode('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'patient'
                ? 'bg-[#0F5F5C] text-white shadow-xs'
                : 'text-[#A3C5C2] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Patient App (No Login)</span>
          </button>

          {/* Counsellor Portal: Protected with Login */}
          <button
            onClick={() => onSetViewMode('counsellor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'counsellor'
                ? 'bg-[#0F5F5C] text-white shadow-xs'
                : 'text-[#A3C5C2] hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Counsellor Portal</span>
            {!isCounsellorAuthenticated && (
              <Lock className="w-3 h-3 text-[#FFE0A3]" />
            )}
            {isCounsellorAuthenticated && (
              <ShieldCheck className="w-3 h-3 text-[#2E7D5B]" />
            )}
          </button>

          {/* Split Mode */}
          <button
            onClick={() => onSetViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hidden md:flex ${
              viewMode === 'split'
                ? 'bg-[#0F5F5C] text-white shadow-xs'
                : 'text-[#A3C5C2] hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* 15 Screen Quick Jumper Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFE0A3]" />
            <select
              value={activeScreenNumber}
              onChange={(e) => onJumpToScreen(Number(e.target.value))}
              className="bg-[#243332] text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-[#3E5250] outline-none cursor-pointer focus:border-[#0F5F5C]"
            >
              {screens.map((s) => (
                <option key={s.num} value={s.num}>
                  {s.num}. {s.label}
                </option>
              ))}
            </select>
          </div>

          {isCounsellorAuthenticated && (
            <button
              onClick={onCounsellorLogout}
              className="text-[11px] font-semibold text-[#FFE0A3] hover:underline hidden lg:inline"
            >
              Lock Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
