import { createFileRoute } from "@tanstack/react-router";
import { WallpaperGenerator } from "@/components/wallpaper-generator";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return <WallpaperGenerator />;
}
