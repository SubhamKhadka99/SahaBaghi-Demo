import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet.heat";

export interface CivicReport {
  id: string;
  type: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  description?: string;
  status: "Reported" | "Dispatched" | "Resolved";
  timestamp?: number;
}

interface MapViewProps {
  reports: CivicReport[];
  center?: LatLngExpression;
  zoom?: number;
  showHeatmap?: boolean;
  className?: string;
  heatRadius?: number;
  heatBlur?: number;
}

function HeatLayer({
  reports,
  heatRadius,
  heatBlur
}: {
  reports: CivicReport[];
  heatRadius: number;
  heatBlur: number;
}) {
  const map = useMap();

  useEffect(() => {
    const heatPoints: [number, number, number][] = reports.map((report) => [
      report.lat,
      report.lng,
      report.status === "Reported" ? 1 : report.status === "Dispatched" ? 0.65 : 0.3
    ]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: heatRadius,
      blur: heatBlur,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: {
        0.2: "#f59e0b",
        0.5: "#f97316",
        0.8: "#ef4444",
        1: "#dc2626"
      }
    });

    heatLayer.addTo(map);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, reports, heatRadius, heatBlur]);

  return null;
}

export default function MapView({
  reports,
  center = [27.7172, 85.324],
  zoom = 14,
  showHeatmap = false,
  className = "h-full w-full",
  heatRadius = 35,
  heatBlur = 28
}: MapViewProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showHeatmap ? <HeatLayer reports={reports} heatRadius={heatRadius} heatBlur={heatBlur} /> : null}
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.lat, report.lng]}
          radius={7}
          pathOptions={{
            color: "#00B4D8",
            fillColor: "#00B4D8",
            fillOpacity: 0.65
          }}
        >
          <Popup>
            <div className="w-52">
              <p className="font-semibold text-[#0A192F]">{report.type}</p>
              <p className="mb-2 text-xs text-slate-500">{report.status}</p>
              {report.description ? (
                <p className="mb-2 text-xs text-slate-600">{report.description}</p>
              ) : null}
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.type}
                  className="h-28 w-full rounded-md object-cover"
                />
              ) : (
                <p className="text-xs text-slate-500">No image attached</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
