import { testimonials } from '@/data/testimonials';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';

export function Testimonials() {
  return (
    <section
      className="border-y border-mist bg-[#F2EEE6] py-20 sm:py-28"
      aria-labelledby="testimonials-title"
    >
      <Container>
        <Reveal>
          <SectionHeading
            kicker="לקוחות"
            title={<span id="testimonials-title">מה נשאר להן אחרי</span>}
          />
        </Reveal>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, i) => (
            <li key={testimonial.id}>
              <Reveal delay={i * 0.06}>
                <figure className="h-full border-t border-gold/40 pt-6">
                  <blockquote className="leading-relaxed text-charcoal/85">
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-5 text-sm text-stone">
                    <span className="text-charcoal">{testimonial.name}</span>
                    <span className="mx-2 text-mist">·</span>
                    {testimonial.context}
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
