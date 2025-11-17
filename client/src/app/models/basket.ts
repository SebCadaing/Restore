import type { Product } from "./product";

export type Basket = {
  items: Item[];
  clientSecret?: string;
  paymentIntentId?: string;
  coupon: Coupon | null;
};

export class Item {
  constructor(product: Product, quantity: number) {
    this.productId = product.id;
    this.name = product.name;
    this.price = product.price;
    this.type = product.type;
    this.pictureURL = product.pictureURL;
    this.brand = product.brand;
    this.quantity = quantity;
  }
  productId: number;
  name: string;
  type: string;
  price: number;
  pictureURL: string;
  brand: string;
  quantity: number;
}

export type Coupon = {
  name: string;
  amountOff?: number;
  percentOff?: number;
  promotionCode: string;
  couponId: string;
};
