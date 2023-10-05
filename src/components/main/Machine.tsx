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
interface LooseObject {
  [key: string]: any;
}

const Machine = ({ isMenuOpen }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isToneStarted, setIsToneStarted] = useState<boolean>(false);
  const [curSeq, setCurSeq] = useState<string>("SEQ.1");
  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [insertGif, setInsetGif] = useState<string>("");
  const [activePad, setActivePad] = useState<string>("");
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const router = useRouter();
  const pathName = router.pathname.split("/")[2];

  // dummy data 後處理
  const padsArr = Object.values(pads).sort((a, b) => a.id - b.id);
  const curSeqData = artists[pathName]?.[curSeq];

  const playerRef = useRef<any>(null);

  const handler = {
    initiateTone: async () => {
      await Tone.loaded();
      await Tone.start();
      setIsToneStarted(true);
    },
    createNewLoopedAndSyncedPlayer: (src: string) => {
      const newPlayer = new Tone.Player(src).toDestination();
      newPlayer.loop = true;
      newPlayer.volume.value = -10;
      newPlayer.sync();
      return newPlayer;
    },
    createPlayers: () => {
      const artistData = artists[pathName];
      const players = Object.entries(artistData).map(
        ([seqName, seqData]: any) => {
          const { src, srcJam } = seqData.audios.seqAudio;
          const samplesAudios = seqData.audios.sampleAudios;
          const fullPlayer = handler.createNewLoopedAndSyncedPlayer(src);
          const jamPlayer = handler.createNewLoopedAndSyncedPlayer(srcJam);
          const samplePlayers = samplesAudios.map((sampleAudio: LooseObject) =>
            new Tone.Player(sampleAudio.src).toDestination()
          );
          return [seqName, { fullPlayer, jamPlayer, samplePlayers }];
        }
      );

      return Object.fromEntries(players);
    },
    clearAllPlayerScheduledEvents: () => {
      Object.values(playerRef.current).forEach((player: any) => {
        const { fullPlayer, jamPlayer } = player;
        fullPlayer.unsync();
        jamPlayer.unsync();
        fullPlayer.sync();
        jamPlayer.sync();
      });
    },
    setJam: (seq:string,isJamming: boolean) => {
      const { fullPlayer, jamPlayer } = playerRef.current[seq];
      fullPlayer.mute = isJamming;
      jamPlayer.mute = !isJamming;
    },
    toggleJam: (seq:string) => {
      const { fullPlayer, jamPlayer } = playerRef.current[seq];
      fullPlayer.mute = !isJamming;
      jamPlayer.mute = isJamming;
    },
    onSeqClick: (seq: string) => {
      if (curSeq === seq) return;

      if (isPlaying) {
        // switch seq on the next first beat
        setPendingSeq(seq);
        const curTick = Tone.Transport.getTicksAtTime();
        const curMeasure = Math.floor(curTick / (192 * 4));

        const switch_time = `${curMeasure + 1}:0:0`;
        playerRef.current[curSeq].fullPlayer.stop(switch_time);
        playerRef.current[curSeq].jamPlayer.stop(switch_time);

        handler.setJam(seq,isJamming);
        playerRef.current[seq].fullPlayer.start(switch_time);
        playerRef.current[seq].jamPlayer.start(switch_time);

        Tone.Transport.scheduleOnce(() => {
          setPendingSeq(null);
          setCurSeq(seq);
        }, switch_time);
      } else {
        handler.clearAllPlayerScheduledEvents();
        const { bpm } = curSeqData.audios.seqAudio;
        const { fullPlayer, jamPlayer } = playerRef.current[seq];
        Tone.Transport.bpm.value = bpm;

        fullPlayer.start(0);
        jamPlayer.start(0);
        setCurSeq(seq);
      }
    },
    onChangeGif: (curGifData: { [key: string]: any }) => {
      if (!curGifData?.src) return;
      // if (insertGif !== "") setInsetGif("");
      setInsetGif(curGifData.src);
      setTimeout(() => {
        setInsetGif("");
      }, curGifData.duration);
    },
    onChangePadLight: (padName: string) => {
      if (activePad !== "") setActivePad("");
      setActivePad(padName);
      setTimeout(() => {
        setActivePad("");
      }, 100);
    },
    onPadTouch: (padName: string) => {
      const padNum = parseInt(padName);
      if (!padNum) return;

      const curGifData = curSeqData.padGifs[padNum - 1];
      handler.onChangeGif(curGifData);
      handler.onChangePadLight(padName);

      const { samplePlayers } = playerRef.current[curSeq];
      try {
        samplePlayers[padNum - 1].start();
      } catch (err) {
        console.log(err);
      }
    },
    onPlayOrPause: async () => {
      if (!isPlaying) {
        await Tone.loaded();
        Tone.Transport.start();
        setIsPlaying(true);
      } else {
        Tone.Transport.pause();
        setIsPlaying(false);
      }
    },
    onStop: (event: any) => {
      if (event.detail === 1) {
        Tone.Transport.pause();
        if (isPlaying) {
          setIsPlaying(false);
        }
      } else if (event.detail === 2) {
        Tone.Transport.stop();

        // reset Transport
        handler.clearAllPlayerScheduledEvents();

        const { fullPlayer, jamPlayer } = playerRef.current[curSeq];
        const { bpm } = curSeqData.audios.seqAudio;
        Tone.Transport.bpm.value = bpm;
        fullPlayer.start(0);
        jamPlayer.start(0);
      }
    },
  };

  useEffect(() => {
    // 判斷使用者裝置
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));

    // 初始化 Tone
    handler.initiateTone();

    // 初始化 playerRef
    playerRef.current = handler.createPlayers();
  }, []);

  useEffect(() => {
    if (isToneStarted && playerRef.current) {
      const { bpm } = curSeqData.audios.seqAudio;
      Tone.Transport.bpm.value = bpm;
      const { fullPlayer, jamPlayer } = playerRef.current[curSeq];
      handler.setJam(curSeq,isJamming);
      fullPlayer.start(0);
      jamPlayer.start(0);
    }
  }, [isToneStarted, playerRef.current]);

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
                    handler.onSeqClick(seq);
                  }}
                >
                  {seq}
                </Center>
              ))}
            </HStack>

            <Box pos="relative">
              {/* Jam */}
              <Image
                pos="absolute"
                top="0"
                right="0"
                w="85px"
                src={isJamming ? "/images/jam_on.png" : "/images/jam_off.png"}
                cursor="pointer"
                onClick={() => {
                  handler.toggleJam(curSeq);
                  setIsJamming((prev) => !prev);
                }}
              />

              {/* Gif */}
              <Image
                w="100%"
                maxH={{ base: "100px", sm: "unset" }}
                src={insertGif || curSeqData["waitGif"]}
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
                  onClick={handler.onStop}
                />
                <Box cursor="pointer" onClick={handler.onPlayOrPause}>
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
                    handler.onPadTouch(pad.name);
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
