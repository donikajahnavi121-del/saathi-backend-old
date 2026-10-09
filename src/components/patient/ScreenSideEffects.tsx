import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onSubmit: (selectedEffects: string[], notes: string) => void;
  onSkip: () => void;
  t: Translations;
}

export const ScreenSideEffects: React.FC<Props> = ({ onSubmit, onSkip, t }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');

  const options = [
    { id: 'sick', label: t.problemOptionSick },
    { id: 'rash', label: t.problemOptionRash },
    { id: 'tired', label: t.problemOptionTired },
    { id: 'stomach', label: t.problemOptionStomach },
    { id: 'other', label: t.problemOptionOther },
  ];

  const toggleOption = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    onSubmit(selectedItems, noteText);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#E8F2F1] overflow-y-auto">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
          {t.anyProblemTitle}
        </h1>
        <p className="text-sm text-[#4B6361] mt-1 font-medium">
          Optional • Helps us adjust your support
        </p>

        {/* Large tappable rows with checkboxes */}
        <div className="mt-4 space-y-2.5">
          {options.map((opt) => {
            const isChecked = selectedItems.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.id)}
                className={`w-full min-h-[56px] px-4 py-3 rounded-2xl flex items-center justify-between border-2 transition-all duration-150 text-left ${
                  isChecked
                    ? 'bg-[#E9F5EF] border-[#2E7D5B] text-[#1B2B2A]'
                    : 'bg-white border-[#D0E3E1] text-[#1B2B2A] hover:border-[#A3C5C2]'
                }`}
              >
                <span className="text-lg font-semibold">{opt.label}</span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors shrink-0 ${
                    isChecked
                      ? 'bg-[#2E7D5B] border-[#2E7D5B] text-white'
                      : 'border-[#A3C5C2] bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional text box */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-[#1B2B2A] mb-1.5">
            {t.tellUsMoreLabel}
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="E.g., Felt dizzy about an hour after morning dose..."
            rows={2}
            className="w-full bg-white rounded-2xl border-2 border-[#D0E3E1] p-3 text-base text-[#1B2B2A] outline-none focus:border-[#0F5F5C] transition-colors placeholder:text-[#8A9C9A]"
          />
        </div>
      </div>

      {/* Bottom Actions & Reassurance line */}
      <div className="pt-4 flex flex-col items-center gap-3">
        {/* Primary button: "Send to my counsellor" (56px tall) */}
        <button
          onClick={handleSend}
          className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-2xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm"
        >
          {t.sendToCounsellor}
        </button>

        {/* Text link: "Skip" */}
        <button
          onClick={onSkip}
          className="text-lg font-medium text-[#4B6361] hover:text-[#1B2B2A] py-1"
        >
          {t.skip}
        </button>

        {/* Reassurance line: "Your counsellor will be told." */}
        <div className="flex items-center gap-1.5 text-xs text-[#0F5F5C] font-semibold pb-1">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t.counsellorWillBeTold}</span>
        </div>
      </div>
    </div>
  );
};
