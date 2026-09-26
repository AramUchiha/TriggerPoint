import MapClient from "@/components/map/MapClient";
import { DataProvider } from "@/components/data/DataProvider";
import { BottomSheet } from "@/components/sheet/BottomSheet";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Notice } from "@/components/ui/Notice";
import { SafetyFooter } from "@/components/ui/SafetyFooter";
import { StatusBar } from "@/components/ui/StatusBar";
import { parseDemoFlag } from "@/lib/demo-flag";

export default async function Home({ searchParams }: PageProps<"/">) {
  const demo = parseDemoFlag((await searchParams).demo);
  return (
    <DataProvider demo={demo}>
      <main className="relative h-dvh w-full overflow-hidden bg-surface">
        <MapClient />
        <StatusBar />
        <DemoBanner />
        <Notice />
        <BottomSheet />
        <SafetyFooter />
      </main>
    </DataProvider>
  );
}
