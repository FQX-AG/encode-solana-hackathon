import { useFormik } from "formik";
import { FormikConfig, FormikValues } from "formik/dist/types";
import { useEffect, useState } from "react";

export function useFormikWithLazyValidation<Values extends FormikValues = FormikValues>(
  config: Omit<FormikConfig<Values>, "validateOnBlur" | "validateOnChange" | "validateOnMount">
) {
  const [validate, setValidate] = useState(false);
  const formik = useFormik<Values>({
    validateOnChange: validate,
    validateOnBlur: validate,
    validateOnMount: false,
    ...config,
  });

  useEffect(() => {
    const validate = formik.submitCount > 0;
    setValidate(validate);
    if (validate) {
      setTimeout(() => {
        let target: [number, Element] | undefined;
        document.querySelectorAll("[data-error=true]").forEach((element) => {
          const elementTop = element.getBoundingClientRect().top;
          if (target === undefined || elementTop < target[0]) target = [elementTop, element];
        });
        if (target) target[1].scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [formik.submitCount]);

  return formik;
}
