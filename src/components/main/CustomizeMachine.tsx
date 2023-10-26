import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import * as Tone from "tone";

import pads from "@/dummy/pads";

import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";
import Loading from "@/components/machine/Loading";
import SampleBtn from "@/components/machine/SampleBtn";
import PatternPad from "@/components/machine/PatternPad";
import SlotPad from "@/components/machine/SlotPad";
import SampleSelectPanel from "@/components/machine/SampleSelectPanel";

import proSamples from "@/dummy/customize/proSamples";
import defaultSamples from "@/dummy/customize/defaultSamples";

interface MachineProps {
  isMenuOpen: boolean;
}
interface LooseObject {
  [key: string]: any;
}

const SAMPLES = proSamples;
const DEFAULT_SAMPLES = defaultSamples;
const NUMBER_OF_SLOTS = 8;
const NUMBER_OF_SAMPLES = 8;
const NUMBER_OF_PATTERNS = 4;

const CustomizeMachine = ({ isMenuOpen }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showSelectPanel, setShowSelectPanel] = useState<boolean>(false); // 顯示Sample選擇面板
  const [isToneStarted, setIsToneStarted] = useState<boolean>(false);
  const [curSeq, setCurSeq] = useState<string>("SEQ.1");

  const [curSample, setCurSample] = useState<any>({
    id: "customize-37",
    artist: "customize",
    index: 8,
  }); // 目前面板上選擇的sample(id, index)
  const [curSamples, setCurSamples] = useState<any[]>(DEFAULT_SAMPLES); // 現在面板上的8個samples
  const [curPattern, setCurPattern] = useState<string>("a"); // 目前選擇的段落(a,b,c,d)
  const [curPosition, setCurPosition] = useState(null);
  const samplePlayerRef = useRef<any>(null); // 全部sample的player

  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [activePad, setActivePad] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playerRef = useRef<any>(null);

  // Pads陣列處理
  const patternPads = Object.values(pads).filter((pad) => pad.id < 5);
  const slotPads = Object.values(pads)
    .filter((pad) => pad.id > 4)
    .sort((a, b) => a.id - b.id);

  const handler = {
    generate2DArray: (rows: number, columns: number) => {
      return Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => false)
      );
    },
    initiateTone: async () => {
      await Tone.loaded();
      console.log("Audio Ready");
      await Tone.start();
      console.log("Audio context started!");

      setIsToneStarted(true);
      Tone.Transport.loop = true;
      Tone.Transport.setLoopPoints("1:0:0", "2:0:0");
    },
    createSamplePlayer: () => {
      // 將所有的sample創建成player
      let samplePlayer: LooseObject = {};
      SAMPLES.forEach((sample: LooseObject) => {
        if (sample.src) {
          samplePlayer[sample.id] = new Tone.Player(sample.src).toDestination();
        }
      });
      return samplePlayer;
    },
    onSampleTouch: (id: string, artist: string, index: number) => {
      // 當使用者點擊sample時
      setCurSample({ id, artist, index });
      if (samplePlayerRef.current) {
        samplePlayerRef.current[id]?.start();
      }
    },
    onPatternHold: useCallback(
      (name: string) => {
        setCurPattern(name);
      },
      [setCurPattern]
    ),
    onPatternMouseDown: useCallback(
      (name: string) => {
        setCurPattern(name);
      },
      [setCurPattern]
    ),
  };

  let padRegistered = handler.generate2DArray(
    NUMBER_OF_SAMPLES,
    NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS + 1)
  );

  useEffect(() => {
    // 判斷使用者裝置
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));

    // 初始化 Tone
    handler.initiateTone();

    // 創建 sample player
    samplePlayerRef.current = handler.createSamplePlayer();
  }, []);

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
      boxShadow="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 0, 0,0.2) 0px 30px 15px -15px"
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
            pos="relative"
            overflow="hidden"
          >
            <Loading />
            {!showSelectPanel && (
              <HStack
                // SEQs
                spacing="6px"
              >
                {["SEQ.1", "SEQ.2", "SEQ.3", "SEQ.4"].map((seq) => (
                  <Center
                    flex="1"
                    key={seq}
                    bgColor={
                      curSeq === seq
                        ? "#292929"
                        : pendingSeq == seq
                        ? "#a27533"
                        : "#687074"
                    }
                    color="white"
                    textStyle="en_special_md_bold"
                    cursor="pointer"
                    onClick={() => {
                      // handler.onSeqClick(seq);
                    }}
                  >
                    {seq}
                  </Center>
                ))}
              </HStack>
            )}

            <Box pos="relative" mb="4px">
              {showSelectPanel && (
                <SampleSelectPanel
                  isMobile={isMobile}
                  curSample={curSample}
                  setCurSample={setCurSample}
                  curSamples={curSamples}
                  setCurSamples={setCurSamples}
                  samplePlayerRef={samplePlayerRef}
                />
              )}

              {/* curSamples */}
              {!showSelectPanel && (
                <Flex justify="center" wrap="wrap" gap="4px">
                  {curSamples.map((sample, index) => {
                    return (
                      <SampleBtn
                        key={sample.id}
                        name={sample.name}
                        index={index}
                        isActive={index === curSample.index}
                        isMobile={isMobile}
                        onTouch={() => {
                          handler.onSampleTouch(
                            sample.id,
                            sample.artist,
                            index
                          );
                        }}
                      />
                    );
                  })}
                </Flex>
              )}
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
                <Box cursor="pointer">
                  {isPlaying ? (
                    <Image src="/images/pause.svg" alt="pause" />
                  ) : (
                    <Image src="/images/play.svg" alt="play" />
                  )}
                </Box>
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
              _hover={{ opacity: 0.7 }}
            />
            <Image
              w={{ base: "80px", sm: "21.5vw" }}
              maxW="90px"
              src="/images/bbbb.png"
              cursor="pointer"
              _hover={{ opacity: 0.7 }}
              onClick={() => {
                setShowSelectPanel(!showSelectPanel);
              }}
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
              {patternPads.map((pad) => {
                return (
                  <PatternPad
                    key={pad.id}
                    name={pad.name}
                    imageSrc={pad.imageSrc}
                    isActive={curPattern === pad.name}
                    onHold={handler.onPatternHold}
                    onMouseDown={handler.onPatternMouseDown}
                  />
                );
              })}
              {slotPads.map((pad) => {
                return (
                  <Box
                    key={pad.id}
                    pos="relative"
                    p="2px"
                    w="25%"
                    onMouseDown={() => {
                      if (isMobile) return;
                      // handler.onPadTouch(pad.name);
                    }}
                    onTouchStart={() => {
                      if (!isMobile) return;
                      // handler.onPadTouch(pad.name);
                    }}
                  >
                    <PadLight myPadName={pad.name} activePad={activePad} />
                    <Image src={pad.imageSrc} alt={pad.name} cursor="pointer" />
                  </Box>
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </Box>
      <Box
        onClick={() => {
          console.log(samplePlayerRef.current);
        }}
      >
        console(現在的samplePlayerRef)
      </Box>
    </Box>
  );
};

export default CustomizeMachine;