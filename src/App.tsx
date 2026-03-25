import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Menubar } from 'primereact/menubar';
import { SelectButton } from 'primereact/selectbutton';
import type { MenuItem } from 'primereact/menuitem';
import CollapsibleCard from './components/CollapsibleCard';
import ResetConfirmDialog from './components/ResetConfirmDialog';
import { useGpxData } from './hooks/useGpxData';
import { useSegmentData } from './hooks/useSegmentData';
import { useAppSettings } from './hooks/useAppSettings';
import { useResults } from './hooks/useResults';
import { useFullReset } from './hooks/useFullReset';

import type { AppDispatch } from './store';
import { setLanguage, setAppMode } from './store/settingsSlice';
import { useT } from './i18n/useT';
import { LANGS, GITHUB_URL, AUTHOR_URL, AUTHOR_LABEL } from './constants';

import GpxUploader from './components/GpxUploader';
import ManualSegmentEditor from './components/ManualSegmentEditor';
import ManualSegmentWatcher from './components/ManualSegmentWatcher';
import PaceSettings from './components/PaceSettings';
import EffortSettings from './components/EffortSettings';
import ElevationChart from './components/ElevationChart';
import SegmentsTable from './components/SegmentsTable';
import SummaryPanel from './components/SummaryPanel';
import FitExport from './components/FitExport';
import ResultsCalculator from './components/ResultsCalculator';
import SegmentationWatcher from './components/SegmentationWatcher';
import RouteMap from './components/RouteMap';
import HelpDialog from './components/HelpDialog';
import { HoveredSegmentProvider } from './contexts/HoveredSegment';


const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { smoothedPoints, fileName } = useGpxData();
  const { segments }                 = useSegmentData();
  const { language, appMode }        = useAppSettings();
  const { isCalculating }            = useResults();
  const [helpVisible, setHelpVisible] = useState(false);
  const handleFullReset = useFullReset();

  const modeOptions = [
    { label: t.modeGpx, value: 'gpx' },
    { label: t.modeManual, value: 'manual' },
  ];

  const menuItems: MenuItem[] = [
    { label: t.resetAll, icon: 'pi pi-refresh', command: handleFullReset },
    { separator: true },
    {
      label: t.downloadFit,
      icon: 'pi pi-download',
      disabled: segments.length === 0,
      command: () => document.getElementById('fit-export-btn')?.click(),
    },
    { separator: true },
    {
      label: t.help,
      icon: 'pi pi-question-circle',
      command: () => setHelpVisible(true),
    },
  ];

  const menubarStart = (
    <div className="menubar-brand">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" className="menubar-brand__icon" />
      <span className="menubar-brand__name">{t.appName}</span>
    </div>
  );

  const menubarEnd = (
    <div className="flex align-items-center gap-2">
      <div className="lang-switcher">
        {LANGS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => dispatch(setLanguage(value))}
            className={`lang-btn${language === value ? ' lang-btn--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="fit-export-hidden">
        <FitExport id="fit-export-btn" />
      </div>
    </div>
  );

  return (
    <div className="app-root">
      {appMode === 'gpx' ? <SegmentationWatcher /> : <ManualSegmentWatcher />}
      <ResultsCalculator />
      <ResetConfirmDialog />
      <HelpDialog language={language} visible={helpVisible} onHide={() => setHelpVisible(false)} />

      <Menubar
        model={menuItems}
        start={menubarStart}
        end={menubarEnd}
        className="app-menubar"
      />

      <div className="app-content">
        {segments.length > 0 && <SummaryPanel />}

        <div className="grid">
          <div className="col-12 lg:col-4">
            <div className="mb-3">
              <SelectButton
                value={appMode}
                options={modeOptions}
                onChange={(e) => e.value && dispatch(setAppMode(e.value))}
              />
            </div>

            {appMode === 'gpx' ? <GpxUploader /> : <ManualSegmentEditor />}
            <PaceSettings />
            <EffortSettings />
          </div>

          <div className={`col-12 lg:col-8 results-col${isCalculating ? ' results-col--calculating' : ''}`}>
            {isCalculating && (
              <div className="results-overlay">
                <i className="pi pi-spin pi-spinner results-overlay__icon" />
              </div>
            )}
            {appMode === 'gpx' && fileName && smoothedPoints.length > 0 && segments.length > 0 && (
              <CollapsibleCard title={t.mapCard} className="mb-3 route-map-card">
                <RouteMap points={smoothedPoints} segments={segments} />
              </CollapsibleCard>
            )}

            <CollapsibleCard title={t.chartCard} className="mb-3">
              {smoothedPoints.length > 0 ? (
                <ElevationChart points={smoothedPoints} segments={segments} />
              ) : (
                <div className="chart-empty">
                  <i className="pi pi-map-marker chart-empty__icon" />
                  <h2 className="chart-empty__title">
                    {appMode === 'gpx' ? t.emptyTitle : t.manualEditorCard}
                  </h2>
                  <p className="chart-empty__desc">
                    {appMode === 'gpx' ? t.emptyDesc : t.manualEmptyChartHint}
                  </p>
                </div>
              )}
            </CollapsibleCard>

            {segments.length > 0 && <SegmentsTable />}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <a href={GITHUB_URL} target="_blank" rel="noopener" className="app-footer__link">
          <i className="pi pi-github" /> {t.github}
        </a>
        <span className="app-footer__sep">·</span>
        <a href={AUTHOR_URL} target="_blank" rel="noopener" className="app-footer__link">
          {AUTHOR_LABEL}
        </a>
        <span className="app-footer__sep">·</span>
        <span className="app-footer__meta">v{__APP_VERSION__}</span>
        <span className="app-footer__sep">·</span>
        <span className="app-footer__meta">{t.builtAt} {new Date(__BUILD_TIME__).toLocaleString()}</span>
      </footer>
    </div>
  );
};

const AppWithProvider: React.FC = () => (
  <HoveredSegmentProvider>
    <App />
  </HoveredSegmentProvider>
);

export default AppWithProvider;
