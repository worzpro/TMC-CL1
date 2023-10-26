import { memo } from "react";
import { Center } from "@chakra-ui/react";

interface SampleBtnProps {
  name: string;
  index: number;
  isActive: boolean;
  isMobile: boolean;
  onTouch: Function;
}

const SampleBtn = memo(
  ({ name, index, isActive, isMobile, onTouch }: SampleBtnProps) => {
    return (
      <Center
        key={index}
        w="calc((100% - 12px)/4)"
        h={{ base: "30px", sm: "95px" }}
        bg={isActive ? "#791930" : "#2B2929"}
        color="#ADADAD"
        fontSize="12px"
        cursor="pointer"
        onMouseDown={() => {
          if (isMobile) return;
          onTouch(index);
        }}
        onTouchStart={() => {
          if (!isMobile) return;
          onTouch(index);
        }}
      >
        {name}
      </Center>
    );
  }
);

export default SampleBtn;
