import React from 'react';
import { LayoutGrid, Loader2, Monitor, X } from 'lucide-react';
import { WorkspaceTab } from '../../utils/desktopWorkspace';
import { ApplicationLogoBadge } from '../brand/CategoryIcon';

interface WorkspaceTabBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  categoryIconMap: Map<string, { name: string; icon: string }>;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllTabs: () => void;
  isElectronRuntime: boolean;
}

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  categoryIconMap,
  onSelectTab,
  onCloseTab,
  onCloseAllTabs,
  isElectronRuntime,
}: WorkspaceTabBarProps) {
  return (
    <div
      className="bg-[#083B38] text-white border-b border-teal-900/80 px-3 sm:px-6 pt-2 flex items-center justify-between gap-2 select-none"
      role="tablist"
      aria-label="Tab Aplikasi Terbuka"
      data-testid="workspace-tab-bar"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
        {/* Dashboard Home Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTabId === 'dashboard'}
          onClick={() => onSelectTab('dashboard')}
          data-testid="tab-dashboard-home"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all shrink-0 cursor-pointer border-t border-x ${
            activeTabId === 'dashboard'
              ? 'bg-[#F8FAFC] text-[#0F766E] border-white shadow-xs'
              : 'bg-teal-950/60 text-teal-100/85 border-teal-800/50 hover:bg-teal-900/70 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          <span>Dashboard Portal</span>
          {tabs.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                activeTabId === 'dashboard'
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-teal-800 text-teal-100'
              }`}
            >
              {tabs.length}
            </span>
          )}
        </button>

        {/* Open Application Tabs */}
        {tabs.map((tab) => {
          const isSelected = activeTabId === tab.tabId;
          const catInfo = categoryIconMap.get(tab.categoryId);

          return (
            <div
              key={tab.tabId}
              role="tab"
              aria-selected={isSelected}
              data-testid={`workspace-tab-${tab.appId}`}
              onClick={() => onSelectTab(tab.tabId)}
              className={`group inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-t-xl text-xs font-bold transition-all shrink-0 max-w-[220px] cursor-pointer border-t border-x ${
                isSelected
                  ? 'bg-white text-[#0F172A] border-white shadow-xs'
                  : 'bg-teal-900/55 text-teal-100/90 border-teal-800/40 hover:bg-teal-800/70 hover:text-white'
              }`}
            >
              <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                {tab.isLoading ? (
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      isSelected ? 'text-[#0F766E]' : 'text-teal-200'
                    }`}
                  />
                ) : (
                  <ApplicationLogoBadge
                    name={tab.title}
                    logoUrl={tab.logoUrl}
                    categoryIcon={catInfo?.icon}
                    size="sm"
                  />
                )}
              </div>

              <span className="truncate select-none">{tab.title}</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.tabId);
                }}
                aria-label={`Tutup tab ${tab.title}`}
                data-testid={`close-tab-${tab.appId}`}
                className={`p-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    : 'text-teal-200/70 hover:text-white hover:bg-teal-700/60'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Right Status & Close All Action */}
      <div className="hidden sm:flex items-center gap-2 pb-1.5 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/80 border border-teal-700/50 text-[11px] font-semibold text-teal-100">
          <Monitor className="w-3 h-3 text-[#A3E635]" />
          <span>{isElectronRuntime ? 'Engine: WebContentsView' : 'Workspace Internal'}</span>
        </span>

        {tabs.length > 1 && (
          <button
            type="button"
            onClick={onCloseAllTabs}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-100 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Tutup Semua ({tabs.length})
          </button>
        )}
      </div>
    </div>
  );
}
