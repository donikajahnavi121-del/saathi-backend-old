import React, { useState } from 'react';
import {
  Patient,
  PatientScreen,
  CounsellorScreen,
  SupportedLanguage,
  TextSize,
  FollowUpLog,
} from './types';
import { MOCK_PATIENTS } from './data/mockPatients';
import { NavigationController, AppViewMode } from './components/NavigationController';
import { PatientPhoneFrame } from './components/patient/PatientPhoneFrame';
import { CounsellorSidebar } from './components/counsellor/CounsellorSidebar';
import { ScreenCounsellorLogin } from './components/counsellor/ScreenCounsellorLogin';
import { ScreenCounsellorDashboard } from './components/counsellor/ScreenCounsellorDashboard';
import { ScreenPriorityQueue } from './components/counsellor/ScreenPriorityQueue';
import { ScreenPatientProfile } from './components/counsellor/ScreenPatientProfile';
import { ScreenFollowUps } from './components/counsellor/ScreenFollowUps';
import { ScreenReports } from './components/counsellor/ScreenReports';
import { ScreenStyleGuide } from './components/ScreenStyleGuide';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<AppViewMode>('patient');
  const [activeScreenNumber, setActiveScreenNumber] = useState<number>(2);

  // Patient App State (NO LOGIN REQUIRED: Opens directly into daily check-in)
  const [patientScreen, setPatientScreen] = useState<PatientScreen>('home');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);

  // Counsellor Portal State (PROTECTED ACCESS: Login required)
  const [isCounsellorAuthenticated, setIsCounsellorAuthenticated] = useState<boolean>(false);
  const [counsellorName, setCounsellorName] = useState<string>('Sunita Rao');
  const [counsellorDistrict, setCounsellorDistrict] = useState<string>(
    'South Delhi - Chirag Delhi TB Unit'
  );
  const [counsellorScreen, setCounsellorScreen] = useState<CounsellorScreen>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(MOCK_PATIENTS[0]); // Anita P-0142
  const [followUpLogs, setFollowUpLogs] = useState<FollowUpLog[]>([
    {
      id: 'fl-init-1',
      patientId: 'P-0142',
      patientName: 'Anita Sharma',
      reason: 'Reported side effects last week',
      outcome: 'Reached',
      notes: 'Advised patient on taking dose after breakfast. Reassured about fatigue.',
      nextFollowUpDate: '2026-10-10',
      loggedAt: 'Yesterday, 04:15 PM',
    },
    {
      id: 'fl-init-2',
      patientId: 'P-0204',
      patientName: 'Vikram Singh',
      reason: 'Consecutive missed doses check',
      outcome: 'No answer',
      notes: 'Line busy. Left reminder SMS. Escalated for local worker visit.',
      nextFollowUpDate: '2026-10-09',
      loggedAt: 'Oct 7, 11:30 AM',
    },
  ]);

  // Screen Jumper Handler
  const handleJumpToScreen = (screenNumber: number) => {
    setActiveScreenNumber(screenNumber);

    switch (screenNumber) {
      case 1:
        // Style guide
        break;
      case 2:
        setViewMode('patient');
        setPatientScreen('home');
        setIsCheckedInToday(false);
        break;
      case 3:
        setViewMode('patient');
        setPatientScreen('checkin_success');
        setIsCheckedInToday(true);
        break;
      case 4:
        setViewMode('patient');
        setPatientScreen('home_missed');
        break;
      case 5:
        setViewMode('patient');
        setPatientScreen('checkin_camera');
        break;
      case 6:
        setViewMode('patient');
        setPatientScreen('checkin_review');
        break;
      case 7:
        setViewMode('patient');
        setPatientScreen('sign_in');
        break;
      case 8:
        setViewMode('patient');
        setPatientScreen('history');
        break;
      case 9:
        setViewMode('patient');
        setPatientScreen('side_effects');
        break;
      case 10:
        setViewMode('patient');
        setPatientScreen('help_language');
        break;
      case 11:
        setViewMode('counsellor');
        // Auto-authenticate for quick demo if jumping specifically to screen 11
        setIsCounsellorAuthenticated(true);
        setCounsellorScreen('dashboard');
        break;
      case 12:
        setViewMode('counsellor');
        setIsCounsellorAuthenticated(true);
        setCounsellorScreen('priority_queue');
        break;
      case 13:
        setViewMode('counsellor');
        setIsCounsellorAuthenticated(true);
        setSelectedPatient(MOCK_PATIENTS[0]); // Anita P-0142
        setCounsellorScreen('patient_profile');
        break;
      case 14:
        setViewMode('counsellor');
        setIsCounsellorAuthenticated(true);
        setSelectedPatient(MOCK_PATIENTS[0]); // Anita P-0142
        setCounsellorScreen('patient_profile');
        break;
      case 15:
        setViewMode('counsellor');
        setIsCounsellorAuthenticated(true);
        setSelectedPatient(MOCK_PATIENTS[0]); // Anita P-0142
        setCounsellorScreen('patient_profile');
        break;
      default:
        break;
    }
  };

  const handlePatientNavigate = (screen: PatientScreen) => {
    setPatientScreen(screen);
    if (screen === 'home') setActiveScreenNumber(2);
    else if (screen === 'home_missed') setActiveScreenNumber(4);
    else if (screen === 'checkin_camera') setActiveScreenNumber(5);
    else if (screen === 'checkin_review') setActiveScreenNumber(6);
    else if (screen === 'checkin_success') setActiveScreenNumber(3);
    else if (screen === 'side_effects') setActiveScreenNumber(9);
    else if (screen === 'history') setActiveScreenNumber(8);
    else if (screen === 'help_language') setActiveScreenNumber(10);
    else if (screen === 'sign_in') setActiveScreenNumber(7);
  };

  const handleCounsellorNavigate = (screen: CounsellorScreen) => {
    setCounsellorScreen(screen);
    if (screen === 'dashboard') setActiveScreenNumber(11);
    else if (screen === 'priority_queue') setActiveScreenNumber(12);
    else if (screen === 'patient_profile') setActiveScreenNumber(13);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCounsellorScreen('patient_profile');
    setActiveScreenNumber(13);
  };

  const handleCallPatient = (patient: Patient) => {
    alert(`Initiating secure clinical call with ${patient.name} (${patient.phone})`);
  };

  const handleAddFollowUp = (newLog: FollowUpLog) => {
    setFollowUpLogs((prev) => [newLog, ...prev]);
    // Also update patient contact note
    setPatients((prev) =>
      prev.map((p) =>
        p.id === newLog.patientId ? { ...p, lastContact: 'Just now' } : p
      )
    );
  };

  const handleCounsellorLogin = (name: string, district: string) => {
    setIsCounsellorAuthenticated(true);
    setCounsellorName(name);
    setCounsellorDistrict(district);
    setCounsellorScreen('dashboard');
  };

  const handleCounsellorLogout = () => {
    setIsCounsellorAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-[#E8F2F1] text-[#1B2B2A] flex flex-col font-sans">
      {/* Top Controller Bar with Role Awareness */}
      <NavigationController
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        patientScreen={patientScreen}
        onSetPatientScreen={setPatientScreen}
        counsellorScreen={counsellorScreen}
        onSetCounsellorScreen={setCounsellorScreen}
        onJumpToScreen={handleJumpToScreen}
        activeScreenNumber={activeScreenNumber}
        isCounsellorAuthenticated={isCounsellorAuthenticated}
        onCounsellorLogout={handleCounsellorLogout}
      />

      {/* Screen 1: Style Guide / System overview when selected */}
      {activeScreenNumber === 1 && (
        <ScreenStyleGuide
          onGoToPatientApp={() => handleJumpToScreen(2)}
          onGoToCounsellorPortal={() => {
            setIsCounsellorAuthenticated(true);
            handleJumpToScreen(11);
          }}
        />
      )}

      {/* Standard App Views */}
      {activeScreenNumber !== 1 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Patient App View (NO LOGIN REQUIRED: Directly opens check-in for patient) */}
          {(viewMode === 'patient' || viewMode === 'split') && (
            <div
              className={`flex-1 flex items-center justify-center p-4 overflow-y-auto ${
                viewMode === 'split' ? 'border-r border-[#D0E3E1] max-w-[480px]' : ''
              }`}
            >
              <PatientPhoneFrame
                activeScreen={patientScreen}
                onNavigate={handlePatientNavigate}
                language={language}
                onSelectLanguage={setLanguage}
                textSize={textSize}
                onChangeTextSize={setTextSize}
                isCheckedInToday={isCheckedInToday}
                setIsCheckedInToday={setIsCheckedInToday}
              />
            </div>
          )}

          {/* Counsellor Portal View (PROTECTED: Requires Counsellor Authentication) */}
          {(viewMode === 'counsellor' || viewMode === 'split') && (
            <div className="flex-1 flex overflow-hidden bg-white">
              {!isCounsellorAuthenticated ? (
                /* Protected Login Screen for Counsellors */
                <ScreenCounsellorLogin
                  onLoginSuccess={handleCounsellorLogin}
                  onBackToPatientApp={() => setViewMode('patient')}
                />
              ) : (
                /* Authenticated Counsellor Workspace */
                <>
                  {/* Left Sidebar */}
                  <CounsellorSidebar
                    activeScreen={counsellorScreen}
                    onNavigate={handleCounsellorNavigate}
                    onLogout={handleCounsellorLogout}
                    counsellorName={counsellorName}
                    district={counsellorDistrict}
                  />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {counsellorScreen === 'dashboard' && (
                      <ScreenCounsellorDashboard
                        patients={patients}
                        onSelectPatient={handleSelectPatient}
                        onCallPatient={handleCallPatient}
                        onViewAllPatients={() => setCounsellorScreen('priority_queue')}
                      />
                    )}

                    {counsellorScreen === 'priority_queue' && (
                      <ScreenPriorityQueue
                        patients={patients}
                        onSelectPatient={handleSelectPatient}
                        onCallPatient={handleCallPatient}
                      />
                    )}

                    {counsellorScreen === 'patient_profile' && (
                      <ScreenPatientProfile
                        patient={selectedPatient}
                        onBack={() => setCounsellorScreen('priority_queue')}
                        onCallPatient={handleCallPatient}
                        followUpLogs={followUpLogs}
                        onAddFollowUp={handleAddFollowUp}
                      />
                    )}

                    {counsellorScreen === 'follow_ups' && (
                      <ScreenFollowUps
                        followUpLogs={followUpLogs}
                        onOpenLogModal={() => setCounsellorScreen('patient_profile')}
                      />
                    )}

                    {counsellorScreen === 'reports' && <ScreenReports />}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
