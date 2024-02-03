import { QRCodeSVG } from "qrcode.react";
import * as React from "react";

type QrCodeProps = {
  value: string;
  size: number;
};

export function QrCode(props: QrCodeProps) {
  return (
    <>
      <svg width="0" height="0" style={{ visibility: "hidden" }}>
        <defs>
          <linearGradient id="fqx-qr-code-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7cc1cb" />
            <stop offset="33.33%" stopColor="#6ca6c4" />
            <stop offset="100%" stopColor="#855ac8" />
          </linearGradient>
        </defs>
        <rect fill="url(#0)" height="100%" width="100%" />
      </svg>
      <QRCodeSVG fgColor="url(#fqx-qr-code-gradient)" bgColor="transparent" {...props} />
    </>
  );
}
