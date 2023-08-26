import { Flex, Box, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" gap="2em" fontSize="48px">
      <Text >這是一段中文段落</Text>
      <Text >This is my Home</Text>
      <Text >這是我的Home</Text>
      <Text fontFamily='ab-megadot9'>這是一段中文段落</Text>
      <Text fontFamily='lores-12'>This is my Home</Text>
      <Text fontFamily='ab-megadot9'>這是我的Home</Text>
    </Flex>
  );
}
