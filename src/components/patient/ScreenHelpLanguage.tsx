import React from 'react';
import { Phone, Check } from 'lucide-react';
import { SupportedLanguage, TextSize } from '../../types';
import { Translations } from '../../data/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  textSize: TextSize;
  onChangeTextSize: (size: TextSize) => void;
  onCallCounsellor: () => void;
  t: Translations;
}

export const ScreenHelpLanguage: React.FC<Props> = ({
  currentLanguage,
  onSelectLanguage,
  textSize,
  onChangeTextSize,
  onCallCounsellor,
  t,
}) => {
  const languageOptions: Array<{ code: SupportedLanguage; nativeName: string; label: string }> = [
    { code: 'en', nativeName: 'English', label: 'English' },
    { code: 'hi', nativeName: 'हिन्दी', label: 'Hindi' },
    { code: 'ta', nativeName: 'தமிழ்', label: 'Tamil' },
    { code: 'te', nativeName: 'తెలుగు', label: 'Telugu' },
    { code: 'bn', nativeName: 'বাংলা', label: 'Bengali' },
    { code: 'mr', nativeName: 'मराठी', label: 'Marathi' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#E8F2F1] overflow-y-auto">
      <div>
        {/* Language Section Heading */}
        <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
          {t.chooseLanguage}
        </h1>
        <p className="text-sm text-[#4B6361] mt-1 font-medium">
          Select your preferred language
        </p>

        {/* Large buttons in native script (NO flags!) */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {languageOptions.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`h-16 px-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                  isSelected
                    ? 'bg-[#E9F5EF] border-[#0F5F5C] text-[#0F5F5C] font-bold shadow-xs'
                    : 'bg-white border-[#D0E3E1] text-[#1B2B2A] font-semibold hover:border-[#A3C5C2]'
                }`}
                aria-label={lang.label}
              >
                <div className="flex flex-col">
                  <span className="text-lg leading-tight">{lang.nativeName}</span>
                  <span className="text-xs text-[#4B6361] font-normal">{lang.label}</span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#0F5F5C] flex items-center justify-center text-white shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Text Size Control: A A A (Small, Medium, Large) */}
        <div className="mt-6 bg-white rounded-2xl p-4 border border-[#D0E3E1] shadow-sm">
          <label className="block text-sm font-bold text-[#1B2B2A] mb-2">
            {t.textSize}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onChangeTextSize('small')}
              className={`h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-colors ${
                textSize === 'small'
                  ? 'bg-[#0F5F5C] text-white border-[#0F5F5C]'
                  : 'bg-[#E8F2F1] text-[#1B2B2A] border-[#D0E3E1] hover:border-[#A3C5C2]'
              }`}
            >
              <span className="text-sm">A</span>
              <span className="text-[11px] ml-1.5 opacity-80">(Small)</span>
            </button>

            <button
              onClick={() => onChangeTextSize('medium')}
              className={`h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-colors ${
                textSize === 'medium'
                  ? 'bg-[#0F5F5C] text-white border-[#0F5F5C]'
                  : 'bg-[#E8F2F1] text-[#1B2B2A] border-[#D0E3E1] hover:border-[#A3C5C2]'
              }`}
            >
              <span className="text-base">A</span>
              <span className="text-[11px] ml-1.5 opacity-80">(Medium)</span>
            </button>

            <button
              onClick={() => onChangeTextSize('large')}
              className={`h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-colors ${
                textSize === 'large'
                  ? 'bg-[#0F5F5C] text-white border-[#0F5F5C]'
                  : 'bg-[#E8F2F1] text-[#1B2B2A] border-[#D0E3E1] hover:border-[#A3C5C2]'
              }`}
            >
              <span className="text-xl">A</span>
              <span className="text-[11px] ml-1.5 opacity-80">(Large)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Teal Button: "Call my counsellor" (56px tall) */}
      <div className="pt-6 pb-2">
        <button
          onClick={onCallCounsellor}
          className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm gap-3 active:scale-[0.99]"
        >
          <Phone className="w-6 h-6 stroke-[2.2]" />
          <span>{t.callMyCounsellor}</span>
        </button>
        <p className="text-center text-xs text-[#4B6361] mt-2 font-medium">
          Toll-free counsellor direct line • Available 8 AM – 8 PM
        </p>
      </div>
    </div>
  );
};
