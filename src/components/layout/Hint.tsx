import { Center, Box, Image } from "@chakra-ui/react";
import * as Tone from "tone";

interface HintProps {
  showHint: boolean;
  setShowHint: Function;
  setIsToneStarted: Function;
}

const Hint = ({ showHint, setShowHint, setIsToneStarted }: HintProps) => {
  if (!showHint) return null;
  return (
    <Center
      pos="absolute"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
      bgColor="rgba(0, 0, 0, 0.5)"
      zIndex="10000"
    >
      <Box pos="relative">
        <Image w="350px" src="/images/modal.png" />
        <Box
          pos="absolute"
          bottom={{ base: "30px", lg: "40px" }}
          left="50%"
          h={{ base: "15vw", lg: "60px" }}
          w={{ base: "60vw", lg: "260px" }}
          transform="translateX(-50%)"
          cursor="pointer"
          onClick={async () => {
            setShowHint(false);
            await Tone.start();

            setIsToneStarted(true);
          }}
        ></Box>
      </Box>
    </Center>
  );
};

export default Hint;
