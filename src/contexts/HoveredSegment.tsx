import React, { createContext, useContext, useState } from 'react';

interface HoveredSegmentCtx {
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
  hoveredKmDist: number | null;
  setHoveredKmDist: (dist: number | null) => void;
}

const HoveredSegmentContext = createContext<HoveredSegmentCtx>({
  hoveredId: null,
  setHoveredId: () => {},
  hoveredKmDist: null,
  setHoveredKmDist: () => {},
});

export const HoveredSegmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoveredKmDist, setHoveredKmDist] = useState<number | null>(null);
  return (
    <HoveredSegmentContext.Provider value={{ hoveredId, setHoveredId, hoveredKmDist, setHoveredKmDist }}>
      {children}
    </HoveredSegmentContext.Provider>
  );
};

export const useHoveredSegment = () => useContext(HoveredSegmentContext);
