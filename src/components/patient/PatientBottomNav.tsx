import React from 'react';
import { Home, Calendar, HelpCircle } from 'lucide-react';
import { PatientScreen } from '../../types';
import { Translations } from '../../data/translations';

interface Props {
  activeScreen: PatientScreen;
  onNavigate: (screen: PatientScreen) => void;
  t: Translations;
}

export const PatientBottomNav: React.FC<Props> = ({ activeScreen, onNavigate, t }) => {
  const isHomeActive = activeScreen === 'home' || activeScreen === 'home_missed';
  const isHistoryActive = activeScreen === 'history';
  const isHelpActive = activeScreen === 'help_language';

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="w-full bg-white border-t border-[#D0E3E1] px-4 py-2 flex items-center justify-around select-none z-10 shrink-0"
    >
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-colors ${
          isHomeActive ? 'text-[#0F5F5C] font-bold' : 'text-[#4B6361] hover:text-[#1B2B2A]'
        }`}
      >
        <Home className={`w-6 h-6 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-xs mt-1 font-medium">{t.navHome}</span>
      </button>

      <button
        onClick={() => onNavigate('history')}
        className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-colors ${
          isHistoryActive ? 'text-[#0F5F5C] font-bold' : 'text-[#4B6361] hover:text-[#1B2B2A]'
        }`}
      >
        <Calendar className={`w-6 h-6 ${isHistoryActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-xs mt-1 font-medium">{t.navHistory}</span>
      </button>

      <button
        onClick={() => onNavigate('help_language')}
        className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-colors ${
          isHelpActive ? 'text-[#0F5F5C] font-bold' : 'text-[#4B6361] hover:text-[#1B2B2A]'
        }`}
      >
        <HelpCircle className={`w-6 h-6 ${isHelpActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-xs mt-1 font-medium">{t.navHelp}</span>
      </button>
    </nav>
  );
};
