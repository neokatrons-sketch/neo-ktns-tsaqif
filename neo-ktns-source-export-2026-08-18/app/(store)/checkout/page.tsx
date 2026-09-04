import { CheckoutOrderReview } from "@/components/checkout/checkout-order-review";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getBusinessSettings } from "@/lib/business-settings";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";

export const metadata = { title: "Checkout" };

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, catalog] = await Promise.all([
    getBusinessSettings(),
    getPublicConfiguratorCatalog().catch(() => null),
  ]);
  return (
    <main>
      <PageHero
        eyebrow="Checkout / Order review"
        title="Review, then confirm."
        description="Periksa kombinasi, isi data pemesan, unggah desain, lalu simpan order sebelum konfirmasi melalui WhatsApp."
      />
      <Container className="py-12 sm:py-20">
        <CheckoutOrderReview prices={catalog?.prices ?? null} settings={settings} />
      </Container>
    </main>
  );
}
