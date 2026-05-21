import dynamic from 'next/dynamic';

const HomePageClient = dynamic(
  () => import('@/components/HomePageClient'),
  { ssr: false, loading: () => null }
);

export default function Page() {
  return <HomePageClient />;
}
