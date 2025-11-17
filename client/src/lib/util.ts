import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { Order, PaymentSummary, ShippingAddress } from "../app/models/Order";
import type { Item } from "../app/models/basket";

export function currencyFormat(amount: number) {
  return "$" + (amount / 100).toFixed(2);
}

export function filterEmptyValues(values: object) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== "" && value !== null && value !== undefined && value.length !== 0)
  );
}

export const formatAddressString = (address?: ShippingAddress) => {
  if (!address) return "Address unavailable";

  return `${address.name ?? ""}, ${address.line1 ?? ""}, ${address.city ?? ""}, ${address.state ?? ""}, ${address.postal_code ?? ""}, ${
    address.country ?? ""
  }`;
};

export function mapOrderToItems(order: Order): Item[] {
  return order.orderItems.map((oi) => ({
    productId: oi.productId,
    name: oi.name,
    type: "",
    price: oi.price,
    pictureURL: oi.pictureUrl,
    brand: "",
    quantity: oi.quantity,
  }));
}

export const formatPaymentString = (card?: PaymentSummary) => {
  if (!card) return "Payment info unavailable";

  return `${card.brand ?? "Unknown"}, **** **** **** ${card.last4 ?? "XXXX"}, Exp: ${card.exp_month ?? "XX"}/${card.exp_year ?? "XX"}`;
};

export function handleApiError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fieldNames: Path<T>[]) {
  const apiError = (error as { message: string }) || {};

  if (apiError.message && typeof apiError.message === "string") {
    const errorArray = apiError.message.split(",");

    errorArray.forEach((e) => {
      const matchedField = fieldNames.find((fieldName) => e.toLocaleLowerCase().includes(fieldName.toString().toLocaleLowerCase()));

      if (matchedField) setError(matchedField, { message: e.trim() });
    });
  }
}
