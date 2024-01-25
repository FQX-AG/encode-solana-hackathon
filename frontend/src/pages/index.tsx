import { Button, Stack } from "@mui/material";
import { useFormikWithLazyValidation } from "@/hooks/useFormikWithLazyValidation";
import { FormValues, getInitialValues, validationSchema } from "@/schemas/newIssuance";
import { FormikProvider, Form } from "formik";
import { useReport } from "@/hooks/useReport";
import { useMemo } from "react";
import { NewIssuance1 } from "@/sections/NewIssuance1";
import { NewIssuance2 } from "@/sections/NewIssuance2";
import { ArrowForward } from "@mui/icons-material";

export default function Home() {
  const report = useReport();
  const initialValues = useMemo(() => getInitialValues(), []);
  const formik = useFormikWithLazyValidation<FormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (formValues) => {
      try {
        const values = await validationSchema.validate(formValues, { stripUnknown: true });
        console.log(values);

        report.success("Success!");
      } catch (err: unknown) {
        report.error(err);
      }
    },
  });

  return (
    <FormikProvider value={formik}>
      <Stack component={Form} spacing={6}>
        <NewIssuance1 />
        <NewIssuance2 />
        <Stack direction="row" justifyContent="end">
          <Button type="submit" size="medium" color="primary" variant="contained" endIcon={<ArrowForward />}>
            Request for quote
          </Button>
        </Stack>
      </Stack>
    </FormikProvider>
  );
}
