import { Box, Flex, Center } from "@chakra-ui/react";

interface WaveSurferDisplayerProps {
  hidden?: boolean;
  index?: number;
  containerRef: any;
}

const WaveSurferDisplayer = ({
  hidden,
  containerRef,
  index,
}: WaveSurferDisplayerProps) => {
  const CONTAINER_STYLE = {
    backgroundColor: "#2B2929",
    minHeight: "100px",
    height: "100%",
  };

  if (Array.isArray(containerRef.current) && index !== undefined) {
    return (
      <Flex
        align="center"
        hidden={hidden}
        ref={(el) => (containerRef.current[index] = el)}
        style={CONTAINER_STYLE}
      />
    );
  }
  return (
    <Flex
      align="center"
      hidden={hidden}
      ref={containerRef}
      style={CONTAINER_STYLE}
    />
  );
};

export default WaveSurferDisplayer;
