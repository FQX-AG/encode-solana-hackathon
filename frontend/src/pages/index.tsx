import { Section } from "@/components/Section";
import { Panel } from "@/components/Panel";
import { WithSideContent } from "@/components/WithSideContent";
import { Box, Button, InputAdornment, Stack } from "@mui/material";
import {
  STRUCTURED_PRODUCT_TYPE_NAMES,
  STRUCTURED_PRODUCT_ASSET_NAMES,
  PRINCIPAL_OPTIONS,
  Currencies,
  StructuredProductType,
  STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES,
  COUPON_FREQUENCY_OPTIONS,
  CouponFrequency,
} from "@/constants";
import { SelectField } from "@/components/form/SelectField";
import { DateTimeField } from "@/components/form/DateTimeField";
import { useFormikWithLazyValidation } from "@/hooks/useFormikWithLazyValidation";
import { FormValues, initialValues, validationSchema } from "@/schemas/newIssuance";
import { FormikProvider, Form } from "formik";
import { NumericField } from "@/components/form/NumericField";
import { couponFrequencyToAmount } from "@/utils";

export default function Home() {
  const formik = useFormikWithLazyValidation<FormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (formValues) => {
      const values = await validationSchema.validate(formValues, { stripUnknown: true });
      console.log(values);
    },
  });

  return (
    <FormikProvider value={formik}>
      <Form>
        <Section title="Create a request..." description="Enter the details for creating your issuance program.">
          <Panel spacing={3}>
            <WithSideContent side={<WithSideContent.Side asterisk>Type</WithSideContent.Side>}>
              <SelectField
                name="type"
                id="type"
                label="Type"
                options={Object.entries(STRUCTURED_PRODUCT_TYPE_NAMES)}
                sx={{ width: "384px" }}
              />
            </WithSideContent>
            <WithSideContent side={<WithSideContent.Side asterisk>Underlying asset</WithSideContent.Side>}>
              <SelectField
                name="underlyingAsset"
                id="underlyingAsset"
                label="Underlying asset"
                options={Object.entries(STRUCTURED_PRODUCT_ASSET_NAMES)}
                sx={{ width: "384px" }}
              />
            </WithSideContent>
            {formik.values.type === StructuredProductType.CPN && (
              <WithSideContent side={<WithSideContent.Side asterisk>Capital protection</WithSideContent.Side>}>
                <NumericField
                  name="cpnDetails.level"
                  id="cpnDetails.level"
                  label="Capital protection Level"
                  sx={{ width: "160px" }}
                  hasFixedDecimalScale={true}
                  endAdornment={
                    <InputAdornment
                      position="end"
                      disableTypography
                      sx={{ color: (theme) => theme.customColors.oxfordBlue500 }}
                    >
                      %
                    </InputAdornment>
                  }
                />
              </WithSideContent>
            )}
            {formik.values.type === StructuredProductType.RC && (
              <WithSideContent side={<WithSideContent.Side asterisk>Strike</WithSideContent.Side>}>
                <NumericField
                  name="rcDetails.strike"
                  id="rcDetails.strike"
                  label="Strike"
                  sx={{ width: "160px" }}
                  hasFixedDecimalScale={true}
                  endAdornment={
                    <InputAdornment
                      position="end"
                      disableTypography
                      sx={{ color: (theme) => theme.customColors.oxfordBlue500 }}
                    >
                      %
                    </InputAdornment>
                  }
                />
              </WithSideContent>
            )}
            {formik.values.type === StructuredProductType.BRC && (
              <WithSideContent side={<WithSideContent.Side asterisk>Barrier</WithSideContent.Side>}>
                <Stack useFlexGap direction="row" alignItems="center" spacing={3}>
                  <NumericField
                    name="brcDetails.level"
                    id="brcDetails.level"
                    label="Barrier level"
                    sx={{ width: "160px" }}
                    hasFixedDecimalScale={true}
                    endAdornment={
                      <InputAdornment
                        position="end"
                        disableTypography
                        sx={{ color: (theme) => theme.customColors.oxfordBlue500 }}
                      >
                        %
                      </InputAdornment>
                    }
                  />
                  <SelectField
                    name="brcDetails.type"
                    id="brcDetails.type"
                    label="Barrier type"
                    options={Object.entries(STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES)}
                    sx={{ width: "200px" }}
                  />
                </Stack>
              </WithSideContent>
            )}
            <WithSideContent side={<WithSideContent.Side>Principal</WithSideContent.Side>}>
              <Stack useFlexGap direction="row" spacing={3} flexWrap="wrap">
                <SelectField
                  name="currency"
                  id="currency"
                  label="Currency"
                  options={Object.entries(Currencies)}
                  sx={{ width: "130px" }}
                />
                <NumericField
                  name="totalIssuanceAmount"
                  id="totalIssuanceAmount"
                  label="Target issuance amount"
                  sx={{ width: "230px" }}
                />
                <SelectField
                  name="principal"
                  id="principal"
                  label="eNote denomination"
                  options={PRINCIPAL_OPTIONS}
                  sx={{ width: "230px" }}
                />
              </Stack>
            </WithSideContent>
            <WithSideContent side={<WithSideContent.Side>Maturity date</WithSideContent.Side>}>
              <DateTimeField name="maturityDate" id="maturityDate" label="Maturity date" sx={{ width: "384px" }} />
            </WithSideContent>
            <WithSideContent side={<WithSideContent.Side>Coupon</WithSideContent.Side>}>
              <SelectField
                name="couponFrequency"
                id="couponFrequency"
                label="Coupon frequency"
                options={Object.entries(COUPON_FREQUENCY_OPTIONS)}
                sx={{ width: "384px" }}
                renderValue={(value) => (
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box component="span">{COUPON_FREQUENCY_OPTIONS[value as CouponFrequency]}</Box>{" "}
                    <Box component="span" sx={{ color: (theme) => theme.customColors.oxfordBlue600 }}>
                      {couponFrequencyToAmount(value as CouponFrequency)} times
                    </Box>
                  </Stack>
                )}
              />
            </WithSideContent>
            <WithSideContent side={null}>
              <Button type="submit" size="medium" color="primary" variant="contained">
                Submit
              </Button>
            </WithSideContent>
          </Panel>
        </Section>
      </Form>
    </FormikProvider>
  );
}
