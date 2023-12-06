import { Box, Text, HStack } from "@chakra-ui/react";
import WaveSurferDisplayer from "./WaveSurferDisplayer";

interface WaveSurferPlayerProps {
  recordState: any[];
  curRecordSlotIndex: number;
  recordContainerRef: any;
  resultContainerRef: any;
  count: number;
}

const WaveSurferPlayer = ({
  recordState,
  curRecordSlotIndex,
  recordContainerRef,
  resultContainerRef,
  count,
}: WaveSurferPlayerProps) => {
  const RECORD_SLOTS = ["a", "b", "c", "d"];

  return (
    <>
      {/* 未註冊時介面 */}
      <Box
        h="100%"
        mb="10px"
        pos="relative"
        hidden={recordState[curRecordSlotIndex] === "registered"}
      >
        <WaveSurferDisplayer
          hidden={recordState[curRecordSlotIndex] === "registered"}
          containerRef={recordContainerRef}
        />
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
    </>
  );
};

export default WaveSurferPlayer;
