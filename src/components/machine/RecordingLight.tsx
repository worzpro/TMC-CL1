import { Circle } from "@chakra-ui/react";

const RecordingLight = () => {
  const colorMap: { [key: string]: string } = {
    active: "#7ED37E",
    inactive: "#DF201C",
  };
  return (
    <Circle
      pos="absolute"
      top="5px"
      right="10px"
      size="10px"
      bgColor={colorMap.inactive}
    />
  );
};

export default RecordingLight;
