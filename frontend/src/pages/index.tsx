import Text from "@/components/Text";

export default function Home() {
  return (
    <Text
      variant="600|64px|83px"
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      Hello world
    </Text>
  );
}
