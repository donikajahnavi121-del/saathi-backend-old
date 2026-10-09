import React, { useState } from 'react';
import { X, Calendar, PhoneCall, Check } from 'lucide-react';
import { Patient, FollowUpLog } from '../../types';

interface Props {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: FollowUpLog) => void;
}

export const DrawerLogFollowUp: React.FC<Props> = ({
  patient,
  isOpen,
  onClose,
  onSave,
}) => {
  const [reason, setReason] = useState('Missed check-in follow-up');
  const [outcome, setOutcome] = useState<'Reached' | 'No answer' | 'Refused'>('Reached');
  const [notes, setNotes] = useState('');
  const [nextDate, setNextDate] = useState('2026-10-12');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: FollowUpLog = {
      id: `fl-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      reason,
      outcome,
      notes: notes || 'Follow-up call completed with patient.',
      nextFollowUpDate: nextDate,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onSave(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      {/* Right Side Slide-Over Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#D0E3E1] animate-slideLeft">
        {/* Panel Header */}
        <div className="p-6 border-b border-[#E8F2F1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5F5C] flex items-center justify-center text-white">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B2B2A] tracking-tight">
                Log Follow-up
              </h2>
              <p className="text-xs text-[#4B6361]">
                {patient.id} • {patient.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E8F2F1] flex items-center justify-center text-[#1B2B2A] hover:bg-[#D0E3E1] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="followup-form" onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Step 1: "Reason for call" dropdown */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-2">
              Reason for call
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-12 px-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-base text-[#1B2B2A] font-medium outline-none focus:border-[#0F5F5C] focus:ring-2 focus:ring-[#0F5F5C]/20 transition-all cursor-pointer"
            >
              <option value="Missed check-in follow-up">Missed check-in follow-up</option>
              <option value="Reported side effects verification">Reported side effects verification</option>
              <option value="Upcoming refill coordination">Upcoming refill coordination</option>
              <option value="Routine adherence encouragement">Routine adherence encouragement</option>
              <option value="Re-engagement after dropout alert">Re-engagement after dropout alert</option>
            </select>
          </div>

          {/* Step 2: Outcome chips: Reached, No answer, Refused */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-2">
              Call outcome
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Reached', 'No answer', 'Refused'] as const).map((opt) => {
                const isSelected = outcome === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOutcome(opt)}
                    className={`h-11 px-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0F5F5C] text-white border-[#0F5F5C]'
                        : 'bg-[#F4F9F8] text-[#1B2B2A] border-[#D0E3E1] hover:border-[#A3C5C2]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Notes textarea */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-2">
              Counsellor notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record patient response, symptoms addressed, or family member spoke with..."
              rows={4}
              className="w-full p-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-base text-[#1B2B2A] outline-none focus:border-[#0F5F5C] focus:ring-2 focus:ring-[#0F5F5C]/20 transition-all resize-none"
            />
          </div>

          {/* Step 4: "Next follow-up date" picker */}
          <div>
            <label className="block text-sm font-bold text-[#1B2B2A] mb-2">
              Next follow-up date
            </label>
            <div className="relative">
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full h-12 px-4 bg-white border-2 border-[#D0E3E1] rounded-xl text-base text-[#1B2B2A] font-medium outline-none focus:border-[#0F5F5C] focus:ring-2 focus:ring-[#0F5F5C]/20 transition-all"
              />
              <Calendar className="w-5 h-5 text-[#4B6361] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </form>

        {/* Panel Footer: Primary Button "Save follow-up" */}
        <div className="p-6 border-t border-[#E8F2F1] bg-[#F4F9F8]">
          <button
            type="submit"
            form="followup-form"
            className="w-full h-14 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-lg font-bold flex items-center justify-center transition-colors shadow-sm focus:ring-4 focus:ring-[#0F5F5C]/30"
          >
            Save follow-up
          </button>
        </div>
      </div>
    </div>
  );
};
