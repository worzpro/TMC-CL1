import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import * as Tone from "tone";

import artists from "@/dummy/artists";
import pads from "@/dummy/pads";

import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";
import Loading from "@/components/machine/Loading";
import FxPanel from "@/components/machine/FxPanel";

interface MachineProps {
  isMenuOpen: boolean;
  isToneStarted: boolean;
}
interface LooseObject {
  [key: string]: any;
}

const Machine = ({ isMenuOpen, isToneStarted }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isHold, setIsHold] = useState<boolean>(false);
  const [showFX, setShowFX] = useState<boolean>(false);
  const [showSample, setShowSample] = useState<boolean>(false);
  const [curSeq, setCurSeq] = useState<string>("SEQ.1");
  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [gifs, setGifs] = useState<string[]>([]);
  const [activePad, setActivePad] = useState<string>("");
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const router = useRouter();
  const pathName = router.pathname.split("/")[2];
  let timeoutID: any = null;

  // dummy data 後處理
  const padsArr = Object.values(pads).sort((a, b) => a.id - b.id);
  const curSeqData = artists[pathName]?.[curSeq];

  const playerRef = useRef<any>(null);

  const handler = {
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
    setJam: (seq: string, isJamming: boolean) => {
      const { fullPlayer, jamPlayer } = playerRef.current[seq];
      fullPlayer.mute = isJamming;
      jamPlayer.mute = !isJamming;
    },
    toggleJam: (seq: string) => {
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

        handler.setJam(seq, isJamming);
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
    onChangeGif: (curGifData: LooseObject, padName: string) => {
      if (!curGifData?.src) return;

      if (pathName !== "sonia" && pathName !== "enno-chunho") {
        setGifs(curSeqData.waitGif);
        setGifs([...gifs, curGifData.src]);

        setTimeout(() => {
          setGifs(curSeqData.waitGif);
        }, curGifData.duration);
      }

      if (pathName === "sonia") {
        handler.soniaChangeGif(curGifData, padName);
      }
      if (pathName === "enno-chunho") {
        handler.ennoChangeGif(curGifData, padName);
      }
    },
    soniaChangeGif: (curGifData: LooseObject, padName: string) => {
      if (padName == "1" || padName == "2") {
        setGifs((prev: any) => {
          let newGifs = [...prev];
          newGifs[0] = curGifData.src;
          return newGifs;
        });
        // 如果之前有計時器，先清除
        if (timeoutID) {
          clearTimeout(timeoutID);
        }
        // 設定新的計時器
        timeoutID = setTimeout(() => {
          setGifs(curSeqData.waitGif);
        }, curGifData.duration);
      }

      if (
        padName == "3" ||
        padName == "4" ||
        padName == "5" ||
        padName == "6" ||
        padName == "7"
      ) {
        setGifs((prev: any) => {
          let newGifs = [...prev].filter(
            (item) =>
              item !== "/images/gif/sonia/sonia-walk-2-fast-bright.webp" &&
              item !== curGifData.src
          );
          newGifs.push(curGifData.src);
          return newGifs;
        });
        setTimeout(() => {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            if (newGifs.length < 3) {
              return curSeqData.waitGif;
            } else return newGifs;
          });
        }, curGifData.duration);
      }

      if (padName == "8") {
        setGifs((prev: any) => {
          let newGifs = [...prev].filter((item) => item !== curGifData.src);
          newGifs.push(curGifData.src);
          return newGifs;
        });
        setTimeout(() => {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            return newGifs;
          });
        }, curGifData.duration);
      }
    },
    ennoChangeGif: (curGifData: LooseObject, padName: string) => {
      if (curSeq == "SEQ.1") {
        if (padName == "1" || padName == "2") {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            newGifs.push(curGifData.src);
            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              return newGifs;
            });
          }, curGifData.duration);
        }
        if (
          padName == "3" ||
          padName == "4" ||
          padName == "5" ||
          padName == "7"
        ) {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter(
              (item) =>
                item !== "/images/gif/enno-chunho/enno_seq1_spark.webp" &&
                item !== curGifData.src
            );
            newGifs.push(curGifData.src);

            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              if (newGifs.length < 2) {
                return curSeqData.waitGif;
              } else return newGifs;
            });
          }, curGifData.duration);
        }
        if (padName == "6") {
          setGifs((prev: any) => {
            let newGifs = [...prev];
            newGifs = [...newGifs, ...curGifData.src];
            return newGifs;
          });
          // 如果之前有計時器，先清除
          if (timeoutID) {
            clearTimeout(timeoutID);
          }
          // 設定新的計時器
          timeoutID = setTimeout(() => {
            setGifs(curSeqData.waitGif);
          }, curGifData.duration);
        }
        if (padName == "8") {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            newGifs.push(curGifData.src);
            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              return newGifs;
            });
          }, curGifData.duration);
        }
      }
      if (curSeq == "SEQ.2") {
        if (padName == "1" || padName == "2") {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            newGifs.push(curGifData.src);

            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              return newGifs;
            });
          }, curGifData.duration);
        }

        if (padName == "3" || padName == "4") {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter(
              (item) =>
                item !== "/images/gif/enno-chunho/enno_seq2_spark.webp" &&
                item !== curGifData.src
            );
            newGifs.push(curGifData.src);

            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              if (newGifs.length < 2) {
                return curSeqData.waitGif;
              } else return newGifs;
            });
          }, curGifData.duration);
        }

        if (padName == "5" || padName == "6") {
          setGifs([curGifData.src]);
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              if (newGifs.length < 2) {
                return curSeqData.waitGif;
              } else return newGifs;
            });
          }, curGifData.duration);
        }

        if (padName == "7" || padName == "8") {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            newGifs.push(curGifData.src);
            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter((item) => item !== curGifData.src);
              return newGifs;
            });
          }, curGifData.duration);
        }
      }
      if (curSeq == "SEQ.3" || curSeq == "SEQ.4") {
        setGifs((prev: any) => {
          let newGifs = [...prev].filter((item) => item !== curGifData.src);
          newGifs.push(curGifData.src);
          return newGifs;
        });
        setTimeout(() => {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter((item) => item !== curGifData.src);
            return newGifs;
          });
        }, curGifData.duration);
      }
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
      handler.onChangeGif(curGifData, padName);
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

  // 初始化預設gifs
  useEffect(() => {
    if (!curSeqData) return;
    setGifs(curSeqData.waitGif);
  }, [curSeqData]);

  // 判斷使用者裝置
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));
  }, []);

  // 初始化
  useEffect(() => {
    if (isToneStarted) {
      playerRef.current = handler.createPlayers();
      const { bpm } = curSeqData.audios.seqAudio;
      Tone.Transport.bpm.value = bpm;
      const { fullPlayer, jamPlayer } = playerRef.current[curSeq];
      handler.setJam(curSeq, isJamming);
      fullPlayer.start(0);
      jamPlayer.start(0);
    }
  }, [isToneStarted]);

  return (
    <Box
      // 外層容器
      pos="absolute"
      overflow="hidden"
      w="100%"
      borderRadius="8px"
      top={{
        base: isMenuOpen ? "700px" : "70px",
        md: isMenuOpen ? "700px" : "100px",
      }}
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
            h={{ base: "182px", sm: "310px" }}
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

            {!showFX && !showSample && (
              <Box pos="relative" flex="1" my="8px">
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
                  zIndex="100"
                />

                {/* Gif */}
                <Center
                  w="100%"
                  h="100%"
                  maxH={{ base: "95px", sm: "240px" }}
                  overflow="hidden"
                  pos="relative"
                >
                  {gifs.map((gif: string, index: number) => (
                    <Image
                      key={index}
                      pos="absolute"
                      top="0"
                      left="0"
                      w="100%"
                      h="100%"
                      src={gif}
                      opacity={gif?.includes("透明度65") ? 0.65 : 1}
                      zIndex={index}
                    />
                  ))}
                </Center>
              </Box>
            )}
            {showFX && <FxPanel isHold={isHold} />}

            <Flex
              // 功能按鈕區
              pl="2px"
              justify="space-between"
              gap="6px"
            >
              <HStack
                color="#4D4D4D"
                spacing="0px"
                textStyle="en_special_md_bold"
              >
                <HStack pos="relative">
                  <Box bgColor="#EBEBEB" p="2px 14px">
                    FX
                  </Box>
                  {showFX && (
                    <Image
                      pos="absolute"
                      src="/images/screen-arrow.svg"
                      alt="arrow"
                      transform="translateY(-50%)"
                      top="50%"
                      right="-8px"
                    />
                  )}
                </HStack>
                <HStack pos="relative">
                  <Box ml="18px" bgColor="#EBEBEB" p="2px 14px">
                    SAMPLE
                  </Box>
                  {showSample && (
                    <Image
                      pos="absolute"
                      src="/images/screen-arrow.svg"
                      alt="arrow"
                      transform="translateY(-50%)"
                      top="50%"
                      right="-8px"
                    />
                  )}
                </HStack>
              </HStack>
              <HStack w={showFX  ? "100%" : "auto"}>
                {showFX && (
                  <Box
                    flex="1"
                    border={isHold ? "3px solid #896C42" : "3px solid black"}
                    textAlign="center"
                    rounded="20px"
                    bgColor={isHold ? "#E0B472" : "#686F73"}
                    color="#4D4D4D"
                    textStyle="en_special_md_bold"
                    cursor="pointer"
                    onClick={() => {
                      setIsHold((prev) => !prev);
                    }}
                  >
                    Hold
                  </Box>
                )}
                <Image
                  w="26px"
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
            pl="6px"
            spacing="28px"
          >
            <Image
              w="60px"
              src="/images/bbbb.png"
              cursor="pointer"
              onClick={() => {
                if (showSample) setShowSample(false);
                setShowFX((prev) => !prev);
              }}
            />
            <Image
              w="60px"
              src="/images/bbbb.png"
              cursor="pointer"
              onClick={() => {
                if (showFX) setShowFX(false);
                setShowSample((prev) => !prev);
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
              {padsArr.map((pad) => (
                <Box
                  key={pad.id}
                  pos="relative"
                  p="2px"
                  w="25%"
                  onMouseDown={() => {
                    if (isMobile) return;
                    handler.onPadTouch(pad.name);
                  }}
                  onTouchStart={() => {
                    if (!isMobile) return;
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
