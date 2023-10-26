import { Box, Image, Circle } from "@chakra-ui/react";
import { useState, useEffect } from "react";

interface PatternPadProps {
  name: string;
  imageSrc: string;
  isActive: boolean;
  onHold: Function;
  onMouseDown: Function;
}

const COLOR_MAP: { [key: string]: string } = {
  active: "#7ED37E",
  inactive: "#5A5959",
  empty: "#000",
  occupied: "#E1B46A",
};

const PatternPad = ({
  name,
  imageSrc,
  isActive,
  onHold,
  onMouseDown,
}: PatternPadProps) => {
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    let pressTimer: any;
    if (isPressing) {
      pressTimer = setTimeout(() => {
        onHold(name);
      }, 500);
    } else {
      clearTimeout(pressTimer);
    }

    return () => {
      clearTimeout(pressTimer); // Cleanup the timeout on component unmount or when isPressing changes
    };
  }, [isPressing, onHold, name]);

  const handleMouseDown = () => {
    onMouseDown(name);
    setIsPressing(true);
  };

  const handleMouseUp = () => {
    setIsPressing(false);
  };

  return (
    <Box
      pos="relative"
      p="2px"
      w="25%"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Image src={imageSrc} alt={name} cursor="pointer" />

      <Box
        pos="absolute"
        w="10px"
        h="10px"
        bgColor={isActive ? COLOR_MAP.active : COLOR_MAP.inactive}
        top="0"
        left="50%"
        transform="translateX(-50%)"
      />

      <Circle
        pos="absolute"
        top="5px"
        right="10px"
        size="10px"
        bgColor={COLOR_MAP.empty}
      />
    </Box>
  );
};

export default PatternPad;
