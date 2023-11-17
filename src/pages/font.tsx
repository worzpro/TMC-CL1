import { VStack, HStack, Text } from "@chakra-ui/react";

const FontTest = () => {
  //一般英文字體：Poppins
  //一般中文字體：Source Han
  //像素感英文：lores-12
  //像素感中文：AB Megadot9

  return (
    <VStack >
      <VStack border="1px">
        <Text>一般英文字體：Poppins</Text>
        <Text textStyle="ch_normal_md">abcdefg, ABCDEFG, 1234567890</Text>
      </VStack>
      <VStack border="1px">
        <Text>一般中文字體：Source Han</Text>
        <Text textStyle="ch_normal_md">哈囉你好，這是測試文字</Text>
      </VStack>
      <VStack border="1px">
        <Text>像素感英文：lores-12</Text>
        <Text textStyle="en_special_md_bold">abcdefg, ABCDEFG, 1234567890</Text>
      </VStack>
    </VStack>
  );
};

export default FontTest;
