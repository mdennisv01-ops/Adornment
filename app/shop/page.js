import ShopView from './shop-view';
export default async function Shop({ searchParams }) {
  const params = await searchParams;
  return <ShopView category={params?.category || 'All pieces'} query={params?.q || ''} sort={params?.sort || 'featured'} />;
}
