import { NavigationClient } from "@/components/layout/navigation-client";
import { getPublicNavigation } from "@/lib/queries/website";

export async function Navigation() {
  const items = await getPublicNavigation();
  return <NavigationClient items={items} />;
}
