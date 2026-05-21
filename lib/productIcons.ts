import {
  Drop,
  Bathtub,
  Shower,
  Toilet,
  Package,
  Wrench,
  Pipe,
} from "@phosphor-icons/react/dist/ssr";
import type { ProductType } from "./types";

export type PhosphorIcon = typeof Drop;

export const productIcon: Record<ProductType, PhosphorIcon> = {
  umyvadlove_baterie: Drop,
  vanove_baterie: Bathtub,
  sprchove_sety: Shower,
  hlavove_sprchy: Shower,
  podomitkove_moduly: Wrench,
  vany: Bathtub,
  wc: Toilet,
  doplnky: Package,
  kuchynske_baterie: Pipe,
  bidetove_baterie: Drop,
  sprchove_kanaly: Pipe,
  ostatni: Package,
};
