import React, { useState } from 'react';
import {
  Phone,
  ClipboardPen,
  ChevronLeft,
  Calendar,
  Clock,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  CalendarDays,
  Pill,
} from 'lucide-react';
import { Patient, FollowUpLog } from '../../types';
import { ScreenWhyFlaggedPanel } from './ScreenWhyFlaggedPanel';
import { DrawerLogFollowUp } from './DrawerLogFollowUp';

interface Props {
  patient: Patient;
  onBack: () => void;
  onCallPatient: (patient: Patient) => void;
  followUpLogs: FollowUpLog[];
  onAddFollowUp: (log: FollowUpLog) => void;
}

export const ScreenPatientProfile: React.FC<Props> = ({
  patient,
  onBack,
  onCallPatient,
  followUpLogs,
  onAddFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Adherence' | 'Notes'>('Overview');
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);

  const isHigh = patient.riskBand === 'High';
  const isMed = patient.riskBand === 'Medium';

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#E8F2F1]">
      {/* Top back navigation */}
      <button
        onClick={onBack}
        className="flex items-center text-[#0F5F5C] font-semibold text-base mb-4 hover:underline"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        <span>Back to Priority Queue</span>
      </button>

      {/* Compact Header (Screen 13 spec) */}
      <div className="bg-white rounded-2xl p-6 border border-[#D0E3E1] shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B2B2A] tracking-tight">
              {patient.name}
            </h1>
            <span className="text-sm font-semibold text-[#4B6361] bg-[#F4F9F8] px-2.5 py-1 rounded-md border border-[#D0E3E1]">
              {patient.id}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                isHigh
                  ? 'bg-[#FFE5D9] text-[#A62F18]'
                  : isMed
                  ? 'bg-[#FFF1D6] text-[#8A5D00]'
                  : 'bg-[#E9F5EF] text-[#2E7D5B]'
              }`}
            >
              {patient.riskBand} Risk
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#4B6361] mt-2">
            <span className="font-medium text-[#1B2B2A]">{patient.treatmentPhase}</span>
            <span>•</span>
            <span>{patient.phone}</span>
            <span>•</span>
            <span>{patient.phcLocation}</span>
          </div>
        </div>

        {/* Buttons: "Call patient" and "Log follow-up" */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onCallPatient(patient)}
            className="h-12 px-5 bg-[#0F5F5C] hover:bg-[#0C4E4B] text-white rounded-xl text-base font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Call patient</span>
          </button>

          <button
            onClick={() => setIsLogDrawerOpen(true)}
            className="h-12 px-5 bg-white border-2 border-[#D0E3E1] hover:bg-slate-50 text-[#1B2B2A] rounded-xl text-base font-bold flex items-center gap-2 transition-colors"
          >
            <ClipboardPen className="w-4 h-4 text-[#0F5F5C]" />
            <span>Log follow-up</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tabs & Panels (8 cols) + Right Vertical Timeline (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tabs: Overview, Adherence, Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs Header */}
          <div className="bg-white rounded-2xl p-2 border border-[#D0E3E1] shadow-sm flex items-center gap-2">
            {(['Overview', 'Adherence', 'Notes'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-base font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#0F5F5C] text-white shadow-xs'
                      : 'text-[#4B6361] hover:text-[#1B2B2A] hover:bg-[#F4F9F8]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview (Embeds Screen 14 "Why this patient is flagged") */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Screen 14 component */}
              <ScreenWhyFlaggedPanel
                patient={patient}
                onTakeSuggestedAction={() => onCallPatient(patient)}
              />

              {/* Treatment & Regimen Card (Clean, no dense EHR fields) */}
              <div className="bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1B2B2A] mb-4">
                  Treatment Protocol
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]">
                    <span className="text-xs font-semibold text-[#4B6361] uppercase block">
                      Medication Regimen
                    </span>
                    <span className="text-base font-bold text-[#1B2B2A] mt-1 block">
                      {patient.regimen}
                    </span>
                  </div>
                  <div className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]">
                    <span className="text-xs font-semibold text-[#4B6361] uppercase block">
                      Primary Health Centre
                    </span>
                    <span className="text-base font-bold text-[#1B2B2A] mt-1 block">
                      {patient.phcLocation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Adherence */}
          {activeTab === 'Adherence' && (
            <div className="bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1B2B2A]">
                    Monthly Adherence Performance
                  </h3>
                  <p className="text-sm text-[#4B6361] mt-0.5">
                    Continuous tracking with minimal patient effort
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-[#0F5F5C]">
                    {patient.adherencePercentage}%
                  </span>
                  <span className="text-xs text-[#4B6361] block">Last 30 days</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]">
                  <span className="text-xs font-semibold text-[#4B6361]">Current Streak</span>
                  <p className="text-2xl font-bold text-[#1B2B2A] mt-1">
                    {patient.currentStreak} Days
                  </p>
                </div>
                <div className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]">
                  <span className="text-xs font-semibold text-[#4B6361]">Verified Photos</span>
                  <p className="text-2xl font-bold text-[#2E7D5B] mt-1">22 Doses</p>
                </div>
                <div className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]">
                  <span className="text-xs font-semibold text-[#4B6361]">Gaps / Missed</span>
                  <p className="text-2xl font-bold text-[#8A5D00] mt-1">3 Doses</p>
                </div>
              </div>

              <div className="p-4 bg-[#E9F5EF] rounded-xl text-sm text-[#2E7D5B] font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  Photo verification channel is active. 91% of check-ins were verified without manual clinic visit.
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: Notes */}
          {activeTab === 'Notes' && (
            <div className="bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8F2F1]">
                <h3 className="text-lg font-bold text-[#1B2B2A]">
                  Counsellor Interaction Log
                </h3>
                <button
                  onClick={() => setIsLogDrawerOpen(true)}
                  className="text-sm font-bold text-[#0F5F5C] hover:underline"
                >
                  + Add new note
                </button>
              </div>

              {followUpLogs.filter((l) => l.patientId === patient.id).length === 0 ? (
                <div className="py-8 text-center text-[#4B6361] text-sm">
                  No previous follow-up notes logged for this patient yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {followUpLogs
                    .filter((l) => l.patientId === patient.id)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-[#F4F9F8] rounded-xl border border-[#D0E3E1]"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#4B6361]">
                          <span className="text-[#0F5F5C]">{log.reason}</span>
                          <span>{log.loggedAt}</span>
                        </div>
                        <p className="text-sm font-medium text-[#1B2B2A] mt-2">
                          {log.notes}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-[#4B6361] mt-2 pt-2 border-t border-[#E8F2F1]">
                          <span>Outcome: <strong className="text-[#1B2B2A]">{log.outcome}</strong></span>
                          <span>Next Follow-up: <strong className="text-[#1B2B2A]">{log.nextFollowUpDate}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Vertical Timeline of Recent Events (Screen 13 spec) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D0E3E1] p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#E8F2F1]">
            <CalendarDays className="w-5 h-5 text-[#0F5F5C]" />
            <h3 className="text-lg font-bold text-[#1B2B2A] tracking-tight">
              Recent Activity Timeline
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D0E3E1]">
            {patient.timeline.length === 0 ? (
              <div className="text-sm text-[#4B6361]">No recent events recorded.</div>
            ) : (
              patient.timeline.map((event) => {
                const isCheckIn = event.type === 'check_in';
                const isMissed = event.type === 'missed';
                const isCall = event.type === 'call';
                const isSideEffect = event.type === 'side_effect';

                return (
                  <div key={event.id} className="relative group">
                    {/* Timeline bullet icon */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                        isCheckIn
                          ? 'bg-[#2E7D5B]'
                          : isMissed
                          ? 'bg-[#8A9C9A]'
                          : isSideEffect
                          ? 'bg-[#8A5D00]'
                          : 'bg-[#0F5F5C]'
                      }`}
                    >
                      {isCheckIn && <FileCheck className="w-3 h-3" />}
                      {isMissed && <Clock className="w-3 h-3" />}
                      {isCall && <Phone className="w-3 h-3" />}
                      {isSideEffect && <AlertCircle className="w-3 h-3" />}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-[#4B6361]">
                        {event.date}
                      </span>
                      <h4 className="text-sm font-bold text-[#1B2B2A] mt-0.5">
                        {event.title}
                      </h4>
                      <p className="text-xs text-[#4B6361] mt-1 leading-relaxed">
                        {event.description}
                      </p>
                      {event.photoUrl && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F2F1] rounded-lg text-xs font-semibold text-[#0F5F5C]">
                          <Pill className="w-3.5 h-3.5" />
                          <span>View verified photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Follow-up Drawer (Screen 15) */}
      <DrawerLogFollowUp
        patient={patient}
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        onSave={(newLog) => {
          onAddFollowUp(newLog);
          setActiveTab('Notes');
        }}
      />
    </div>
  );
};
