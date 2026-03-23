import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import type { GpxPoint, Segment } from '../types';
import { useHoveredSegment } from '../contexts/HoveredSegment';

interface Props {
  points: GpxPoint[];
  segments: Segment[];
}

const SEGMENT_COLORS: Record<string, string> = {
  uphill:   '#ef4444',
  downhill: '#22c55e',
  flat:     '#64748b',
};

// Fits map to the route bounds whenever points change
const BoundsFitter: React.FC<{ bounds: LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, bounds]);
  return null;
};

const RouteMap: React.FC<Props> = ({ points, segments }) => {
  const { hoveredId, setHoveredId } = useHoveredSegment();

  // Map each segment to its subset of lat/lon points
  const segmentLines = useMemo(() => {
    return segments.map((seg) => {
      const pts = points.filter(
        (p) => p.distance >= seg.startDistance - 1 && p.distance <= seg.endDistance + 1
      );
      return {
        id: seg.id,
        type: seg.type,
        positions: pts.map((p): LatLngTuple => [p.lat, p.lon]),
      };
    });
  }, [points, segments]);

  const bounds: LatLngBoundsExpression = useMemo(() => {
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  }, [points]);

  const center: LatLngTuple = useMemo(
    () => [points[0]?.lat ?? 50, points[0]?.lon ?? 14],
    [points]
  );

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="route-map"
      zoomControl={true}
    >
      <BoundsFitter bounds={bounds} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {segmentLines.map((seg) => {
        const isHovered = hoveredId === seg.id;
        return (
          <Polyline
            key={seg.id}
            positions={seg.positions}
            pathOptions={{
              color: SEGMENT_COLORS[seg.type],
              weight: isHovered ? 6 : 4,
              opacity: isHovered ? 1 : 0.7,
            }}
            eventHandlers={{
              mouseover: () => setHoveredId(seg.id),
              mouseout: () => setHoveredId(null),
            }}
          />
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;
