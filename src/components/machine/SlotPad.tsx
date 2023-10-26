import { Box, Image, Circle } from "@chakra-ui/react";
import PadLight from "@/components/machine/PadLight";

interface SlotPadProps {
  name: string;
  imageSrc: string;
  isMobile: boolean;
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
  return (
    <Box
      pos="relative"
      p="2px"
      w="25%"
      onClick={()=>{onClick()}}

    >
      <PadLight myPadName={name} isRegistered={isRegistered} />
      <Image src={imageSrc} alt={name} cursor="pointer" />
    </Box>
  );
};

export default SlotPad;
