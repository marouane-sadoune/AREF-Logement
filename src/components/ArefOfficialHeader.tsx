import React, { useState } from 'react';

interface ArefOfficialHeaderProps {
  className?: string;
  subDepartment?: string;
  imageWidthClass?: string;
}

export const ArefOfficialHeader: React.FC<ArefOfficialHeaderProps> = ({ 
  className = '', 
  subDepartment,
  imageWidthClass = 'w-[88%] max-w-[820px]'
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`w-full text-slate-900 select-none pb-3 ${className}`} dir="rtl">
      {/* Official Header Image (from /images/header.png uploaded by user) */}
      {!imageError ? (
        <div className="header-logo text-center w-full">
          <img 
            src="/images/header.png" 
            alt="المملكة المغربية - وزارة التربية الوطنية والتعليم الأولي والرياضة - الأكاديمية الجهوية للتربية والتكوين لجهة الشرق"
            className={`${imageWidthClass} h-auto mx-auto object-contain block`}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        /* Vector Fallback if image fails */
        <div>
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="w-[35%] text-right font-serif text-[#16294d] leading-snug">
              <div className="text-[17px] md:text-[19px] font-black">المملكة المغربية</div>
              <div className="text-[16px] md:text-[18px] font-black mt-0.5">وزارة التربية الوطنية</div>
              <div className="text-[16px] md:text-[18px] font-black">والتعليم الأولي والرياضة</div>
            </div>

            <div className="w-[30%] flex justify-center items-center">
              <svg viewBox="0 0 240 220" className="w-24 h-24 object-contain filter drop-shadow-xs">
                <defs>
                  <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F9D423" />
                    <stop offset="50%" stopColor="#E1A100" />
                    <stop offset="100%" stopColor="#B77700" />
                  </linearGradient>
                  <linearGradient id="crestRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C0392B" />
                    <stop offset="100%" stopColor="#962214" />
                  </linearGradient>
                  <linearGradient id="crestGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2ECC71" />
                    <stop offset="100%" stopColor="#1B7A43" />
                  </linearGradient>
                </defs>
                <g transform="translate(120, 100) scale(0.85)">
                  <g transform="translate(0, -90)">
                    <path d="M -35,10 C -35,10 -25,-20 0,-25 C 25,-20 35,10 35,10 Z" fill="url(#crestGold)" stroke="#8A5A00" strokeWidth="1.5" />
                    <ellipse cx="0" cy="10" rx="35" ry="6" fill="#B77700" stroke="#5C3C00" strokeWidth="1" />
                    <circle cx="-22" cy="10" r="2.5" fill="#E74C3C" />
                    <circle cx="-11" cy="10" r="2.5" fill="#2ECC71" />
                    <circle cx="0" cy="10" r="3" fill="#F1C40F" />
                    <circle cx="11" cy="10" r="2.5" fill="#2ECC71" />
                    <circle cx="22" cy="10" r="2.5" fill="#E74C3C" />
                  </g>
                  <g transform="translate(0, 5)">
                    <path d="M -40,-50 L 40,-50 L 40,5 C 40,48 20,70 0,82 C -20,70 -40,48 -40,5 Z" fill="#F9D423" stroke="#8A5A00" strokeWidth="3" />
                    <path d="M -34,-44 L 34,-44 L 34,5 C 34,42 16,62 0,73 C -16,62 -34,42 -34,5 Z" fill="url(#crestRed)" />
                  </g>
                </g>
              </svg>
            </div>

            <div className="w-[35%] text-left font-sans text-[#16294d] leading-snug tracking-wider" dir="ltr">
              <div className="text-[13px] md:text-[15px] font-bold">ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ</div>
              <div className="text-[12px] md:text-[14px] font-bold mt-0.5">ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ</div>
              <div className="text-[12px] md:text-[14px] font-bold">ⴷ ⵓⵙⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⵏⵜ</div>
            </div>
          </div>

          <div className="mt-2 text-center">
            <h1 className="text-[23px] font-black text-[#16294d] font-serif">
              الأكاديمية الجهوية للتربية والتكوين لجهة الشرق
            </h1>
            <div className="text-[13px] font-bold text-[#16294d] tracking-widest mt-0.5" dir="ltr">
              ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⵎⵏⴰⴹⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⵓⵜⵜⴳ ⵏ ⵜⵎⵏⴰⴹⵜ ⵏ ⵓⴳⵎⵓⴹ
            </div>
          </div>
        </div>
      )}

      {/* Optional sub-department / provincial info underneath */}
      {subDepartment && (
        <div className="text-center mt-2 text-xs font-semibold text-slate-700 font-sans border-t border-slate-200 pt-1.5">
          {subDepartment}
        </div>
      )}
    </div>
  );
};
