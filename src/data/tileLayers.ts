export interface TileLayerConfig {
  id: string;
  labelKey: 'tileLayerStandard' | 'tileLayerTopo' | 'tileLayerLight' | 'tileLayerSatellite';
  url: string;
  attribution: string;
  maxZoom: number;
}

export const TILE_LAYERS: TileLayerConfig[] = [
  {
    id: 'osm',
    labelKey: 'tileLayerStandard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: 'topo',
    labelKey: 'tileLayerTopo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    id: 'carto',
    labelKey: 'tileLayerLight',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  {
    id: 'satellite',
    labelKey: 'tileLayerSatellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
];

export const DEFAULT_TILE_LAYER_ID = 'osm';
