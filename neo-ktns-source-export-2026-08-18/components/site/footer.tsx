import Link from "next/link";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12 sm:py-16" data-site-footer>
      <Container className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em]">NEO KTNS</p>
          <p className="editorial mt-4 text-4xl sm:text-5xl">Precision, stitched.</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted">Polo bordir premium untuk identitas yang dirancang bersama dan dikenakan dengan bangga.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-6 gap-y-4 text-sm text-muted">
          <Link href="/collection">Collection</Link>
          <Link href="/how-to-custom">How to Custom</Link>
          <Link href="/size-guide">Size Guide</Link>
          <Link href="/track-order">Track Order</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/admin/login">Admin</Link>
        </nav>
      </Container>
      <Container className="mt-10 border-t border-[var(--border)] pt-5 text-xs text-muted">© {new Date().getFullYear()} Neo KTNS. Custom made with intention.</Container>
    </footer>
  );
}
