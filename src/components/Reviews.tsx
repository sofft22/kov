import { useEffect, useState } from 'react';
import { fetchTopApprovedReviews, type TopReview } from '../lib/store';
import type { Product } from '../types';

interface Props {
  products: Product[];
  onOpenProduct: (p: Product) => void;
}

const CREAM = '#FBF9F5';
const TERRACOTTA = '#C66B4F';

export function Reviews({ products, onOpenProduct }: Props) {
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTopApprovedReviews(3);
      setReviews(data);
      setLoading(false);
    };
    load();
  }, []);

  // Don't render the section at all if there's nothing to show
  if (loading || reviews.length === 0) return null;

  const handleClick = (review: TopReview) => {
    const product = products.find((p) => p.id === review.product_id);
    if (product) onOpenProduct(product);
  };

  return (
    <section
      id="reviews"
      className="scroll-mt-24 bg-charcoal text-cream"
      style={{ borderTop: '1px solid rgba(251,249,245,0.1)' }}
    >
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        {/* Small header */}
        <p
          className="mb-12 text-[10px] font-bold uppercase tracking-[0.32em] sm:mb-14"
          style={{ color: TERRACOTTA }}
        >
          Recent reviews
        </p>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-14">
          {reviews.map((r) => {
            const product = products.find((p) => p.id === r.product_id);
            return (
              <button
                key={r.id}
                onClick={() => handleClick(r)}
                className="group flex flex-col text-left transition-colors duration-300"
              >
                {/* Stars */}
                <div
                  className="text-[11px] tracking-[0.14em]"
                  style={{ color: TERRACOTTA }}
                >
                  {'★'.repeat(r.rating)}
                  <span style={{ color: 'rgba(251,249,245,0.15)' }}>
                    {'★'.repeat(5 - r.rating)}
                  </span>
                </div>

                {/* Quote */}
                <p className="mt-5 flex-1 font-serif text-[18px] leading-[1.5] tracking-[-0.01em] text-cream sm:text-[20px] sm:leading-[1.45]">
                  "{r.comment}"
                </p>

                {/* Reviewer + product */}
                <div className="mt-6">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-cream">
                    {r.customer_name}
                  </p>
                  <p
                    className="mt-1 text-[10.5px] uppercase tracking-[0.14em]"
                    style={{ color: 'rgba(251,249,245,0.5)' }}
                  >
                    {r.product_name}
                  </p>
                </div>

                {/* CTA */}
                {product && (
                  <span
                    className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-[#C66B4F]"
                    style={{ color: 'rgba(251,249,245,0.55)' }}
                  >
                    View product
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}