import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <Helmet>
        <title>Page not found — KOVA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="flex flex-1 items-center justify-center px-5 pt-32 pb-24 sm:px-8 sm:pt-36 sm:pb-28 lg:px-10">
        <div className="mx-auto max-w-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-terracotta">
            404
          </p>

          <h1 className="mt-5 font-serif text-[42px] leading-[0.98] tracking-[-0.03em] text-charcoal sm:text-[56px]">
            Page not found.
          </h1>

          <p className="mt-6 text-[13.5px] leading-[1.75] text-charcoal/55 sm:text-[14px]">
            The page you're looking for doesn't exist, or has been moved.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              to="/"
              className="inline-flex items-center px-7 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-cream transition-colors duration-300"
              style={{ backgroundColor: '#1A1A1A' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#C66B4F')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#1A1A1A')
              }
            >
              Back home
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center px-7 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-charcoal transition-colors duration-300"
              style={{ border: '1px solid #1A1A1A' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
                e.currentTarget.style.color = '#FBF9F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1A1A1A';
              }}
            >
              Shop all
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}