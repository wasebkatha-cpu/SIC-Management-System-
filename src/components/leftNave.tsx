import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, AlertCircle, Building2, UserCheck, ClipboardList } from 'lucide-react';

interface LeftNaveProps {
  onSelect?: (view: string) => void;
  activeView?: string;
}

export default function LeftNave({ onSelect, activeView }: LeftNaveProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out relative flex flex-col ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-white border border-neutral-200 rounded-full p-1 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300 shadow-sm z-10"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4 text-neutral-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        )}
      </button>

      <div className="flex-1 py-6 px-3 overflow-hidden flex flex-col">
        <nav className="space-y-1">
          <button
            onClick={() => onSelect && onSelect('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              activeView === 'dashboard'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title={!isExpanded ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap overflow-hidden text-sm">
                Dashboard
              </span>
            )}
          </button>
          <button
            onClick={() => onSelect && onSelect('complaints')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              activeView === 'complaints'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title={!isExpanded ? "Complaints" : undefined}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap overflow-hidden text-sm">
                Complaints
              </span>
            )}
          </button>
          <button
            onClick={() => onSelect && onSelect('publicBodies')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              activeView === 'publicBodies'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title={!isExpanded ? "Public Bodies" : undefined}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap overflow-hidden text-sm">
                Public Bodies
              </span>
            )}
          </button>
          <button
            onClick={() => onSelect && onSelect('designatedOfficials')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              activeView === 'designatedOfficials'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title={!isExpanded ? "Designated Officials" : undefined}
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap overflow-hidden text-sm">
                Designated Officials
              </span>
            )}
          </button>
          <button
            onClick={() => onSelect && onSelect('causeList')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              activeView === 'causeList'
                ? 'bg-neutral-100 text-neutral-900 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
            title={!isExpanded ? "Cause List" : undefined}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap overflow-hidden text-sm">
                Cause List
              </span>
            )}
          </button>
        </nav>
      </div>
    </aside>
  );
}
