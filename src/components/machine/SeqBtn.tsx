import { Center, Box } from "@chakra-ui/react";

interface SeqBtnProps {
  seq: string;
  curSeq: string;
  pendingSeq: string | null;
  progress: number;
  onSeqClick: Function;
}

const SeqBtn = ({
  seq,
  curSeq,
  pendingSeq,
  progress,
  onSeqClick,
}: SeqBtnProps) => {
  return (
    <Center
      flex="1"
      bgColor={
        curSeq === seq ? "#292929" : pendingSeq == seq ? "#a27533" : "#687074"
      }
      color="white"
      textStyle="en_special_md_bold"
      cursor="pointer"
      onClick={() => {
        onSeqClick(seq);
      }}
      pos="relative"
      overflow='hidden'
    >
      {seq}
      {curSeq === seq && (
        <Box
          pos="absolute"
          top="0"
          left={`${progress}%`}
          w='4px'
          h="100%"
          bgColor="white"
        ></Box>
      )}
    </Center>
  );
};

export default SeqBtn;
