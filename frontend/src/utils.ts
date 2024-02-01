import { CouponFrequency } from "@/constants";

export function ensure<T>(value: T | undefined | null, error: string): T {
  if (value === undefined || value === null) throw new Error(error);

  return value;
}
export const isValidDate = (value: string | Date) => !Number.isNaN(new Date(value).valueOf());
export const couponFrequencyToAmount = (couponFrequency: CouponFrequency) => {
  switch (couponFrequency) {
    case CouponFrequency.DemoMode:
      return 2;
  }
};
