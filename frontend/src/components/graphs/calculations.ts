import { Decimal } from "decimal.js";

export function rcPayoff(x: number, strike: number, coupon: number) {
  if (x < strike) return new Decimal(x).div(strike).plus(coupon).minus(1).toNumber();

  return coupon;
}

export function brcPayoff(x: number, barrier: number, coupon: number, isBroken: boolean) {
  if (x < barrier || (isBroken && x < 1)) return new Decimal(x).plus(coupon).minus(1).toNumber();

  return coupon;
}
