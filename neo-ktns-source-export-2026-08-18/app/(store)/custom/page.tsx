import { CustomBuilder } from "@/components/product/custom-builder";
import { ProductSupportInfo } from "@/components/product/product-support-info";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getPublicConfiguratorCatalog } from "@/lib/storefront/catalog";
import { getBusinessSettings } from "@/lib/business-settings";

export const metadata = { title: "Start Custom" };
export const dynamic = "force-dynamic";

export default async function CustomPage() {
  const settings = await getBusinessSettings();
  let catalog;
  try {
    catalog = await getPublicConfiguratorCatalog();
  } catch {
    catalog = null;
  }
  const publicSizes = catalog?.sizes.filter((size) => size.public) ?? [];
  const ready = Boolean(catalog && catalog.colors.length && publicSizes.length && catalog.packages.length && Object.keys(catalog.prices).length);

  return (
    <main>
      <PageHero eyebrow="Configurator / Product 01" title="Build your essentials." description="Buat beberapa kombinasi warna, ukuran, posisi bordir, dan jumlah dalam satu order draft. Paket serta harga ditentukan otomatis dari posisi yang valid." />
      <Container className="py-12 sm:py-20">{ready && catalog ? <CustomBuilder catalog={catalog} /> : <div className="surface mx-auto max-w-2xl rounded-[var(--radius-lg)] p-7 text-center sm:p-10"><p className="eyebrow">Configurator unavailable</p><h2 className="editorial mt-4 text-3xl">Pilihan custom sedang diperbarui.</h2><p className="mt-4 text-sm leading-7 text-muted">Muat ulang halaman atau coba beberapa saat lagi. Kami tidak akan menampilkan harga atau pilihan yang belum dapat diverifikasi.</p></div>}</Container>
      <ProductSupportInfo productionDays={settings.productionDaysMin} minimumDpPercentage={settings.minimumDpPercentage} returnPolicy={settings.returnPolicyShort} />
    </main>
  );
}
