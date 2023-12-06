import { Circle } from "@chakra-ui/react";

interface RecordingLightProps {
  state: string;
}

const RecordingLight = ({state}:RecordingLightProps) => {
 
  return (
    <Circle
      pos="absolute"
      top="5px"
      right="10px"
      size="10px"
      bgColor={state == 'registered' ? '#7ED37E' : '#DF201C'}
    />
  );
};

export default RecordingLight;
