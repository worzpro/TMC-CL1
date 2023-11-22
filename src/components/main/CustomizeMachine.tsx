import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

import Loading from "@/components/machine/Loading";
import SampleBtn from "@/components/machine/SampleBtn";
import PatternPad from "@/components/machine/PatternPad";
import SlotPad from "@/components/machine/SlotPad";
import Bpm from "@/components/machine/Bpm";
import SampleSelectPanel from "@/components/machine/SampleSelectPanel";

import pads from "@/dummy/pads";
import allSamples from "@/dummy/allSamples";
import defaultSamples from "@/dummy/customize/defaultSamples";

import {
  debounce,
  generate2DArray,
  clone2DArray,
  cloneAllSlots,
  getSeqSlotOffsetFromIndex,
  getSeqLoopStartBar,
  getSeqLoopEndBar,
} from "@/utils";
import { createSequencer } from "@/model";

import {
  NUMBER_OF_SEQ,
  NUMBER_OF_PATTERNS,
  NUMBER_OF_SAMPLES,
  NUMBER_OF_SLOTS,
  PREP_BEAT_BARS,
  PREP_BEAT_SLOTS,
} from "@/dummy/constants";
import { SEQ_INDEX_MAP, PATTERN_INDEX_MAP } from "@/map";

interface MachineProps {
  isMenuOpen: boolean;
  isToneStarted: boolean;
}
interface LooseObject {
  [key: string]: any;
}

/// 常數 ////////////////////////////////////////////
const SAMPLES = allSamples;
const DEFAULT_SAMPLES = defaultSamples;

const patternPads = Object.values(pads).filter((pad) => pad.id < 5);
const slotPads = Object.values(pads)
  .filter((pad) => pad.id > 4)
  .sort((a, b) => a.id - b.id);

const scheduledRegister = generate2DArray(
  NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS * NUMBER_OF_SEQ) + PREP_BEAT_SLOTS,
  NUMBER_OF_SAMPLES
);

const debouncedSetBpm = debounce((value) => {
  console.log("set bpm to: ", value);
  Tone.Transport.bpm.value = value;
}, 500);
////////////////////////////////////////////////////

const CustomizeMachine = ({ isMenuOpen, isToneStarted }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [bpm, setBpm] = useState(120);
  const [playMetronome, setPlayMetronome] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showSelectPanel, setShowSelectPanel] = useState<boolean>(false);

  const [curSeq, setCurSeq] = useState<string>("SEQ.1");
  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [curPosition, setCurPosition] = useState<number | null>(null);

  const [curSamples, setCurSamples] = useState<any[]>(DEFAULT_SAMPLES); // 現在面板上的8個samples
  const [curSample, setCurSample] = useState<any>({
    id: "customize-37",
    artist: "customize",
    index: 8,
  }); // 目前面板上選擇的sample(id, index)，對應範例的curSampleIndex
  const [curPattern, setCurPattern] = useState<string>("a"); // 目前選擇的段落(a,b,c,d)

  const [padState, setPadState] = useState<any>(createSequencer()); // 4個seq所有slot的狀態
  const [activePad, setActivePad] = useState<string>(""); // TODO: 這個變數有用到嗎？

  const metronome1Player = useRef<any>(null);
  const metronome2Player = useRef<any>(null);
  const samplePlayers = useRef<any>(null); // 全部sample的player
  const slotsRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const lengthRef = useRef(NUMBER_OF_SLOTS);
  const loopStartRef = useRef("1:0:0");

  const handler = {
    createSamplePlayers: () => {
      // 將所有的sample創建成player
      let samplePlayer: LooseObject = {};
      SAMPLES.forEach((sample: LooseObject) => {
        if (sample.src) {
          samplePlayer[sample.id] = new Tone.Player(sample.src).toDestination();
        }
      });
      return samplePlayer;
    },
    createPlayerRef: () => {
      return DEFAULT_SAMPLES.map(
        ({ id }: { id: string }) => samplePlayers.current[id]
      );
    },
    createMetronomePlayer: () => {
      return {
        metronome1: new Tone.Player("/audio/metronome1.wav").toDestination(),
        metronome2: new Tone.Player("/audio/metronome2.wav").toDestination(),
      };
    },
    playOnBeat: (time: number) => {
      const slotIndex = Math.round((Tone.Transport.getTicksAtTime() / 192) * 2);
      setCurPosition(slotIndex);

      playerRef.current.forEach((player: any, sampleIndex: number) => {
        if (slotsRef.current[sampleIndex][slotIndex]) {
          player.start(time);
        }
      });

      // in recording mode, register on the next slot
      const previousSlotIndex =
        slotIndex - 1 < 8 ? lengthRef.current - 1 + 8 : slotIndex - 1;

      scheduledRegister[previousSlotIndex].forEach(
        (shouldRegister, sampleIndex) => {
          if (shouldRegister) {
            slotsRef.current[sampleIndex][previousSlotIndex] = true;
            scheduledRegister[previousSlotIndex][sampleIndex] = false;
          }
        }
      );
    },
    onBpmChange: (value: number) => {
      setBpm(value);
      debouncedSetBpm(value);
    },
    toggleMetronome: () => {
      metronome1Player.current.mute = !metronome1Player.current.mute;
      metronome2Player.current.mute = !metronome2Player.current.mute;
    },
    unmuteMetronome: () => {
      metronome1Player.current.mute = false;
      metronome2Player.current.mute = false;
    },
    muteMetronome: () => {
      metronome1Player.current.mute = true;
      metronome2Player.current.mute = true;
    },
    stopRecording: () => {
      const curSeqIndex = SEQ_INDEX_MAP[curSeq];
      Tone.Transport.loopStart = padState.seqs[curSeqIndex].loopStart;
      if (!playMetronome) {
        handler.muteMetronome();
      }
      setIsRecording(false);
    },
    clearAllSlots: () => {
      const start = getSeqSlotOffsetFromIndex(curSeq);
      const newSlots = cloneAllSlots(slotsRef.current);
      newSlots.forEach((row) => {
        row.fill(false, start, start + NUMBER_OF_PATTERNS * NUMBER_OF_SLOTS);
      });
      slotsRef.current = newSlots;

      setPadState((prevState: any) => {
        return { ...prevState, slots: clone2DArray(newSlots) };
      });
    },
    onPatternHold: useCallback(
      (index: number) => {
        const curSeqIndex = SEQ_INDEX_MAP[curSeq];
        const loopStartBar = getSeqLoopStartBar(padState.seqs[curSeqIndex]);

        const loopEndBar = loopStartBar + (index + 1);
        const loopEnd = `${loopEndBar}:0:0`;
        Tone.Transport.loopEnd = loopEnd;

        setPadState((prevState: any) => {
          const newSeqs = [...prevState.seqs];

          newSeqs[curSeqIndex].loopEnd = loopEnd;
          return { ...prevState, seqs: newSeqs };
        });
        lengthRef.current = (index + 1) * NUMBER_OF_SLOTS;
      },
      [padState, curSeq]
    ),
    onPatternMouseDown: useCallback(
      (name: string) => {
        setCurPattern(name);
      },
      [setCurPattern]
    ),
    onSampleMouseDown: (id: string, artist: string, index: number) => {
      playerRef.current[index].start();
      if (isRecording) {
        const slotIndex =
          (Math.round((Tone.Transport.getTicksAtTime() / 192) * 2 - 8) %
            lengthRef.current) +
          getSeqSlotOffsetFromIndex(curSeq);

        scheduledRegister[slotIndex][index] = true;

        setPadState((prevState: any) => {
          const newSlots = prevState.slots.map((arr: any[]) => [...arr]);
          newSlots[index][slotIndex] = true;
          return { ...prevState, slots: newSlots };
        });
      }
      setCurSample({ id, artist, index });
    },
    onSeqClick: (seqName: string) => {
      const seqIndex = SEQ_INDEX_MAP[seqName];
      if (seqName === curSeq) {
        return;
      }
      if (isRecording) {
        setIsRecording(false);
        setCurSeq(seqName);
        setCurPattern("a");
        Tone.Transport.loopStart = padState.seqs[seqIndex].loopStart;
        Tone.Transport.loopEnd = padState.seqs[seqIndex].loopEnd;
        Tone.Transport.position = padState.seqs[seqIndex].loopStart;
      }
      if (isPlaying) {
        setPendingSeq(seqName);
        const curTick = Tone.Transport.getTicksAtTime();
        const curMeasure = Math.floor(curTick / (192 * 4));

        const switch_time = `${curMeasure + 1}:0:0`;
        Tone.Transport.loopEnd = `${curMeasure + 2}:0:0`;

        Tone.Transport.scheduleOnce(() => {
          Tone.Transport.loopStart = padState.seqs[seqIndex].loopStart;
          loopStartRef.current = padState.seqs[seqIndex].loopStart;
          Tone.Transport.loopEnd = padState.seqs[seqIndex].loopEnd;
          Tone.Transport.position = padState.seqs[seqIndex].loopStart;
          setCurSeq(seqName);
          setCurPattern("a");
          setPendingSeq(null);
        }, switch_time);
      } else {
        setCurSeq(seqName);
        setCurPattern("a");
        Tone.Transport.loopStart = padState.seqs[seqIndex].loopStart;
        loopStartRef.current = padState.seqs[seqIndex].loopStart;
        Tone.Transport.loopEnd = padState.seqs[seqIndex].loopEnd;
        Tone.Transport.position = padState.seqs[seqIndex].loopStart;
      }
    },
    onSlotPadClick: (slotIndex: number) => {
      const curSampleIndex = curSample.index;
      slotsRef.current[curSampleIndex][slotIndex] =
        !slotsRef.current[curSampleIndex][slotIndex];

      setPadState((prevState: any) => {
        const newSlots = prevState.slots.map((arr: any[]) => [...arr]);
        newSlots[curSampleIndex][slotIndex] =
          !newSlots[curSampleIndex][slotIndex];

        return { ...prevState, slots: newSlots };
      });
    },
  };

  // 判斷使用者裝置
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));
  }, []);

  // initialize
  useEffect(() => {
    if (isToneStarted) {
      samplePlayers.current = handler.createSamplePlayers();
      playerRef.current = handler.createPlayerRef();
      slotsRef.current = cloneAllSlots(padState.slots);
      metronome1Player.current = handler.createMetronomePlayer().metronome1;
      metronome2Player.current = handler.createMetronomePlayer().metronome2;

      Tone.Transport.loop = true;
      Tone.Transport.setLoopPoints("1:0:0", "2:0:0");
      Tone.Transport.position = "1:0:0";

      handler.muteMetronome();
    }
  }, [isToneStarted]);

  // metronome
  useEffect(() => {
    let eventId: any = null;
    if (isToneStarted) {
      eventId = Tone.Transport.scheduleRepeat(
        (time) => {
          const beat = Math.floor(
            (Math.floor(Tone.Transport.getTicksAtTime() / 192) % 4) + 1
          );
          const slotIndex = Math.round(
            (Tone.Transport.getTicksAtTime() / 192) * 2
          );

          if (beat === 1) {
            metronome1Player.current?.start(time);
          } else {
            metronome2Player.current?.start(time);
          }
        },
        "4n",
        "0:0:0"
      );
    }
    return () => {
      Tone.Transport.clear(eventId);
    };
  }, [isToneStarted]);

  // hacky way to make sure prep beats only happen once
  useEffect(() => {
    let id: any = null;
    if (isRecording) {
      id = Tone.Transport.scheduleOnce(() => {
        Tone.Transport.loopStart = loopStartRef.current;
        Tone.Transport.position = loopStartRef.current;
      }, "1:0:0");
    }
    return () => {
      Tone.Transport.clear(id);
    };
  }, [isRecording]);

  // main function to play samples on each 8th note
  useEffect(() => {
    let id: any = null;
    if (isToneStarted) {
      id = Tone.Transport.scheduleRepeat(handler.playOnBeat, "8n");
    }
    return () => {
      Tone.Transport.clear(id);
    };
  }, [isToneStarted]);

  // console.log(slotPads)
  return (
    <Box
      // 外層容器
      pos="absolute"
      overflow="hidden"
      w="100%"
      borderRadius="8px"
      top={{
        base: isMenuOpen ? "700px" : "60px",
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
            {!showSelectPanel && (
              <HStack
                // SEQs
                spacing="6px"
              >
                {["SEQ.1", "SEQ.2", "SEQ.3", "SEQ.4"].map((seq, index) => (
                  <Center
                    key={seq}
                    flex="1"
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
            )}

            <Box pos="relative" mb="4px">
              {showSelectPanel && (
                <SampleSelectPanel
                  isMobile={isMobile}
                  curSample={curSample}
                  setCurSample={setCurSample}
                  curSamples={curSamples}
                  setCurSamples={setCurSamples}
                  samplePlayers={samplePlayers}
                  playerRef={playerRef}
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
                          handler.onSampleMouseDown(
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
              pl="2px"
              justify="space-between"
            >
              <HStack
                color="#4D4D4D"
                spacing="8px"
                textStyle="en_special_md_bold"
              >
                {["FX", "SAMPLE"].map((buttonLabel) => (
                  <Box key={buttonLabel} bgColor="#EBEBEB" p="2px 12px">
                    {buttonLabel}
                  </Box>
                ))}
              </HStack>
              <HStack spacing="4px">
                <Bpm onChange={handler.onBpmChange} />
                <Image
                  src="/images/stop.svg"
                  alt="stop"
                  cursor="pointer"
                  onClick={() => {
                    Tone.Transport.stop();
                    handler.clearAllSlots();
                    Tone.Transport.loopStart = "0:0:0";
                    Tone.Transport.position = "0:0:0";
                    handler.unmuteMetronome();
                    setIsRecording(true);
                    setCurPosition(0);
                    Tone.Transport.start();
                    setIsPlaying(true);
                  }}
                />
                <Image
                  src="/images/restart.svg"
                  alt="restart"
                  cursor="pointer"
                  onClick={(e) => {
                    const curSeqIndex = SEQ_INDEX_MAP[curSeq];
                    handler.stopRecording();
                    if (e.detail === 1) {
                      if (isRecording) {
                        Tone.Transport.stop();
                        Tone.Transport.position =
                          padState.seqs[curSeqIndex].loopStart;
                        setCurPosition(0);
                      }
                      Tone.Transport.pause();
                      setIsPlaying(false);
                    } else if (e.detail === 2) {
                      Tone.Transport.stop();
                      Tone.Transport.position =
                        padState.seqs[curSeqIndex].loopStart;
                      setCurPosition(0);
                    }
                  }}
                />
                <Box
                  cursor="pointer"
                  onClick={async () => {
                    if (isRecording) {
                      handler.stopRecording();
                    }
                    if (!isPlaying) {
                      Tone.Transport.start();
                      setIsPlaying(true);
                    } else {
                      Tone.Transport.pause();
                      setIsPlaying(false);
                    }
                  }}
                >
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
            spacing="10px"
          >
            <Image
              w="60px"
              src="/images/bbbb.png"
              cursor="pointer"
              _hover={{ opacity: 0.7 }}
            />
            <Image
              w="60px"
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
              {/* a, b, c, d */}
              {patternPads.map((pad, index) => {
                const patternStartIndex =
                  getSeqSlotOffsetFromIndex(curSeq) + index * NUMBER_OF_SLOTS;
                const patternEndIndex = patternStartIndex + NUMBER_OF_SLOTS - 1;
                const isBeingPlayed =
                  curPosition !== null
                    ? isPlaying &&
                      curPosition >= patternStartIndex &&
                      curPosition <= patternEndIndex
                    : false;
                const curSeqIndex = SEQ_INDEX_MAP[curSeq];
                const isRegistered =
                  index <
                  getSeqLoopEndBar(padState.seqs[curSeqIndex]) -
                    getSeqLoopStartBar(padState.seqs[curSeqIndex]);

                return (
                  <PatternPad
                    key={pad.id}
                    name={pad.name}
                    index={index}
                    imageSrc={pad.imageSrc}
                    isActive={curPattern === pad.name}
                    isRegistered={isRegistered}
                    isBeingPlayed={isBeingPlayed}
                    onMouseDown={handler.onPatternMouseDown}
                    onHold={handler.onPatternHold}
                  />
                );
              })}

              {/* 1 ~ 8 */}
              {slotPads.map((pad, index) => {
                const fixedIndex = index < 4 ? index + 4 : index - 4;
                const seqOffset = getSeqSlotOffsetFromIndex(curSeq);

                const patternOffest =
                  PATTERN_INDEX_MAP[curPattern] * NUMBER_OF_SLOTS;
                const slotIndex = fixedIndex + patternOffest + seqOffset;
                const labelIndex = fixedIndex + patternOffest;

                return (
                  <SlotPad
                    key={slotIndex}
                    name={pad.name}
                    imageSrc={pad.imageSrc}
                    isMobile={isMobile}
                    labelIndex={labelIndex}
                    isRegistered={padState["slots"][curSample.index][slotIndex]}
                    isActive={isPlaying && curPosition === pad.nameslotIndex}
                    onClick={() => {
                      handler.onSlotPadClick(slotIndex);
                    }}
                  />
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default CustomizeMachine;
