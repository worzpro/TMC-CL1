import { Box, Text, HStack } from "@chakra-ui/react";
import WaveSurferDisplayer from "./WaveSurferDisplayer";

interface WaveSurferPlayerProps {
  hidden: boolean;
  recordState: any[];
  curRecordSlotIndex: number;
  recordContainerRef: any;
  resultContainerRef: any;
  count: number;
}

const WaveSurferPlayer = ({
  hidden,
  recordState,
  curRecordSlotIndex,
  recordContainerRef,
  resultContainerRef,
  count,
}: WaveSurferPlayerProps) => {
  const RECORD_SLOTS = ["a", "b", "c", "d"];

  return (
    <Box hidden={hidden} h="100%" mb="8px">
      {/* 未註冊時介面 */}
      <Box
        w="100%"
        h="100%"
        mb="10px"
        pos="relative"
        hidden={recordState[curRecordSlotIndex] === "registered"}
      >
        <WaveSurferDisplayer containerRef={recordContainerRef} />
        <HStack
          pos="absolute"
          top="5px"
          left="10px"
          textStyle="en_special_md_bold"
        >
          <Text color="#959494">{RECORD_SLOTS[curRecordSlotIndex]}</Text>
          {recordState[curRecordSlotIndex] === "recording" && (
            <Text color="#F76E2F">{`${count}s`}</Text>
          )}
        </HStack>
      </Box>

      {/* 註冊時介面 */}
      {RECORD_SLOTS.map((label: string, index: number) => (
        <Box
          key={index}
          w="100%"
          h="100%"
          mb="10px"
          pos="relative"
          overflow="hidden"
          hidden={
            !(
              curRecordSlotIndex === index &&
              recordState[index] === "registered"
            )
          }
        >
          <WaveSurferDisplayer
            index={index}
            containerRef={resultContainerRef}
          />
          <HStack
            pos="absolute"
            top="5px"
            left="10px"
            textStyle="en_special_md_bold"
          >
            <Text color="#959494">{RECORD_SLOTS[index]}</Text>
          </HStack>
        </Box>
      ))}
    </Box>
  );
};

export default WaveSurferPlayer;
