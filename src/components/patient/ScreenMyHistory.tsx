import React, { useState } from 'react';
import { Check, Minus, X, CalendarCheck, Clock, FileCheck } from 'lucide-react';
import { Translations } from '../../data/translations';
import { RAMESH_OCTOBER_2026_DAYS } from '../../data/mockPatients';

interface Props {
  t: Translations;
  onNavigateHome: () => void;
}

interface SelectedDayInfo {
  day: number;
  status: 'checked_in' | 'missed' | 'upcoming';
  time?: string;
  note?: string;
}

export const ScreenMyHistory: React.FC<Props> = ({ t }) => {
  const [selectedDay, setSelectedDay] = useState<SelectedDayInfo | null>(null);

  // October 2026 starts on Thursday (index 4 in 0=Sun..6=Sat)
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const startDayOffset = 4; // Oct 1, 2026 is Thursday

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#E8F2F1] overflow-y-auto relative">
      <div>
        {/* Month Title & Summary Line */}
        <div className="flex flex-col mb-4">
          <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
            {t.octoberMonth}
          </h1>
          <p className="text-base font-semibold text-[#0F5F5C] mt-1">
            {t.daysCheckedInSummary}
          </p>
        </div>

        {/* Calendar Grid Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#D0E3E1] shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day, idx) => (
              <span key={idx} className="text-xs font-bold text-[#4B6361] py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Empty slots for starting offset */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {RAMESH_OCTOBER_2026_DAYS.map((item) => {
              const isChecked = item.status === 'checked_in';
              const isMissed = item.status === 'missed';
              const isUpcoming = item.status === 'upcoming';

              return (
                <button
                  key={item.day}
                  onClick={() =>
                    setSelectedDay({
                      day: item.day,
                      status: item.status,
                      time: 'time' in item ? item.time : undefined,
                      note: 'note' in item ? item.note : undefined,
                    })
                  }
                  className="aspect-square rounded-xl p-1 flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors border border-transparent focus:border-[#0F5F5C]"
                  aria-label={`October ${item.day}`}
                >
                  <span className="text-[11px] font-semibold text-[#1B2B2A] leading-none mb-1">
                    {item.day}
                  </span>

                  {/* Status Indicator Icon */}
                  {isChecked && (
                    <div className="w-5 h-5 rounded-full bg-[#2E7D5B] flex items-center justify-center text-white shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {isMissed && (
                    <div className="w-5 h-5 rounded-full bg-[#8A9C9A] flex items-center justify-center text-white">
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="w-5 h-5 rounded-full border-2 border-[#B0C8C6]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend with text labels */}
        <div className="mt-4 bg-white rounded-2xl p-4 border border-[#D0E3E1] flex items-center justify-around shadow-sm text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#2E7D5B] flex items-center justify-center text-white">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="font-medium text-[#1B2B2A]">{t.legendCheckedIn}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#8A9C9A] flex items-center justify-center text-white">
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="font-medium text-[#1B2B2A]">{t.legendNotRecorded}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[#B0C8C6]" />
            <span className="font-medium text-[#1B2B2A]">{t.legendUpcoming}</span>
          </div>
        </div>
      </div>

      {/* Gentle Bottom Reassurance */}
      <div className="text-center text-xs text-[#4B6361] pt-3 pb-1">
        Tap any day to view details
      </div>

      {/* Tapping a day shows a small bottom sheet */}
      {selectedDay && (
        <div className="absolute inset-0 bg-black/40 z-30 flex items-end animate-fadeIn">
          <div className="w-full bg-white rounded-t-3xl p-6 border-t border-[#D0E3E1] shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F2F1]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#0F5F5C]" />
                <h3 className="text-xl font-bold text-[#1B2B2A]">
                  October {selectedDay.day}, 2026
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 rounded-full bg-[#E8F2F1] flex items-center justify-center text-[#1B2B2A]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              {selectedDay.status === 'checked_in' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2E7D5B] flex items-center justify-center text-white">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B2B2A] text-base">Medicine Check-in Recorded</p>
                      <p className="text-sm text-[#4B6361] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedDay.time || '08:24 AM'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#E9F5EF] rounded-xl text-sm font-medium text-[#2E7D5B] flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Verified by daily medicine photo
                  </div>
                </div>
              )}

              {selectedDay.status === 'missed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#8A9C9A] flex items-center justify-center text-white">
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B2B2A] text-base">Not Recorded</p>
                      <p className="text-sm text-[#4B6361]">No check-in received on this day</p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#FFF1D6] rounded-xl text-sm font-medium text-[#8A5D00]">
                    Your counsellor is always here to support your routine.
                  </div>
                </div>
              )}

              {selectedDay.status === 'upcoming' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#B0C8C6] flex items-center justify-center" />
                  <div>
                    <p className="font-bold text-[#1B2B2A] text-base">Upcoming Day</p>
                    <p className="text-sm text-[#4B6361]">Reminder will arrive at your scheduled time</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="w-full h-12 bg-[#0F5F5C] text-white rounded-xl font-bold text-base mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
