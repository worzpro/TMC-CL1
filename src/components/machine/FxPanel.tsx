import { Box, Flex, Text } from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";


interface FxPanelProps {
  isHold: boolean;
}

interface LooseObject {
  [key: string]: any;
}



const FXs = [
  {
    label: "Pitch Shift",
    initPos: 50,
  },
  {
    label: "Filter",
    initPos: 0,
  },
  {
    label: "Frequency Shifter",
    initPos: 0,
  },
  {
    label: "Distortion",
    initPos: 0,
  },
  {
    label: "Phaser",
    initPos: 0,
  },
  {
    label: "Ping Pong Delay",
    initPos: 0,
  },
  {
    label: "Tmc Hall",
    initPos: 0,
  },
  {
    label: "Tmc Chamber",
    initPos: 0,
  },
];

const FxPanel = ({ isHold }: FxPanelProps) => {
  const [barPositions, setBarPositions] = useState<number[]>(
    FXs.map((fx) => fx.initPos)
  );
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const insertEffectsRef = useRef<any>(null);
  const sendEffectsRef = useRef<any>(null);

  
  useEffect(() => {
    containerRefs.current = containerRefs.current.slice(0, FXs.length);
  }, [FXs]);

  useEffect(() => {
    !isHold && resetBarPosition();
  }, [isHold]);

  const updateBarPosition = useCallback(
    (index: number, clientY: number) => {
      const container = containerRefs.current[index];
      if (container) {
        const rect = container.getBoundingClientRect();
        let newHeight = ((rect.bottom - clientY) / rect.height) * 100;
        newHeight = Math.max(0, Math.min(95, newHeight)); // 保證在 0 到 95 的範圍內
        setBarPositions((prev) =>
          prev.map((pos, idx) => (idx === index ? newHeight : pos))
        );
      }
    },
    [barPositions]
  );

  const resetBarPosition = useCallback(
    (index?: number) => {
      if (index) {
        setBarPositions((prev) => {
          const newBarPositions = [...prev];
          newBarPositions[index] = FXs[index].initPos;
          return newBarPositions;
        });
      } else {
        setBarPositions(FXs.map((fx) => fx.initPos));
      }
    },
    [barPositions]
  );

  const handleMouseDown = useCallback(
    (index: number, event: any) => {
      updateBarPosition(index, event.clientY);

      const handleMouseMove = (e: any) => updateBarPosition(index, e.clientY);
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        !isHold && resetBarPosition(index);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isHold, resetBarPosition, updateBarPosition]
  );

  const handleTouchStart = useCallback(
    (index: number, event: any) => {
      updateBarPosition(index, event.touches[0].clientY);
      const handleTouchMove = (e: any) =>
        updateBarPosition(index, e.touches[0].clientY);
      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        !isHold && resetBarPosition(index);
      };
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [isHold, resetBarPosition, updateBarPosition]
  );

  return (
    <Flex direction="column" gap="12px">
      <Flex wrap="wrap" gap="6px">
        {FXs.map((fx: LooseObject, index: number) => (
          <Box
            id="container"
            ref={(el) => (containerRefs.current[index] = el)}
            key={fx.label}
            border="1px"
            w="calc((100% - 18px) / 4)"
            h="100px"
            mb={index < 4 ? "4px" : "0px"}
            textAlign="center"
            pos="relative"
            fontSize="12px"
            bgColor="#3B3B3B"
            color="#C6DAE2"
            fontWeight="bold"
            onMouseDown={(e) => handleMouseDown(index, e)}
            onTouchStart={(e) => handleTouchStart(index, e)}
          >
            <Text mt="4px">{fx.label}</Text>
            {/* <Text mt="4px">{Math.round(barPositions[index])}</Text> */}
            <Box
              id="bar"
              pos="absolute"
              left="0"
              bottom={`${barPositions[index]}%`}
              w="100%"
              h="5px"
              bg="white"
            />
          </Box>
        ))}
      </Flex>
    </Flex>
  );
};

export default FxPanel;
