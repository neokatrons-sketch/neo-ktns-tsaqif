import { Container } from "@/components/ui/container";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { PageHero } from "@/components/ui/page-hero";
import { faqItems } from "@/lib/catalog";
import { getBusinessSettings } from "@/lib/business-settings";

export const metadata = { title: "FAQ" };

const more = [{ question: "Bahan apa yang digunakan?", answer: "Premium Piqué 24s dengan bobot sekitar 200–220 gsm dan karakter medium hingga tebal." }, { question: "Bagaimana proses revisi desain?", answer: "Revisi minor gratis sebelum persetujuan desain. Perubahan besar setelah desain disetujui dapat memengaruhi waktu dan biaya." }, { question: "Apakah pesanan custom bisa dibatalkan?", answer: "Pesanan tidak dapat dibatalkan setelah checkout. Produk custom juga tidak dapat dikembalikan kecuali terdapat cacat atau kesalahan produksi." }];

export const dynamic = "force-dynamic";

export default async function FaqPage() { const settings = await getBusinessSettings(); const items = faqItems.map((item) => item.question === "Berapa lama pengerjaannya?" ? { ...item, answer: `Waktu produksi minimum ${settings.productionDaysMin} hari setelah desain dan pembayaran dikonfirmasi. Jumlah besar atau revisi besar dapat memengaruhi jadwal.` } : item.question === "Apakah ada garansi jika produk cacat?" ? { ...item, answer: settings.returnPolicyShort } : item); const extended = more.map((item) => item.question === "Apakah pesanan custom bisa dibatalkan?" ? { ...item, answer: settings.returnPolicyShort } : item); return <main><PageHero eyebrow="Frequently asked" title="Clear answers, before production." description="Informasi penting mengenai produk, custom, pembayaran, dan pengerjaan." /><Container className="py-16 sm:py-24"><div className="mx-auto max-w-3xl"><FaqAccordion items={[...items, ...extended]} /></div></Container></main>; }
