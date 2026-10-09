import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { PatientScreen, SupportedLanguage, TextSize } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { PatientBottomNav } from './PatientBottomNav';
import { ScreenHomeNormal } from './ScreenHomeNormal';
import { ScreenHomeMissed } from './ScreenHomeMissed';
import { ScreenCheckInSuccess } from './ScreenCheckInSuccess';
import { ScreenPhotoCheckIn } from './ScreenPhotoCheckIn';
import { ScreenReviewPhoto } from './ScreenReviewPhoto';
import { ScreenSignIn } from './ScreenSignIn';
import { ScreenMyHistory } from './ScreenMyHistory';
import { ScreenSideEffects } from './ScreenSideEffects';
import { ScreenHelpLanguage } from './ScreenHelpLanguage';

interface Props {
  activeScreen: PatientScreen;
  onNavigate: (screen: PatientScreen) => void;
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  textSize: TextSize;
  onChangeTextSize: (size: TextSize) => void;
  isCheckedInToday: boolean;
  setIsCheckedInToday: (val: boolean) => void;
}

export const PatientPhoneFrame: React.FC<Props> = ({
  activeScreen,
  onNavigate,
  language,
  onSelectLanguage,
  textSize,
  onChangeTextSize,
  isCheckedInToday,
  setIsCheckedInToday,
}) => {
  const t = TRANSLATIONS[language];

  // Font size multiplier based on user's text size selection
  const textSizeClass =
    textSize === 'small'
      ? 'text-sm'
      : textSize === 'large'
      ? 'text-xl'
      : 'text-base';

  const showBottomNav =
    activeScreen === 'home' ||
    activeScreen === 'home_missed' ||
    activeScreen === 'history' ||
    activeScreen === 'help_language';

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6">
      {/* Android Phone Frame (360x800 internal viewport) */}
      <div
        className={`w-[360px] h-[800px] bg-[#E8F2F1] rounded-[36px] border-[10px] border-[#1B2B2A] shadow-2xl overflow-hidden flex flex-col relative select-none ${textSizeClass}`}
        style={{
          boxShadow: '0 25px 60px -15px rgba(15, 95, 92, 0.3), 0 0 0 1px rgba(0,0,0,0.1)',
        }}
      >
        {/* Status Bar */}
        <div className="w-full bg-[#E8F2F1] px-5 pt-3 pb-1 flex items-center justify-between text-[#1B2B2A] text-xs font-semibold z-20 shrink-0">
          <span>09:41</span>
          {/* Subtle camera punch hole */}
          <div className="w-3 h-3 rounded-full bg-[#1B2B2A]/80 -mt-1" />
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Minimal App Bar Header (Only when not in full sign-in or camera mode) */}
        {activeScreen !== 'sign_in' && activeScreen !== 'checkin_camera' && (
          <header className="w-full bg-[#E8F2F1] px-6 py-2 flex items-center justify-between z-10 shrink-0 border-b border-[#D0E3E1]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F5F5C]" />
              <span className="font-bold text-xl text-[#0F5F5C] tracking-tight">
                {t.appName}
              </span>
            </div>
            <button
              onClick={() => onNavigate('help_language')}
              className="text-xs font-bold text-[#0F5F5C] bg-white px-2.5 py-1 rounded-full border border-[#D0E3E1]"
            >
              {language.toUpperCase()}
            </button>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeScreen === 'sign_in' && (
            <ScreenSignIn
              onSignInSuccess={() => onNavigate('home')}
              onNeedHelp={() => onNavigate('help_language')}
              t={t}
            />
          )}

          {activeScreen === 'home' && (
            <ScreenHomeNormal
              onStartCheckIn={() => onNavigate('checkin_camera')}
              t={t}
              isCheckedInToday={isCheckedInToday}
            />
          )}

          {activeScreen === 'home_missed' && (
            <ScreenHomeMissed
              onCheckInNow={() => onNavigate('checkin_camera')}
              onNeedHelp={() => onNavigate('help_language')}
              t={t}
            />
          )}

          {activeScreen === 'checkin_camera' && (
            <ScreenPhotoCheckIn
              onCapture={() => onNavigate('checkin_review')}
              onCannotTakePhoto={() => {
                setIsCheckedInToday(true);
                onNavigate('checkin_success');
              }}
              onBack={() => onNavigate('home')}
              t={t}
            />
          )}

          {activeScreen === 'checkin_review' && (
            <ScreenReviewPhoto
              onConfirmPhoto={() => {
                setIsCheckedInToday(true);
                onNavigate('checkin_success');
              }}
              onRetake={() => onNavigate('checkin_camera')}
              t={t}
            />
          )}

          {activeScreen === 'checkin_success' && (
            <ScreenCheckInSuccess
              onViewHistory={() => onNavigate('history')}
              onBackToHome={() => onNavigate('home')}
              onReportProblems={() => onNavigate('side_effects')}
              t={t}
            />
          )}

          {activeScreen === 'side_effects' && (
            <ScreenSideEffects
              onSubmit={(_, __) => {
                onNavigate('home');
              }}
              onSkip={() => onNavigate('home')}
              t={t}
            />
          )}

          {activeScreen === 'history' && (
            <ScreenMyHistory t={t} onNavigateHome={() => onNavigate('home')} />
          )}

          {activeScreen === 'help_language' && (
            <ScreenHelpLanguage
              currentLanguage={language}
              onSelectLanguage={onSelectLanguage}
              textSize={textSize}
              onChangeTextSize={onChangeTextSize}
              onCallCounsellor={() => {
                alert('Connecting to Counsellor Direct Line: 1800-11-6666 (Free)');
              }}
              t={t}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <PatientBottomNav activeScreen={activeScreen} onNavigate={onNavigate} t={t} />
        )}
      </div>
    </div>
  );
};
