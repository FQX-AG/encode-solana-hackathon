import React, { CSSProperties, forwardRef } from "react";

type LegendItem = {
  line: string;
  text: string;
};

type LegendRowProps = LegendItem;

function LegendRow(props: LegendRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        alignSelf: "stretch",
      }}
    >
      <div style={{ width: "24px", borderTop: props.line }} />
      <div
        style={{
          color: "#FFF",
          textAlign: "center",
          fontFeatureSettings: "'clig' off, 'liga' off",
          fontFamily: "Matter SQ",
          fontSize: "12px",
          fontStyle: "normal",
          fontWeight: 400,
          lineHeight: "normal",
        }}
      >
        {props.text}
      </div>
    </div>
  );
}

type LegendProps = {
  items: LegendItem[];
  style?: CSSProperties;
};

const Legend = forwardRef<HTMLDivElement, LegendProps>((props, ref) => {
  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        width: "fit-content",
        padding: "16px",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        borderRadius: "8px",
        border: "1px solid #5B5B98",
        ...props.style,
      }}
    >
      {props.items.map((item, index) => (
        <LegendRow key={index} line={item.line} text={item.text} />
      ))}
    </div>
  );
});
Legend.displayName = "Legend";

export default Legend;
