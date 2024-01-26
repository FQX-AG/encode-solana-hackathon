import React, { CSSProperties, ReactNode, forwardRef } from "react";

type LabelProps = {
  children: ReactNode;
  style?: CSSProperties;
};

const Label = forwardRef<HTMLDivElement, LabelProps>((props, ref) => {
  return (
    <div
      ref={ref}
      style={{
        color: "var(--FQX-oxford-blue-500, #A2A2DC)",
        fontFeatureSettings: "'clig' off, 'liga' off",
        fontFamily: "Matter SQ",
        fontSize: "14px",
        fontStyle: "normal",
        fontWeight: 500,
        lineHeight: "normal",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
});
Label.displayName = "Label";

export default Label;
