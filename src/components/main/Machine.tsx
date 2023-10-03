import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import * as Tone from "tone";

import artists from "@/dummy/artists";
import pads from "@/dummy/pads";

import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";

interface MachineProps {
  isMenuOpen: boolean;
}

const Machine = ({ isMenuOpen }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [insertGift, setInsetGift] = useState<string>("");
  const [activePad, setActivePad] = useState<string>("");
  const router = useRouter();
  const pathName = router.pathname.split("/")[2];

  // dummy data 後處理
  const padsArr = Object.values(pads).sort((a, b) => a.id - b.id);
  const artistData = artists[pathName]?.[`seq${currentSeq}`];

  const playerRef = useRef<any>(null);

  const handler = {
    initiateTone: async () => {
      await Tone.loaded();
      console.log("Audio is loaded");
      await Tone.start();
      console.log("AudioContext is started");
      setIsLoading(false);
    },
    onChangeGif: (padData: { [key: string]: any }) => {
      if (!padData?.gifSrc) return;
      if (insertGift !== "") setInsetGift("");
      setInsetGift(padData.gifSrc);
      setTimeout(() => {
        setInsetGift("");
      }, padData.gifDuration);
    },
    onChangePadLight: (padName: string) => {
      if (activePad !== "") setActivePad("");
      setActivePad(padName);
      setTimeout(() => {
        setActivePad("");
      }, 100);
    },
  };

  useEffect(() => {
    // 判斷使用者裝置
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));

    // 初始化 playerRef
    let MAPPING: any = {};
    for (let key in artistData) {
      MAPPING[key] = artistData[key].audioSrc;
    }
    const players = new Tone.Players(MAPPING).toDestination();
    playerRef.current = players;
  }, []);

  useEffect(() => {
    if (isLoading) {
      handler.initiateTone();
    }
  }, [isLoading]);

  console.log(playerRef.current)
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
          <Flex
            // 螢幕容器
            direction="column"
            border="3px solid black"
            w="100%"
            h={{ base: "182px", sm: "91vw" }}
            maxH="382px"
            borderRadius="8px"
            bgColor="rgb(197, 218, 227)"
            pt="12px"
            px="8px"
            pb="1px"
            justify="space-between"
          >
            <HStack
              // SEQs
              spacing="6px"
            >
              {[1, 2, 3, 4].map((seq) => (
                <Center
                  flex="1"
                  key={seq}
                  bgColor={currentSeq === seq ? "#292929" : "#687074"}
                  color="white"
                  textStyle="en_special_md_bold"
                  cursor="pointer"
                  onClick={() => setCurrentSeq(seq)}
                >
                  SEQ.{seq}
                </Center>
              ))}
            </HStack>
            <Box pos="relative">
              <Image
                pos="absolute"
                top="0"
                right="0"
                w="85px"
                src="/images/jam_off.png"
              />
              <Image
                w="100%"
                maxH={{ base: "100px", sm: "unset" }}
                src={insertGift || artistData?.["wait"].gifSrc}
              />
            </Box>

            <Flex
              // 功能按鈕區
              pl="12px"
              justify="space-between"
            >
              <HStack
                color="#4D4D4D"
                spacing="18px"
                textStyle="en_special_md_bold"
              >
                {["FX", "SAMPLE"].map((buttonLabel) => (
                  <Box key={buttonLabel} bgColor="#EBEBEB" p="2px 16px">
                    {buttonLabel}
                  </Box>
                ))}
              </HStack>
              <HStack>
                <Image
                  src="/images/restart.svg"
                  alt="restart"
                  cursor="pointer"
                />
                <Image src="/images/play.svg" alt="play" cursor="pointer" />
              </HStack>
            </Flex>
          </Flex>

          <HStack
            // 按鈕
            spacing="4px"
          >
            <Image
              w={{ base: "80px", sm: "21.5vw" }}
              maxW="90px"
              src="/images/bbbb.png"
              cursor="pointer"
            />
            <Image
              w={{ base: "80px", sm: "21.5vw" }}
              maxW="90px"
              src="/images/bbbb.png"
              cursor="pointer"
            />
          </HStack>

          <Box
            // Pad區
            p="2px"
            bgColor="black"
            w="100%"
            borderRadius="8px"
          >
            <Flex wrap="wrap">
              {padsArr.map((pad) => (
                <Box
                  key={pad.id}
                  pos="relative"
                  p="2px"
                  w="25%"
                  onClick={() => {
                    const padData = artistData[pad.name];
                    handler.onChangeGif(padData);
                    handler.onChangePadLight(pad.name);
                    playerRef.current.player(pad.name).start();
                  }}
                >
                  <PadLight myPadName={pad.name} activePad={activePad} />
                  {pad.id < 5 && <RecordingLight />}
                  <Image src={pad.imageSrc} alt={pad.name} cursor="pointer" />
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
