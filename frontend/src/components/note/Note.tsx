import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import React from "react";
import {
  STRUCTURED_PRODUCT_ASSET_NAMES,
  STRUCTURED_PRODUCT_TYPE_NAMES,
  StructuredProductType,
  StructuredProductUnderlyingAsset,
} from "@/constants";
import { Text } from "@/components/Text";
import { NoteValue } from "./NoteValue";
import { formatDateUTC, formatDecimal, formatPercentage } from "@/formatters";
import { NoteQrCode } from "@/components/note/NoteQrCode";
import { NoteAgreementLink } from "@/components/note/NoteAgreementLink";
import { NoteBackground } from "@/components/note/NoteBackground";

const Root = styled("div")({
  overflow: "auto hidden",
  borderRadius: "10px",
  border: "2px solid #272754",
  boxShadow: "0px -1px 4px 10px rgba(23, 23, 72, 0.64)",
});

const Main = styled("div")((props) => ({
  display: "grid",
  rowGap: "9px",
  columnGap: "80px",
  gridAutoRows: "minmax(50px, auto)",
  gridAutoColumns: "min-content",
  gridTemplateColumns: "1fr 1fr",
  gridTemplateAreas: `"a1 a2 a3" "b1 b2 b3" "c1 c2 c3" "d1 d2 d3"`,

  [props.theme.breakpoints.down("lg")]: {
    gridTemplateAreas: "none",
    "> *": {
      gridArea: "auto!important",
    },
  },
}));

type NoteProps = {
  issuer: string;
  maturityDate: Date | string;
  currency: string;
  principal: number;
  coupon: number;
  interestRate: number;
  name: string | undefined;
  issuanceDate: Date | string;
  signature?: { signer: string; date: Date | string };
  address?: string;
  registrationAgreementUrl: string | undefined;
  couponPaymentFrequency?: string;
  couponPaymentAmount?: number;
  structuredNote?: {
    type?: StructuredProductType | null;
    underlyingAsset?: StructuredProductUnderlyingAsset | null;
  };
};

const Note = (props: NoteProps) => {
  const left = (
    <Box>
      <Stack useFlexGap flex="1 1 auto" spacing={1} mb={6}>
        <Box sx={{ lineHeight: "normal" }}>
          <Text variant="600|24px|31px" component="span" sx={{ mr: 1 }}>
            {props.issuer}
          </Text>
          <Text variant="400|14px|18px" component="span" color="oxfordBlue500" sx={{ display: "inline-block" }}>
            Swiss ledger-based security
          </Text>
        </Box>
        <Text variant="500|16px|21px">{props.name && <span>{props.name}</span>}</Text>
      </Stack>
      <Main sx={{ flex: "0 0 auto" }}>
        <NoteValue
          sx={{ gridArea: "a1" }}
          label="Principal"
          value={`${props.currency} ${formatDecimal(props.principal)}`}
        />
        <NoteValue
          sx={{ gridArea: "a2" }}
          label="Total interest"
          value={`${props.currency} ${formatDecimal(props.coupon)}`}
          valueSuffix={
            <Text variant="400|14px|18px" color="oxfordBlue500" component="span">
              ({formatPercentage(props.interestRate)} coupon rate)
            </Text>
          }
        />
        {props.couponPaymentFrequency && (
          <NoteValue
            data-private
            sx={{ gridArea: "b1" }}
            label="Coupon frequency"
            value={props.couponPaymentFrequency}
          />
        )}
        {props.couponPaymentAmount && (
          <NoteValue
            data-private
            sx={{ gridArea: "b2" }}
            label="Coupon payment amount"
            value={`${props.currency} ${formatDecimal(props.couponPaymentAmount)}`}
            valueSuffix={
              props.couponPaymentFrequency ? (
                <Text variant="400|14px|18px" color="oxfordBlue500" component="span">
                  ({props.couponPaymentFrequency})
                </Text>
              ) : undefined
            }
          />
        )}
        {props.structuredNote?.type && (
          <NoteValue
            sx={{ gridArea: "b3" }}
            label="Product type"
            value={STRUCTURED_PRODUCT_TYPE_NAMES[props.structuredNote.type]}
          />
        )}
        <NoteValue
          sx={{ gridArea: "c1" }}
          label="Issuance date"
          value={formatDateUTC(props.issuanceDate, false, false)}
          valueSuffix={
            <Text variant="400|14px|18px" component="span" color="oxfordBlue500">
              (UTC)
            </Text>
          }
        />
        <NoteValue
          sx={{ gridArea: "c2" }}
          label="Maturity date"
          value={formatDateUTC(props.maturityDate, false, false)}
          valueSuffix={
            <Text variant="400|14px|18px" component="span" color="oxfordBlue500">
              (UTC)
            </Text>
          }
        />
        {props.structuredNote?.underlyingAsset && (
          <NoteValue
            sx={{ gridArea: "c3" }}
            label="Underlying asset"
            value={STRUCTURED_PRODUCT_ASSET_NAMES[props.structuredNote.underlyingAsset]}
          />
        )}
        {props.signature && (
          <NoteValue
            data-private
            sx={{ gridArea: "d1" }}
            label="Signature"
            value={props.signature.signer}
            valueSuffix={
              <>
                <Text variant="400|14px|18px" component="span" color="oxfordBlue500">
                  {formatDateUTC(props.signature.date, false)}
                </Text>{" "}
                <Text variant="400|14px|18px" component="span" color="oxfordBlue500">
                  (UTC)
                </Text>
              </>
            }
          />
        )}
      </Main>
    </Box>
  );

  const right = (
    <Stack useFlexGap flex="0 0 auto" spacing={4} alignItems="flex-end" justifyContent="flex-end" textAlign="end">
      <Box flex="0 0 auto" mb="auto">
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: "22px",
            lineHeight: "normal",
            mr: 1,
          }}
        >
          {"eNote™ by"}
        </Box>
        <Image
          src="/obligate-word-mark-light.png"
          alt="Obligate.com"
          width={90}
          height={21}
          style={{ verticalAlign: "middle" }}
        />
      </Box>
      {props.address && <NoteQrCode address={props.address} />}
      <Stack flex="0 0 auto" useFlexGap spacing={1} alignItems="flex-end">
        {props.registrationAgreementUrl !== undefined && (
          <NoteAgreementLink href={props.registrationAgreementUrl} label="Registration agreement" />
        )}
      </Stack>
    </Stack>
  );

  return (
    <Root>
      <Stack
        useFlexGap
        direction="row"
        justifyContent="space-between"
        spacing={4}
        px={4.5}
        pt={4.5}
        pb={8}
        width="max-content"
        minWidth="100%"
        position="relative"
      >
        <NoteBackground />
        {left}
        {right}
      </Stack>
    </Root>
  );
};

export default Note;
