import { useFetchProductsQuery } from "./catalogAPI";
import ProductList from "./ProductList";

export default function Catalog() {
  const { data, isLoading } = useFetchProductsQuery();
  if (isLoading || !data) return <div>loading...</div>;

  return (
    <>
      <ProductList products={data} />
    </>
  );
}
