import { Box, Image, Flex, HStack } from "@chakra-ui/react";

interface MachineProps {
  isMenuOpen: boolean;
}

const Machine = ({ isMenuOpen }: MachineProps) => {
  const pads = [
    {
      id: 1,
      name: "a",
      imageSrc: "/images/button-a.png",
    },
    {
      id: 2,
      name: "b",
      imageSrc: "/images/button-b.png",
    },
    {
      id: 3,
      name: "c",
      imageSrc: "/images/button-c.png",
    },
    {
      id: 4,
      name: "d",
      imageSrc: "/images/button-d.png",
    },
    {
      id: 5,
      name: "5",
      imageSrc: "/images/button-5.png",
    },
    {
      id: 6,
      name: "6",
      imageSrc: "/images/button-6.png",
    },
    {
      id: 7,
      name: "7",
      imageSrc: "/images/button-7.png",
    },
    {
      id: 8,
      name: "8",
      imageSrc: "/images/button-8.png",
    },
    {
      id: 9,
      name: "1",
      imageSrc: "/images/button-1.png",
    },
    {
      id: 10,
      name: "2",
      imageSrc: "/images/button-2.png",
    },
    {
      id: 11,
      name: "3",
      imageSrc: "/images/button-3.png",
    },
    {
      id: 12,
      name: "4",
      imageSrc: "/images/button-4.png",
    },
  ];

  return (
    <Box
      // 外層容器
      pos="absolute"
      overflow="hidden"
      w="100%"
      borderRadius="8px"
      top={isMenuOpen ? "700px" : "100px"}
      zIndex="7999"
      transition="all 0.3s ease-out"
      transitionDelay={isMenuOpen ? "0s" : "0.3s"}
      transitionDuration={isMenuOpen ? "0.3s" : "0.7s"}
      boxShadow="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 0, 0,0.5) 0px 35px 60px -15px"
    >
      <Box
        // 機器背景
        h="100%"
        w="100%"
        bgImage={{
          base: "/images/small-machine.png",
          sm: "/images/big-machine.png",
        }}
        bgSize="contain"
        bgRepeat="no-repeat"
        bgPosition="center"
      >
        <Flex
          // 機器內容
          direction="column"
          p="20px 20px 15px 15px"
          h="100%"
          gap="15px"
        >
          <Box
            // 螢幕
            border="3px solid black"
            w="100%"
            h={{ base: "182px", sm: "91vw" }}
            maxH='382px'
            borderRadius="8px"
            bgColor="rgb(197, 218, 227)"
          ></Box>

          <HStack
            // 按鈕
            spacing="4px"
          >
            <Image w={{ base: "80px", sm: "21.5vw" }} maxW='90px' src="/images/bbbb.png" />
            <Image w={{ base: "80px", sm: "21.5vw" }} src="/images/bbbb.png" />
          </HStack>

          <Box
            // Pad區
            p="2px"
            bgColor="black"
            w="100%"
            borderRadius="8px"
          >
            <Flex wrap="wrap">
              {pads.map((pad) => (
                <Box p="2px" key={pad.id} w="25%">
                  <Image src={pad.imageSrc} alt={pad.name} />
                </Box>
              ))}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Machine;
