import { CouponFrequency } from "@/constants";

export const isValidDate = (value: string | Date) => !Number.isNaN(new Date(value).valueOf());
export const couponFrequencyToAmount = (couponFrequency: CouponFrequency) => {
  switch (couponFrequency) {
    case CouponFrequency.DemoMode:
      return 2;
  }
};
