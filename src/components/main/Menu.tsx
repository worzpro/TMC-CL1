import { VStack, HStack, Image, Text, Button, Box } from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/router";

import cassettes from "@/dummy/cassettes";

interface MenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Menu = ({ isMenuOpen, setIsMenuOpen }: MenuProps) => {
  const [imageSrc, setImageSrc] = useState("/images/music-list.svg");

  const router = useRouter();
  const pageName = router.pathname.split("/")[2];
  const curCassetteId = Object.values(cassettes).find(
    (cassette) => cassette.path === pageName
  )?.id;
  const [curCassette, setCurCassette] = useState(curCassetteId || 1);
  const cassetteObj = cassettes[curCassette];

  if (cassetteObj === undefined) return null;
  return (
    <VStack
      spacing="0"
      pt={{ base: "10px", md: "40px" }}
      px="50px"
      h={isMenuOpen ? "calc(100vh - 230px)" : "auto"}
      pos="relative"
    >
      {!isMenuOpen && (
        <Box
          mb="12px"
          cursor="pointer"
          onMouseEnter={() => setImageSrc("/images/music-list-focus.svg")}
          onMouseLeave={() => setImageSrc("/images/music-list.svg")}
          onClick={() => {
            setIsMenuOpen(true);
          }}
        >
          <Image src={imageSrc} alt="MenuBtn" />
        </Box>
      )}

      <Image
        w="150px"
        pos="absolute"
        top={{
          base: isMenuOpen ? "110px" : "35px",
          md: isMenuOpen ? "110px" : "75px",
        }}
        src={cassetteObj.imageSrc}
        alt={cassetteObj.name}
        transition="all 0.3s ease-out"
      />

      {isMenuOpen && (
        <VStack spacing="35px" mt="190px">
          <HStack w="100%" justify="space-between">
            <Box
              cursor="pointer"
              onClick={() => {
                if (curCassette === 1) {
                  setCurCassette(6);
                } else {
                  setCurCassette(curCassette - 1);
                }
              }}
            >
              <Image
                src="/images/music-list-left-right-arrow.svg"
                alt="LeftArrow"
                transform="scaleX(-1)"
              />
            </Box>
            <Text textStyle="en_special_xl_md">{cassetteObj.name}</Text>
            <Box
              cursor="pointer"
              onClick={() => {
                if (curCassette === 6) {
                  setCurCassette(1);
                } else {
                  setCurCassette(curCassette + 1);
                }
              }}
            >
              <Image
                src="/images/music-list-left-right-arrow.svg"
                alt="RightArrow"
                transform="scaleX(1)"
              />
            </Box>
          </HStack>
          <Text minH="120px" textStyle="ch_normal_md">
            {cassetteObj.description}
          </Text>
          <HStack w="100%" justify="space-between">
            <Text textStyle="en_special_lg_bold">{`${cassetteObj.id}/6`}</Text>
            <Button
              variant="play"
              colorScheme="blue"
              onClick={async () => {
                setIsMenuOpen(false);
                setCurCassette(cassetteObj.id);
                setTimeout(() => {
                  router.push(`/cassettes/${cassetteObj.path}`);
                }, 1000);
              }}
            >
              Play
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default Menu;
