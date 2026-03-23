import React, { createContext, useContext, useState } from 'react';

interface HoveredSegmentCtx {
  hoveredId: number | null;
  setHoveredId: (id: number | null) => void;
}

const HoveredSegmentContext = createContext<HoveredSegmentCtx>({
  hoveredId: null,
  setHoveredId: () => {},
});

export const HoveredSegmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  return (
    <HoveredSegmentContext.Provider value={{ hoveredId, setHoveredId }}>
      {children}
    </HoveredSegmentContext.Provider>
  );
};

export const useHoveredSegment = () => useContext(HoveredSegmentContext);
