"use client";

import dynamic from "next/dynamic";

// MapLibre and deck.gl need `window` and WebGL, so the map never renders on the server.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-surface" aria-hidden />,
});

export default function MapClient() {
  return <MapView />;
}
