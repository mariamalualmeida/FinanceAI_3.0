import { useQuery } from "@tanstack/react-query";
import type { UserSettings } from "@shared/schema";

export function useInterfaceStyle() {
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  return {
    interfaceStyle: settings?.interfaceStyle || "simple",
  };
}