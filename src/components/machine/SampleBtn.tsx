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
        h={{ base: "30px", sm: "72px" }}
        bg={isActive ? "#791930" : "#2B2929"}
        color="#ADADAD"
        textStyle='en_special_xs_md'
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
