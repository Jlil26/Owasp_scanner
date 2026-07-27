import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', subtitle }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Precision Metallic & Dark Purple Cybersecurity Shield Icon */}
      <div className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 p-[1.5px] shadow-lg shadow-purple-900/20 flex items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-slate-950 rounded-[10.5px] flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4" strokeWidth="2.5" />
          </svg>
        </div>
      </div>
      <div>
        <div className={`font-black tracking-wider text-slate-100 ${textSizes[size]} font-mono flex items-center gap-1.5`}>
          <span>OWASP</span>
          <span className="text-purple-400">_SCAN_PRO</span>
        </div>
        {subtitle && (
          <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider font-mono">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
