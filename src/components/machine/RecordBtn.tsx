import { Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";

const getLabel = (recordState: string) => {
  let label = "";
  switch (recordState) {
    case "empty":
      label = "record";
      break;
    case "recording":
      label = "stop";
      break;
    case "registered":
      label = "play";
      break;
    default:
      break;
  }
  return label;
};

interface RecordBtnProps {
  key: string;
  onRecordMouseDown: Function;
  onRecordHold: Function;
  onRecordMouseUp: Function;
  recordState: string;
  isActive: boolean;
}

const RecordBtn = ({
  key,
  onRecordMouseDown,
  onRecordHold,
  onRecordMouseUp,
  recordState,
  isActive,
}: RecordBtnProps) => {
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
      clearTimeout(pressTimer); // Cleanup the timeout on component unmount or when isPressing changes
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
    <Button
      key={key}
      colorScheme={isActive ? "red" : "gray"}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {getLabel(recordState)}
    </Button>
  );
};

export default RecordBtn;
