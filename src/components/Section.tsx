// components/Section.tsx
import Link from 'next/link';

interface SectionProps {
  title: string;
  viewAllLink: string;
  children: React.ReactNode;
}

const Section = ({ title, viewAllLink, children }: SectionProps) => {
  return (
    <section className="w-full mx-auto mb-12">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-3">
          {title}
        </h2>
        <Link href={viewAllLink} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      {children}
    </section>
  );
};

export default Section;