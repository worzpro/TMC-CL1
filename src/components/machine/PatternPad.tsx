import {
  Box,
  Image,
  Circle,
  keyframes,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

interface PatternPadProps {
  imageSrc: string;
  name: string;
  index: number;
  isActive: boolean;
  isRegistered: boolean;
  isBeingPlayed: boolean;
  onHold: Function;
  onMouseDown: Function;
}

const COLOR_MAP: { [key: string]: string } = {
  active: "#7ED37E",
  inactive: "#5A5959",
  empty: "#000",
  registered: "#E1B46A",
  temp: "red",
};

const PatternPad = ({
  imageSrc,
  name,
  index,
  isActive,
  isRegistered,
  isBeingPlayed,
  onHold,
  onMouseDown,
}: PatternPadProps) => {
  const [isPressing, setIsPressing] = useState(false);
  const blink = keyframes`
    50% { background-color: ${COLOR_MAP.registered}; }
  `;
  const animation = isBeingPlayed ? `${blink} 0.5s infinite` : "none";
  const bgColor = isBeingPlayed
    ? COLOR_MAP.inactive
    : isActive
    ? COLOR_MAP.active
    : COLOR_MAP.inactive;
  

  useEffect(() => {
    let pressTimer: any;
    if (isPressing) {
      pressTimer = setTimeout(() => {
        onHold(index);
      }, 500);
    } else {
      clearTimeout(pressTimer);
    }

    return () => {
      clearTimeout(pressTimer); // Cleanup the timeout on component unmount or when isPressing changes
    };
  }, [isPressing, onHold, index]);

  const handleMouseDown = (e:any) => {
    e.preventDefault();
    onMouseDown(name);
    setIsPressing(true);
  };

  const handleMouseUp = (e:any) => {
    e.preventDefault();
    setIsPressing(false);
  };

  return (
    <Box
      pos="relative"
      p="2px"
      w="25%"
      onTouchStart={(e:any)=>e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Image src={imageSrc} alt={name} cursor="pointer" />

      <Box
        pos="absolute"
        w="10px"
        h="10px"
        bgColor={bgColor}
        animation={animation}
        top="2px"
        left="50%"
        transform="translateX(-50%)"
      />

      <Circle
        pos="absolute"
        top="5px"
        right="10px"
        size="10px"
        bgColor={isRegistered ? COLOR_MAP.registered : COLOR_MAP.empty}
      />
    </Box>
  );
};

export default PatternPad;
