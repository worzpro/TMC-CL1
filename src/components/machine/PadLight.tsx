import { Box } from "@chakra-ui/react";

interface PadLightProps {
  myPadName: string;
  activePad: string;
}

const PadLight = ({ myPadName,activePad }: PadLightProps) => {
  
  const colorMap: { [key: string]: string } = {
    active: "#7ED37E",
    inactive: "#5A5959",
  };

  return (
    <Box
      pos="absolute"
      w="10px"
      h="10px"
      bgColor={myPadName === activePad ? colorMap.active : colorMap.inactive}
      top="0"
      left="50%"
      transform="translateX(-50%)"
    />
  );
};

export default PadLight;
