import { styled } from "@mui/material/styles";

const Background = styled("div")({
  position: "absolute",
  inset: 0,
  zIndex: -1,
  background:
    "linear-gradient(270.42deg, rgba(39, 39, 56, 0.2) 17.17%, rgba(74, 74, 126, 0.2) 42.69%, rgba(27, 27, 53, 0.2) 67.2%), linear-gradient(226.03deg, rgba(22, 23, 56, 0.8) 20.08%, rgba(26, 27, 71, 0.8) 47.61%, rgba(19, 20, 52, 0.8) 74.55%)",
});

const BackgroundLayer = styled("div")({
  backgroundPosition: "center",
  backgroundRepeat: "repeat",
  position: "absolute",
  inset: 0,
});

export function NoteBackground() {
  return (
    <Background>
      <BackgroundLayer
        sx={{
          backgroundImage: `url("/note/circles.svg")`,
          opacity: "0.75",
        }}
      />
      <BackgroundLayer
        sx={{
          backgroundImage: `url("/note/grid.svg")`,
          opacity: "0.75",
        }}
      />
      <BackgroundLayer
        sx={{
          backgroundImage: `url("/note/noise.png")`,
          backgroundSize: "32px",
          opacity: "0.14",
          mixBlendMode: "overlay",
        }}
      />
    </Background>
  );
}
