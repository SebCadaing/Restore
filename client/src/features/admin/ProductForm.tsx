import { useForm, type FieldValues } from "react-hook-form";
import { createProductSchema, type CreateProductSchema, type FileWithPreview } from "../../lib/schemas/createProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import AppTextInput from "../../app/shared/components/AppTextInput";
import { useFetchFiltersQuery } from "../catalog/catalogAPI";
import AppSelectInpput from "../../app/shared/components/AppSelectInput";
import AppDropzone from "../../app/shared/components/AppDropzone";
import type { Product } from "../../app/models/product";
import { useEffect } from "react";
import { useCreateProductMutation, useUpdateProductMutation } from "./adminApi";
import { handleApiError } from "../../lib/util";

type Props = {
  setEditMode: (value: boolean) => void;
  product: Product | null;
  refetch: () => void;
  setSelectedProduct: (value: Product | null) => void;
};

export default function ProductForm({ setEditMode, product, refetch, setSelectedProduct }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm({
    mode: "onTouched",
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      brand: "",
      type: "",
      description: "",
      price: 0,
      quantityInStock: 0,
      pictureURL: product?.pictureURL || "",
      file: undefined,
    },
  });
  const watchFile = watch("file") as FileWithPreview | undefined;
  const { data } = useFetchFiltersQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  useEffect(() => {
    if (product) reset(product);

    return () => {
      if (watchFile) URL.revokeObjectURL(watchFile.preview);
    };
  }, [product, reset, watchFile]);

  const createFormData = (items: FieldValues) => {
    const formData = new FormData();
    for (const key in items) {
      formData.append(key, items[key]);
    }
    return formData;
  };

  const onSubmit = async (data: CreateProductSchema) => {
    try {
      const formData = createFormData(data);
      if (watchFile) formData.append("file", watchFile);
      if (product) await updateProduct({ id: product.id, data: formData }).unwrap();
      else await createProduct(formData).unwrap();
      setEditMode(false);
      setSelectedProduct(null);
      refetch();
    } catch (error) {
      console.log(error);
      handleApiError<CreateProductSchema>(error, setError, [
        "brand",
        "description",
        "file",
        "name",
        "pictureURL",
        "price",
        "quantityInStock",
        "type",
      ]);
    }
  };

  return (
    <Box component={Paper} sx={{ p: 4, maxWidth: "lg", mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Product Details
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <AppTextInput control={control} name="name" label="Product Name" />
          </Grid>
          <Grid size={6}>{data?.brands && <AppSelectInpput control={control} name="brand" label="Brand" items={data.brands} />}</Grid>
          <Grid size={6}>{data?.types && <AppSelectInpput control={control} name="type" label="Type" items={data.types} />}</Grid>

          <Grid size={6}>
            <AppTextInput type="number" control={control} name="price" label="Price in cents" />
          </Grid>
          <Grid size={6}>
            <AppTextInput type="number" control={control} name="quantityInStock" label="Quantity In Stock" />
          </Grid>
          <Grid size={12}>
            <AppTextInput control={control} multiline rows={4} name="description" label="Description" />
          </Grid>
          <Grid size={12} display="flex" justifyContent="space-between" alignItems="center">
            <AppDropzone name="file" control={control} />
            {watchFile?.preview ? (
              <img src={watchFile.preview} alt="preview" style={{ maxHeight: 200 }} />
            ) : product?.pictureURL ? (
              <img src={product?.pictureURL} alt={product?.name} style={{ maxHeight: 200 }} />
            ) : null}
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button onClick={() => setEditMode(false)} variant="contained" color="inherit">
            Cancel
          </Button>
          <Button loading={isSubmitting} variant="contained" color="success" type="submit">
            Submit
          </Button>
        </Box>
      </form>
    </Box>
  );
}
