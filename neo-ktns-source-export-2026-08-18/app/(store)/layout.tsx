import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { OrderBuilderProvider } from "@/components/order/order-builder-provider";

export default function StoreLayout({ children }: React.PropsWithChildren) {
  return <OrderBuilderProvider><a className="skip-link" href="#main-content">Lewati ke konten utama</a><Header /><div id="main-content" tabIndex={-1}>{children}</div><Footer /></OrderBuilderProvider>;
}
