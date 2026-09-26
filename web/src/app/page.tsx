import MapClient from "@/components/map/MapClient";
import { LayerToggles } from "@/components/map/LayerToggles";
import { SidePanel } from "@/components/panel/SidePanel";
import { StatusBar } from "@/components/ui/StatusBar";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-surface">
      <MapClient />
      <StatusBar />
      <SidePanel />
      <LayerToggles />
    </main>
  );
}
