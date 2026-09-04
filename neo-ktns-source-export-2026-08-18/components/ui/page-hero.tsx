import { Container } from "@/components/ui/container";

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="border-b border-[var(--border)] py-14 sm:py-20 lg:py-24">
      <Container>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="editorial text-balance mt-5 max-w-4xl text-5xl font-semibold leading-[.92] sm:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted">{description}</p>
      </Container>
    </section>
  );
}
