import { Flex, Box, Image, Center, Text, HStack } from "@chakra-ui/react";
import sidebarLinks from "@/dummy/sidebarLinks";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentVid: React.Dispatch<React.SetStateAction<any>>;
}

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  setCurrentVid,
}: SidebarProps) => {
  return (
    <Flex
      pos="absolute"
      top="0"
      left="0"
      transform={{
        base: sidebarOpen ? "translateX(0)" : "translateX(-324px)",
        md: sidebarOpen ? "translateX(0)" : "translateX(-375px)",
      }}
      transition="transform 0.3s ease-out"
      maxH="100vh"
      h="100%"
      zIndex="9999"
    >
      <Flex
        bgColor="#D5D5D5"
        pos="relative"
        direction="column"
        p="14px"
        w={{ base: "324px", md: "375px" }}
        boxShadow="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 0, 0) 0px 35px 60px -15px"
      >
        {/* Click: absolute */}
        <Center
          pos="absolute"
          top={{ base: "7px", md: "96px" }}
          right="-26px"
          w="26px"
          h={{ base: "47px", md: "101px" }}
          borderRadius="0 10px 10px 0"
          bgColor="white"
          cursor="pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Image src="/images/menu-open-arrow.svg" />
        </Center>

        {/* Pannel */}
        <Box p="15px 0px 28px 18px">
          <Image src="/logo.svg" alt="TMC-CL1" />
        </Box>
        <Flex
          direction="column"
          w="100%"
          px="16px"
          pb="58px"
          maxH="100%"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
          bgColor="#BDBDBD"
          borderRadius="10px"
          boxShadow="inset 0px 3px 6px rgba(0, 0, 0, 0.16)"
          textStyle="ch_normal_sm"
        >
          {Object.entries(sidebarLinks).map(([key, value], index) => (
            <Flex key={key} direction="column" gap="18px" pt="18px">
              <Text fontWeight="bold">{key}</Text>
              <Flex direction="column" gap="6px">
                {value.map((item) => (
                  <HStack
                    key={item.order}
                    pl={{ base: "15px", md: "40px" }}
                    pr="15px"
                    py="19px"
                    borderRadius="6px"
                    justify="space-between"
                    bgColor="#E7E7E7"
                    boxShadow=" 0px 3px 6px rgba(0, 0, 0, 0.16)"
                    cursor="pointer"
                    onClick={() => {
                      setCurrentVid(item.url);
                      setSidebarOpen(false);
                    }}
                  >
                    <HStack spacing="0">
                      <Text w="40px">{item.order}</Text>
                      <Text>{item.title}</Text>
                    </HStack>
                    <Text opacity="0.4">{item.timeLength}</Text>
                  </HStack>
                ))}
              </Flex>

              {/* Divider */}
              {index !== Object.entries(sidebarLinks).length - 1 && (
                <Box w="100%" h="1px" bgColor="#A2A2A2" mt="10px" />
              )}
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Sidebar;
