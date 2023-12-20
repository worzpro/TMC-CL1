import { Box, Image } from "@chakra-ui/react";
import { useState, useEffect } from "react";

import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";

interface RecordButtonProps {
  pad: any;
  index: number;
  recordState: any[];
  isMobile: boolean;
  activePad: string;
  onRecordMouseDown: Function;
  onRecordHold: Function;
  onRecordMouseUp: Function;
}

const RecordButton = ({
  pad,
  index,
  recordState,
  isMobile,
  activePad,
  onRecordMouseDown,
  onRecordHold,
  onRecordMouseUp,
}: RecordButtonProps) => {
  const [isPressing, setIsPressing] = useState(false);

  useEffect(() => {
    let pressTimer: any;
    if (isPressing) {
      pressTimer = setTimeout(() => {
        onRecordHold();
      }, 500);
    } else {
      clearTimeout(pressTimer);
    }

    return () => {
      clearTimeout(pressTimer);
    };
  }, [isPressing, onRecordHold]);

  const handleMouseDown = () => {
    onRecordMouseDown();
    setIsPressing(true);
  };

  const handleMouseUp = () => {
    onRecordMouseUp();
    setIsPressing(false);
  };

  return (
    <Box
      pos="relative"
      p="2px"
      w="25%"
      cursor="pointer"
      onMouseDown={()=>{
        if (isMobile) return;
        handleMouseDown();
      }}
      onMouseUp={()=>{
        if (isMobile) return;
        handleMouseUp();
      }}
      onTouchStart={()=>{
        if (!isMobile) return;
        handleMouseDown();
      }}
      onTouchEnd={()=>{
        if (!isMobile) return;
        handleMouseUp();
      }}
    >
      <PadLight myPadName={pad.name} activePad={activePad} />
      <RecordingLight state={recordState[index]} />
      <Image src={pad.imageSrc} alt={pad.name} />
    </Box>
  );
};

export default RecordButton;
