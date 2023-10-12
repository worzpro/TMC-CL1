import { VStack, Center, Image, Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const Loading = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setWidth((prev) => {
        if (prev === 100) {
          clearInterval(intervalId);
          return prev;
        }
        return prev + 1;
      });
    }, 5);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Center
      display={width === 100 ? "none" : "flex"}
      pos="absolute"
      top="0"
      left="0"
      w="100%"
      h="100%"
      bgColor="rgb(197, 218, 227)"
      zIndex="7999"
    >
      <VStack>
        <Image src="/images/loading.svg" alt="loading" />
        <Box
          w="150px"
          h="24px"
          display="grid"
          gridTemplateColumns="repeat(2,3px) 1fr repeat(2,3px)"
          gridTemplateRows="repeat(2,3px) 1fr repeat(2,3px)"
        >
          <Box />
          <Box bgColor="rgb(50,50,50)" />
          <Box bgColor="rgb(50,50,50)" />
          <Box bgColor="rgb(50,50,50)" />
          <Box />

          <Box bgColor="rgb(50,50,50)" />
          <Box />
          <Box />
          <Box />
          <Box bgColor="rgb(50,50,50)" />

          <Box bgColor="rgb(50,50,50)" />
          <Box />
          <Box w={`${width}%`} bgColor="rgb(50,50,50)" />
          <Box />
          <Box bgColor="rgb(50,50,50)" />

          <Box bgColor="rgb(50,50,50)" />
          <Box />
          <Box />
          <Box />
          <Box bgColor="rgb(50,50,50)" />

          <Box />
          <Box bgColor="rgb(50,50,50)" />
          <Box bgColor="rgb(50,50,50)" />
          <Box bgColor="rgb(50,50,50)" />
          <Box />
        </Box>
      </VStack>
    </Center>
  );
};

export default Loading;
