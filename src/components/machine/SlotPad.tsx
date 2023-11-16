import { Box, Image, Circle } from "@chakra-ui/react";

interface SlotPadProps {
  name: string;
  imageSrc: string;
  isMobile: boolean;

  labelIndex: number;
  isRegistered: boolean;
  isActive: boolean;
  onClick: Function;
}

const SlotPad = ({
  name,
  imageSrc,
  isMobile,
  isRegistered,
  isActive,
  onClick,
}: SlotPadProps) => {
  const COLOR_MAP: { [key: string]: string } = {
    active: "#7ED37E",
    inactive: "#5A5959",
    played: "#E1B46A",
  };

  return (
    <Box pos="relative" p="2px" w="25%" onClick={() => onClick()}>
      <Box
        pos="absolute"
        w="10px"
        h="10px"
        bgColor={
          isActive
            ? COLOR_MAP.played
            : isRegistered
            ? COLOR_MAP.active
            : COLOR_MAP.inactive
        }
        top="2px"
        left="50%"
        transform="translateX(-50%)"
      />
      <Image src={imageSrc} alt={name} cursor="pointer" />
    </Box>
  );
};

export default SlotPad;
