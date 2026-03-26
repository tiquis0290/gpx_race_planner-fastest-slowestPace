import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Menubar } from 'primereact/menubar';
import { SelectButton } from 'primereact/selectbutton';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
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
import { LANGS } from './constants';

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
import { TILE_LAYERS, DEFAULT_TILE_LAYER_ID } from './data/tileLayers';
import HelpDialog from './components/HelpDialog';
import AppFooter from './components/AppFooter';
import { HoveredSegmentProvider } from './contexts/HoveredSegment';


const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { smoothedPoints, fileName } = useGpxData();
  const { segments }                 = useSegmentData();
  const { language, appMode }        = useAppSettings();
  const { isCalculating }            = useResults();
  const [helpVisible, setHelpVisible] = useState(false);
  const [kmMarkersEnabled, setKmMarkersEnabled] = useState(false);
  const [scaleEnabled, setScaleEnabled] = useState(true);
  const [tileLayerId, setTileLayerId] = useState(DEFAULT_TILE_LAYER_ID);
  const mapSettingsRef = useRef<OverlayPanel>(null);
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
              <CollapsibleCard
                title={t.mapCard}
                className="mb-3 route-map-card"
                fullscreenEnabled
                headerExtra={() => (
                  <Button
                    icon="pi pi-cog"
                    text rounded
                    className="collapsible-card-btn"
                    tooltip={t.mapSettingsLabel}
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => mapSettingsRef.current?.toggle(e)}
                  />
                )}
              >
                <RouteMap points={smoothedPoints} segments={segments} kmMarkersEnabled={kmMarkersEnabled} scaleEnabled={scaleEnabled} tileLayerId={tileLayerId} />
              </CollapsibleCard>
            )}
            <OverlayPanel ref={mapSettingsRef}>
              <div className="text-sm font-semibold mb-3">{t.mapSettingsLabel}</div>
              <div className="mb-3">
                <div className="text-sm mb-1">{t.mapTileLayerLabel}</div>
                <Dropdown
                  value={tileLayerId}
                  options={TILE_LAYERS.map((l) => ({ label: t[l.labelKey], value: l.id }))}
                  onChange={(e) => setTileLayerId(e.value as string)}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <div className="text-sm mb-1">{t.mapKmMarkers}</div>
                <InputSwitch
                  checked={kmMarkersEnabled}
                  onChange={(e) => setKmMarkersEnabled(e.value ?? false)}
                />
              </div>
              <div>
                <div className="text-sm mb-1">{t.mapScale}</div>
                <InputSwitch
                  checked={scaleEnabled}
                  onChange={(e) => setScaleEnabled(e.value ?? false)}
                />
              </div>
            </OverlayPanel>

            <CollapsibleCard title={t.chartCard} className="mb-3" fullscreenEnabled>
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

      <AppFooter />
    </div>
  );
};

const AppWithProvider: React.FC = () => (
  <HoveredSegmentProvider>
    <App />
  </HoveredSegmentProvider>
);

export default AppWithProvider;
