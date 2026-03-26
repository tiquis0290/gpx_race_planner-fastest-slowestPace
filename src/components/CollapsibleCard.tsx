/**
 * Standard section container used throughout the app.
 * PrimeReact Card with a collapse/expand toggle in the header.
 * `headerExtra` renders additional content on the right side of the header
 * (e.g. column picker in SegmentsTable) — receives `collapsed` so controls
 * can hide themselves when the card is collapsed.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useT } from '../i18n/useT';

interface CollapsibleCardProps {
  title: string;
  className?: string;
  defaultCollapsed?: boolean;
  fullscreenEnabled?: boolean;
  headerExtra?: (collapsed: boolean) => React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  className,
  defaultCollapsed = false,
  fullscreenEnabled = false,
  headerExtra,
  children,
}) => {
  const t = useT();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleCollapsed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(c => !c);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        window.dispatchEvent(new Event('resize'));
      });
    } else {
      document.exitFullscreen().then(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }
  };

  const cardTitle = (
    <div className="collapsible-card-title">
      <Button
        icon={`pi pi-chevron-${collapsed ? 'down' : 'up'}`}
        text rounded
        className="collapsible-card-btn"
        onClick={toggleCollapsed}
      />
      <span>{title}</span>
      <div className="collapsible-card-title__extra">
        {headerExtra?.(collapsed)}
        {fullscreenEnabled && !!document.fullscreenEnabled && (
          <Button
            icon={`pi pi-${isFullscreen ? 'window-minimize' : 'window-maximize'}`}
            text rounded
            className="collapsible-card-btn"
            tooltip={isFullscreen ? t.fullscreenClose : t.fullscreenOpen}
            tooltipOptions={{ position: 'bottom' }}
            onClick={toggleFullscreen}
          />
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`collapsible-card-fs${isFullscreen ? ' collapsible-card-fs--active' : ''}`}>
      <Card title={cardTitle} className={className}>
        <div className={`collapsible-card-body${collapsed ? ' collapsible-card-body--collapsed' : ''}`}>
          <div>{children}</div>
        </div>
      </Card>
    </div>
  );
};

export default CollapsibleCard;
