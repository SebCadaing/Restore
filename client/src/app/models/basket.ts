import type { Product } from "./product";

export type Basket = {
  basketId: string;
  items: Item[];
  clientSecret?: string;
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
