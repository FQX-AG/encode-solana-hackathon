import { useState } from "react";
import { Values } from "@/schemas/issuanceForm";
import { DeploymentInfo } from "@/types";
import dynamic from "next/dynamic";

type State = { step: 1 } | { step: 2; values: Values; deploymentInfo: DeploymentInfo };

const IssuanceForm = dynamic(() => import("@/views/IssuanceForm"), {
  loading: () => null,
  ssr: false,
});

const Quotes = dynamic(() => import("@/views/Quotes"), {
  loading: () => null,
  ssr: false,
});

export default function Page() {
  const [state, setState] = useState<State>({ step: 1 });

  switch (state.step) {
    case 1:
      return <IssuanceForm onNext={({ values, deploymentInfo }) => setState({ step: 2, values, deploymentInfo })} />;
    case 2:
      return <Quotes values={state.values} deploymentInfo={state.deploymentInfo} />;
    default:
      throw new Error("Invalid application state");
  }
}
