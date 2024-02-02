import { useState } from "react";
import { Values } from "@/schemas/newIssuance";
import { DeploymentInfo } from "@/types";
import dynamic from "next/dynamic";

type State = { step: 1 } | { step: 2; values: Values; deploymentInfo: DeploymentInfo };

const DynamicRequest1 = dynamic(() => import("@/views/Request1"), {
  loading: () => null,
  ssr: false,
});

const DynamicRequest2 = dynamic(() => import("@/views/Request2"), {
  loading: () => null,
  ssr: false,
});

export default function Page() {
  const [state, setState] = useState<State>({ step: 1 });

  switch (state.step) {
    case 1:
      return <DynamicRequest1 onNext={({ values, deploymentInfo }) => setState({ step: 2, values, deploymentInfo })} />;
    case 2:
      return <DynamicRequest2 values={state.values} deploymentInfo={state.deploymentInfo} />;
    default:
      throw new Error("Invalid application state");
  }
}
