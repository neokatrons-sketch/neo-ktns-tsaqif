import { TrackOrderForm } from "@/components/order/track-order-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getBusinessSettings } from "@/lib/business-settings";

export const metadata = { title: "Track Order" };

export const dynamic = "force-dynamic";

export default async function TrackOrderPage() { const settings = await getBusinessSettings(); return <main><PageHero eyebrow="Order assistance" title="Check in, human to human." description="Untuk MVP, status pesanan diperiksa langsung melalui chat agar setiap detail dapat dikonfirmasi dengan jelas." /><Container className="py-16 sm:py-24"><TrackOrderForm whatsappNumber={settings.whatsappNumber} /></Container></main>; }
