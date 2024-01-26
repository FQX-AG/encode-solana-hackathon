import * as flags from "country-flag-icons/react/3x2";
import { FunctionComponent } from "react";

type FlagProps = {
  code: string;
};

export function Flag(props: FlagProps) {
  const Component = (flags as unknown as Record<string, FunctionComponent<{ height: number }>>)[props.code];
  return Component ? <Component height={20} /> : null;
}
