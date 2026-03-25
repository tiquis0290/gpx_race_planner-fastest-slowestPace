import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

interface CollapsibleCardProps {
  title: string;
  className?: string;
  defaultCollapsed?: boolean;
  headerExtra?: (collapsed: boolean) => React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  className,
  defaultCollapsed = false,
  headerExtra,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const cardTitle = (
    <div className="collapsible-card-title">
      <Button
        icon={`pi pi-chevron-${collapsed ? 'down' : 'up'}`}
        text rounded
        className="collapsible-card-btn"
        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
      />
      <span>{title}</span>
      {headerExtra && (
        <div className="collapsible-card-title__extra">
          {headerExtra(collapsed)}
        </div>
      )}
    </div>
  );

  return (
    <Card title={cardTitle} className={className}>
      {collapsed ? null : children}
    </Card>
  );
};

export default CollapsibleCard;
