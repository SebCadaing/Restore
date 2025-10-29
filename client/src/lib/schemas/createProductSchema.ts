import { z } from "zod";

const fileSchema = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (val instanceof File && val.size > 0) return val;
    return undefined;
  },
  z
    .instanceof(File)
    .transform((file) => ({ ...file, preview: URL.createObjectURL(file) }))
    .optional()
);
export const createProductSchema = z
  .object({
    name: z.string().nonempty("Name is required"),
    description: z.string().nonempty("Description is required").min(10, { message: "Description must be at least 10 characters" }),
    price: z.coerce
      .number()
      .refine((val) => !isNaN(val), { message: "Price is required" })
      .min(100, { message: "Price must be at least ₱1.00" }),
    type: z.string().nonempty("Type is required"),
    brand: z.string().nonempty("Brand is required"),
    quantityInStock: z.coerce
      .number()
      .refine((val) => !isNaN(val), { message: "Quantity in Stock is required" })
      .min(1, "Quantity in Stock must be at least 1"),
    pictureURL: z.string().optional(),
    file: fileSchema.optional(),
  })
  .refine((data) => (data.pictureURL && data.pictureURL.trim() !== "") || !!data.file, {
    message: "Please provide an image",
    path: ["file"],
  });

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type FileWithPreview = File & { preview: string };
