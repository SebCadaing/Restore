import { Grid, Typography } from "@mui/material";
import { useFetchFiltersQuery, useFetchProductsQuery } from "./catalogAPI";
import ProductList from "./ProductList";
import Filters from "./Filters";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import AppPagination from "../../app/shared/components/AppPagination";
import { setPageNumber } from "./catalogSlice";

export default function Catalog() {
  const productParams = useAppSelector((state) => state.catalog);
  const { data, isLoading } = useFetchProductsQuery(productParams);
  const { data: filterrsData, isLoading: filtersLoading } = useFetchFiltersQuery();
  const dispatch = useAppDispatch();
  if (isLoading || !data || filtersLoading || !filterrsData) return <div>loading...</div>;

  return (
    <Grid container spacing={4}>
      <Grid size={3}>
        <Filters filtersData={filterrsData} />
      </Grid>
      <Grid size={9}>
        {data.items && data.items.length > 0 ? (
          <>
            <ProductList products={data.items} />
            <AppPagination
              metadata={data.pagination}
              onPageChange={(page: number) => {
                dispatch(setPageNumber(page));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        ) : (
          <Typography variant="h5">There are no result</Typography>
        )}
      </Grid>
    </Grid>
  );
}
