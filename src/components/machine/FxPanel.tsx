import { Box, Flex, Text } from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { INSERT_EFFECTS, SEND_EFFECTS } from "@/dummy/constants";

interface FxPanelProps {
  isHold: boolean;
  onFxChange: Function;
}

interface LooseObject {
  [key: string]: any;
}

const FXs = [...Object.values(INSERT_EFFECTS), ...Object.values(SEND_EFFECTS)];

const FxPanel = ({ isHold, onFxChange }: FxPanelProps) => {
  const [barPositions, setBarPositions] = useState<number[]>(
    FXs.map((fx) => fx.defaultPosition)
  );
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    containerRefs.current = containerRefs.current.slice(0, FXs.length);
  }, [FXs]);

  useEffect(() => {
    !isHold && resetBarPosition();
  }, [isHold]);

  const updateBarPosition = useCallback(
    (index: number, clientY: number, fx: LooseObject) => {
      const container = containerRefs.current[index];
      if (container) {
        const rect = container.getBoundingClientRect();
        let newHeight = ((rect.bottom - clientY) / rect.height) * 100;
        newHeight = Math.round(Math.max(0, Math.min(100, newHeight))); // 保證在 0 到 100 的範圍內

        // 計算出新的值
        const { min, max, step, defaultValue } =
          fx.type == "insert" ? fx.variables[0] : fx.channelVariables[0];
        const valueRange = max - min;
        const fxValue =
          Math.round(((newHeight / 100) * valueRange + min) / step) * step;
        newHeight = ((fxValue - min) / valueRange) * 100;
        // console.log("fxValue", fxValue);
        onFxChange(fx, fxValue);

        setBarPositions((prev) =>
          prev.map((pos, idx) => (idx === index ? newHeight : pos))
        );
      }
    },
    [barPositions]
  );

  const resetBarPosition = useCallback(
    (fx?: LooseObject, index?: number) => {
      if (fx && index) {
        if (fx.type == "send") {
          onFxChange(fx, fx.channelVariables[0].defaultValue);
        } else {
          onFxChange(fx, fx.variables[0].defaultValue);
        }

        setBarPositions((prev) => {
          const newBarPositions = [...prev];
          newBarPositions[index] = FXs[index].defaultPosition;
          return newBarPositions;
        });
      } else {
        FXs.forEach((fx: LooseObject) => {
          if (fx.type == "send") {
            onFxChange(fx, fx.channelVariables[0].defaultValue);
          } else {
            onFxChange(fx, fx.variables[0].defaultValue);
          }
        });
        setBarPositions(FXs.map((fx) => fx.defaultPosition));
      }
    },
    [barPositions]
  );

  const handleMouseDown = useCallback(
    (index: number, event: any, fx: LooseObject) => {
      updateBarPosition(index, event.clientY, fx);

      const handleMouseMove = (e: any) =>
        updateBarPosition(index, e.clientY, fx);
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        !isHold && resetBarPosition(fx, index);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isHold, resetBarPosition, updateBarPosition]
  );

  const handleTouchStart = useCallback(
    (index: number, event: any, fx: LooseObject) => {
      updateBarPosition(index, event.touches[0].clientY, fx);
      const handleTouchMove = (e: any) =>
        updateBarPosition(index, e.touches[0].clientY, fx);
      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        !isHold && resetBarPosition(fx, index);
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
            overflow="hidden"
            onMouseDown={(e) => handleMouseDown(index, e, fx)}
            onTouchStart={(e) => handleTouchStart(index, e, fx)}
          >
            <Text mt="4px" textStyle='en_special_xs_bold'>{fx.label}</Text>
            <Box
              id="bar"
              pos="absolute"
              left="0"
              bottom={`${barPositions[index]}%`}
              w="100%"
              h="5px"
              bg="white"
              transform={`translateY(${barPositions[index]}%)`}
            />
          </Box>
        ))}
      </Flex>
    </Flex>
  );
};

export default FxPanel;
