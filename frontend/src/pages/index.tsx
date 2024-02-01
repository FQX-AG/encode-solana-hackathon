import { useState } from "react";
import { Values } from "@/schemas/newIssuance";
import { DeploymentInfo, QuoteInfo } from "@/types";
import dynamic from "next/dynamic";
import { PublicKey } from "@solana/web3.js";

type State =
  | { step: 1 }
  | { step: 2; values: Values; deploymentInfo: DeploymentInfo }
  | {
      step: 3;
      values: Values;
      deploymentInfo: DeploymentInfo;
      issuanceDate: Date;
      quote: QuoteInfo;
      investorATA: PublicKey;
    };

const DynamicRequest1 = dynamic(() => import("@/views/Request1"), {
  loading: () => null,
  ssr: false,
});

const DynamicRequest2 = dynamic(() => import("@/views/Request2"), {
  loading: () => null,
  ssr: false,
});

const DynamicRequest3 = dynamic(() => import("@/views/Request3"), {
  loading: () => null,
  ssr: false,
});

export default function Page() {
  const [state, setState] = useState<State>({ step: 1 });

  switch (state.step) {
    case 1:
      return <DynamicRequest1 onNext={({ values, deploymentInfo }) => setState({ step: 2, values, deploymentInfo })} />;
    case 2:
      return (
        <DynamicRequest2
          values={state.values}
          deploymentInfo={state.deploymentInfo}
          onNext={({ values, deploymentInfo, issuanceDate, quote, investorATA }) =>
            setState({ step: 3, values, deploymentInfo, issuanceDate, quote, investorATA })
          }
        />
      );
    case 3:
      return (
        <DynamicRequest3
          values={state.values}
          deploymentInfo={state.deploymentInfo}
          issuanceDate={state.issuanceDate}
          quote={state.quote}
          investorATA={state.investorATA}
        />
      );
    default:
      throw new Error("Invalid application state");
  }
}
