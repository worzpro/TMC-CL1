import { Box, Image, Circle } from "@chakra-ui/react";

interface SlotPadProps {
  name: string;
  imageSrc: string;
  isActive: boolean;
  onHold: Function;
  onMouseDown: Function;
}


const SlotPad = () => {
  return (
    <div>SlotPad</div>
  )
}

export default SlotPad