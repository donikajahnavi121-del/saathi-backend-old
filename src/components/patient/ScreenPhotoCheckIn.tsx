import React, { useState } from 'react';
import { Camera, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Translations } from '../../data/translations';

interface Props {
  onCapture: (photoDataUrl: string) => void;
  onCannotTakePhoto: () => void;
  onBack: () => void;
  t: Translations;
}

export const ScreenPhotoCheckIn: React.FC<Props> = ({
  onCapture,
  onCannotTakePhoto,
  onBack,
  t,
}) => {
  const [isSimulatingCapture, setIsSimulatingCapture] = useState(false);

  const handleCaptureClick = () => {
    setIsSimulatingCapture(true);
    // Produce a realistic sample photo preview (blister pack / tablets in palm)
    setTimeout(() => {
      setIsSimulatingCapture(false);
      onCapture('sample_blister_strip');
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#E8F2F1] overflow-y-auto">
      {/* Top Bar with Back Button & Instruction */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-[#0F5F5C] font-semibold text-base mb-3 -ml-1 p-1 rounded-lg"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>{t.navHome}</span>
        </button>

        <h1 className="text-2xl font-bold text-[#1B2B2A] text-center tracking-tight">
          {t.showMedicineHeader}
        </h1>
      </div>

      {/* Camera Viewfinder with Rounded Rectangle Guide Overlay */}
      <div className="relative my-auto w-full aspect-[4/5] max-h-[380px] bg-[#1B2B2A] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#D0E3E1] shadow-inner">
        {/* Background silhouette: neutral hand holding blister pack / tablets */}
        <div className="absolute inset-0 flex items-center justify-center opacity-85 select-none pointer-events-none">
          <svg
            viewBox="0 0 320 400"
            className="w-full h-full object-cover filter blur-[1.5px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background ambient lighting */}
            <rect width="320" height="400" fill="#243332" />
            {/* Neutral hand silhouette */}
            <path
              d="M90 380 C110 320, 100 260, 120 220 C130 200, 150 190, 170 190 C185 190, 195 200, 205 215 C215 230, 210 280, 230 380 Z"
              fill="#D4B59D"
              opacity="0.8"
            />
            {/* Blister pack with 4 tablets */}
            <rect
              x="110"
              y="160"
              width="100"
              height="80"
              rx="8"
              fill="#B0C8C6"
              stroke="#E8F2F1"
              strokeWidth="3"
            />
            <rect x="114" y="164" width="92" height="72" rx="6" fill="#A1BCB9" />
            {/* 4 Tablets foil bubbles */}
            <circle cx="135" cy="185" r="14" fill="#E84A3B" opacity="0.9" />
            <circle cx="185" cy="185" r="14" fill="#E84A3B" opacity="0.9" />
            <circle cx="135" cy="215" r="14" fill="#E84A3B" opacity="0.9" />
            <circle cx="185" cy="215" r="14" fill="#D9534F" opacity="0.9" />
            {/* Hand fingers clasping strip */}
            <path
              d="M100 230 C95 210, 120 210, 130 220"
              stroke="#C4A58D"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M190 235 C205 220, 225 225, 220 245"
              stroke="#C4A58D"
              strokeWidth="16"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Rounded rectangle guide overlay with clear corners */}
        <div className="relative w-[82%] h-[75%] border-2 border-dashed border-white/80 rounded-2xl flex flex-col justify-between p-3 pointer-events-none">
          <div className="flex justify-between">
            <span className="w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <span className="w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
          </div>
          <div className="text-center">
            <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              Keep pills inside this frame
            </span>
          </div>
          <div className="flex justify-between">
            <span className="w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <span className="w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>

        {/* Shutter flash effect */}
        {isSimulatingCapture && (
          <div className="absolute inset-0 bg-white opacity-80 transition-opacity duration-150 z-20" />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col items-center mt-3 gap-3">
        {/* Large Round Capture Button */}
        <button
          onClick={handleCaptureClick}
          className="w-20 h-20 rounded-full bg-white border-4 border-[#0F5F5C] p-1 flex items-center justify-center shadow-lg active:scale-95 transition-transform group"
          aria-label={t.takePhoto}
        >
          <div className="w-full h-full rounded-full bg-[#0F5F5C] group-hover:bg-[#0C4E4B] flex flex-col items-center justify-center text-white">
            <Camera className="w-7 h-7" />
          </div>
        </button>
        <span className="text-base font-bold text-[#1B2B2A]">
          {t.takePhoto}
        </span>

        {/* Fallback option */}
        <button
          onClick={onCannotTakePhoto}
          className="text-base font-medium text-[#0F5F5C] hover:underline pt-1"
        >
          {t.cannotTakePhoto}
        </button>

        {/* Small reassuring note */}
        <div className="flex items-center gap-1.5 text-xs text-[#4B6361] mt-1 text-center">
          <ShieldCheck className="w-4 h-4 text-[#0F5F5C] shrink-0" />
          <span>{t.counsellorSupportNote}</span>
        </div>
      </div>
    </div>
  );
};
