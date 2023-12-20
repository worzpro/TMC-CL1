import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

import Loading from "@/components/machine/Loading";
import SampleBtn from "@/components/machine/SampleBtn";
import PatternPad from "@/components/machine/PatternPad";
import SlotPad from "@/components/machine/SlotPad";
import Bpm from "@/components/machine/Bpm";
import SampleSelectPanel from "@/components/machine/SampleSelectPanel";
import WaveSurferPlayer from "@/components/machine/WaveSurferPlayer";
import FxPanel from "@/components/machine/FxPanel";

import pads from "@/dummy/pads";
import allSamples from "@/dummy/allSamples";
import defaultSamples from "@/dummy/customize/defaultSamples";

import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import Recording from "@/recording";

import {
  debounce,
  generate2DArray,
  clone2DArray,
  cloneAllSlots,
  getSeqSlotOffsetFromIndex,
  getSeqLoopStartBar,
  getSeqLoopEndBar,
  createChainedInsertAudioEffects,
  createSendAudioEffects,
  getCustomizationPlayers,
} from "@/utils";
import { createSequencer } from "@/model";

import {
  NUMBER_OF_SEQ,
  NUMBER_OF_PATTERNS,
  NUMBER_OF_SAMPLES,
  NUMBER_OF_SLOTS,
  PREP_BEAT_SLOTS,
  INSERT_EFFECTS,
  SEND_EFFECTS,
  RECORD_TIME_LIMIT,
  RECORDING_WAVECOLOR,
  READY_WAVECOLOR,
  NUMBER_OF_RECORDS,
  DEFAULT_WS_OPTIONS,
  REGION_OPTIONS,
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

////////////////////////////////////////////////////

const CustomizeMachine = ({ isMenuOpen, isToneStarted }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [playMetronome, setPlayMetronome] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showSelectPanel, setShowSelectPanel] = useState<boolean>(false);
  const [showFX, setShowFX] = useState<boolean>(false);
  const [showSampleRecord, setShowSampleRecord] = useState<boolean>(false);
  const [isHold, setIsHold] = useState<boolean>(false);

  const [curSeq, setCurSeq] = useState<string>("SEQ.1");
  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [curPosition, setCurPosition] = useState<number | null>(null);

  const [activePad, setActivePad] = useState<string>("");
  const [curSamples, setCurSamples] = useState<any[]>(DEFAULT_SAMPLES); // 現在面板上的8個samples
  const [curSample, setCurSample] = useState<any>({
    id: "customize-37",
    artist: "customize",
    index: 8,
  }); // 目前面板上選擇的sample(id, index)，對應範例的curSampleIndex
  const [curPattern, setCurPattern] = useState<string>("a"); // 目前選擇的段落(a,b,c,d)

  const [padState, setPadState] = useState<any>(createSequencer()); // 4個seq所有slot的狀態
  const [curRecordSlotIndex, setCurRecordSlotIndex] = useState<number>(0);
  const [count, setCount] = useState<number>(RECORD_TIME_LIMIT);
  const [recordState, setRecordState] = useState<any[]>([
    "empty",
    "empty",
    "empty",
    "empty",
  ]);

  const recordRef = useRef<any>();
  const recordContainerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement[]>([]);
  const resultWaveSurferRef = useRef<any>();
  const intervalRef = useRef<any>();
  const primaryWsRef = useRef<any>();

  const metronome1Player = useRef<any>(null);
  const metronome2Player = useRef<any>(null);
  const samplePlayerRef = useRef<any>(null); // 全部sample的player
  const slotsRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const insertEffectsRef = useRef<any>(null);
  const sendEffectsRef = useRef<any>(null);
  const lengthRef = useRef(NUMBER_OF_SLOTS);
  const loopStartRef = useRef("1:0:0");
  const DOUBLE_CLICK_DELAY = 300; // 雙擊間隔時間（毫秒）
  let lastTap = 0;

  const handler = {
    createSamplePlayers: () => {
      // 將所有的sample創建成player
      let samplePlayers: LooseObject = {};
      SAMPLES.forEach((sample: LooseObject) => {
        if (sample.src) {
          samplePlayers[sample.id] = new Tone.Player(sample.src);
        } else {
          // recordings
          samplePlayers[sample.id] = new Recording();
        }
      });
      return samplePlayers;
    },
    getDefaultPlayer: (samplePlayers: LooseObject) => {
      return DEFAULT_SAMPLES.map(({ id }: { id: string }) => samplePlayers[id]);
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
      const debouncedSetBpm = debounce((value) => {
        console.log("set bpm to: ", value);
        Tone.Transport.bpm.value = value;
      }, 500);
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
      playerRef.current?.[index]?.start();
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
    onFxChange: (effectObj: LooseObject, value: number) => {
      if (!showFX) return;
      const isChannel = effectObj.channelVariables !== undefined;
      const { key } = effectObj;
      if (isChannel) {
        const { variableKey, defaultValue } = effectObj.channelVariables[0];
        sendEffectsRef.current[key].channel.set({
          [variableKey]: value,
        });
        if (value == defaultValue) {
          sendEffectsRef.current[key].effect.disconnect();
        } else {
          sendEffectsRef.current[key].effect.toDestination();
        }
      } else {
        const { variableKey, defaultValue } = effectObj.variables[0];
        if (effectObj.shouldDisconnectOnMin) {
          /* Currently, we are utilizing `wet`. An alternative approach could involve employing a double-linked list for our `insertEffectsRef`
          * and utilizing the disconnect method to remove the effect when the value reaches the minimum.
          */
          if (value === defaultValue) {
            insertEffectsRef.current[key].effect.set({
              wet: 0,
            });
          } else {
            insertEffectsRef.current[key].effect.set({
              wet: 1,
            });
          }
        }
        insertEffectsRef.current[key].effect.set({
          [variableKey]: value,
        });
      }
    },
    onChangePadLight: (padId: string) => {
      if (activePad !== "") setActivePad("");
      setActivePad(padId);
      setTimeout(() => {
        setActivePad("");
      }, 100);
    },
    onSampleRecordDelete: () => {
      if (recordRef.current && !recordRef.current.isRecording()) {
        recordRef.current.startMic();
      }
      resultWaveSurferRef.current[curRecordSlotIndex].clearRecording();

      setRecordState((prev) => {
        const newState = [...prev];
        newState[curRecordSlotIndex] = "empty";
        return newState;
      });
    },
    onSampleRecordEnd: async (blob: any, curRecordSlotIndex: number) => {
      recordRef.current.stopMic();
      primaryWsRef.current.setOptions({
        waveColor: READY_WAVECOLOR,
      });
      const sampleUrl = URL.createObjectURL(blob);

      await resultWaveSurferRef.current[curRecordSlotIndex].player.load(
        sampleUrl
      );
      // create new ws of the recording
      const ws = WaveSurfer.create({
        ...DEFAULT_WS_OPTIONS,
        height: isMobile ? 124 : 252,
        container: resultContainerRef.current[curRecordSlotIndex],
        url: sampleUrl,
      });

      resultWaveSurferRef.current[curRecordSlotIndex].ws = ws;

      // enable region selection i.e. chopping the sample
      const wsRegions = ws.registerPlugin(RegionsPlugin.create());
      wsRegions.enableDragSelection(REGION_OPTIONS);
      wsRegions.on("region-created", (region) => {
        resultWaveSurferRef.current[curRecordSlotIndex].clearRegion();
        resultWaveSurferRef.current[curRecordSlotIndex].setRegion(region);
      });
      wsRegions.on("region-updated", (region) => {
        resultWaveSurferRef.current[curRecordSlotIndex].setRegionBoundary(
          region.start,
          region.end
        );
      });

      setRecordState((prev) => {
        const newState = [...prev];
        newState[curRecordSlotIndex] = "registered";
        return newState;
      });
    },
    startSampleRecording: () => {
      resultWaveSurferRef.current[curRecordSlotIndex].clearRecording();

      primaryWsRef.current.setOptions({
        waveColor: RECORDING_WAVECOLOR,
      });

      recordRef.current.startRecording();
      setRecordState((prev) => {
        const newState = [...prev];
        newState[curRecordSlotIndex] = "recording";
        return newState;
      });
    },
    stopSampleRecording: () => {
      recordRef.current.stopRecording();
      clearInterval(intervalRef.current);
      setCount(RECORD_TIME_LIMIT);
    },
    onSampleRecordMouseDown: (padId: string, index: number) => {
      handler.onChangePadLight(padId);
      // stop the current playing sample
      if (curRecordSlotIndex !== -1) {
        resultWaveSurferRef.current[curRecordSlotIndex].stop();
      }

      setCurRecordSlotIndex(index);
      if (recordState[index] === "empty") {
        return;
      } else if (recordState[index] === "registered") { 
        resultWaveSurferRef.current[index].start();
      }
    },
    onSampleRecordHold: (index: number) => {
      if (recordState[index] !== "empty" || !showSampleRecord) {
        return;
      }
      let count = RECORD_TIME_LIMIT;
      handler.startSampleRecording();
      const timer = setInterval(function () {
        setCount((prev) => prev - 1);
        count--;
        if (count < 0) {
          handler.stopSampleRecording();
        }
      }, 1000);

      intervalRef.current = timer;
    },
    onSampleRecordMouseUp: (index: number) => {
      if (recordState[index] === "recording") {
        handler.stopSampleRecording();
      }
    },
  };

  // 判斷使用者裝置
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));
  }, []);

  // 初始化
  useEffect(() => {
    if (isToneStarted) {
      const samplePlayers = handler.createSamplePlayers();
      const defaultPlayers = handler.getDefaultPlayer(samplePlayers);


      const players = getCustomizationPlayers(samplePlayers);
      const insertEffects = createChainedInsertAudioEffects(INSERT_EFFECTS);
      players.forEach((player: any) => {
        // player可能為undefined(若沒錄sample)
        player?.connect(insertEffects.input);
      });
      // main channel as opposed to auxiliary channels
      const playerChannel = new Tone.Channel().toDestination();
      insertEffects.output.connect(playerChannel);
      // auxiliary channels, i.e. send effects
      const sendEffects = createSendAudioEffects(SEND_EFFECTS);
      const sendEffectKeys = Object.keys(SEND_EFFECTS);
      sendEffectKeys.forEach((sendEffectKey: string) => {
        playerChannel.send(sendEffectKey);
      });

      playerRef.current = defaultPlayers;
      resultWaveSurferRef.current = defaultPlayers.slice(0, NUMBER_OF_RECORDS);
      samplePlayerRef.current = samplePlayers;
      insertEffectsRef.current = insertEffects;
      sendEffectsRef.current = sendEffects;

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

  // sample record
  useEffect(() => {
    if (!recordContainerRef.current) return;

    const ws = WaveSurfer.create({
      ...DEFAULT_WS_OPTIONS,
      height: isMobile ? 124 : 252,
      container: recordContainerRef.current,
    });
    primaryWsRef.current = ws;
    const record = ws.registerPlugin(RecordPlugin.create());
    showSampleRecord && record.startMic();
    const unSubscribe = record.on("record-end", (blob) =>
      handler.onSampleRecordEnd(blob, curRecordSlotIndex)
    );
    recordRef.current = record;

    return () => {
      ws.destroy();
      unSubscribe();
    };
  }, [recordContainerRef, curRecordSlotIndex, showSampleRecord]);

  return (
    <Box
      // 外層容器
      pos="absolute"
      overflow="hidden"
      w="100%"
      borderRadius="8px"
      top={{
        base: isMenuOpen ? "700px" : "50px",
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
          gap="8px"
        >
          <Flex
            // 螢幕容器
            direction="column"
            border="3px solid black"
            w="100%"
            h={{ base: "182px", sm: "324px" }}
            maxH="382px"
            borderRadius="8px"
            bgColor="rgb(197, 218, 227)"
            pt={{ base: "6px", sm: "12px" }}
            px="8px"
            pb="1px"
            justify="space-between"
            pos="relative"
            overflow="hidden"
          >
            <Loading />
            {!showSelectPanel && !showSampleRecord && (
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

            <WaveSurferPlayer
              hidden={!showSampleRecord}
              recordState={recordState}
              curRecordSlotIndex={curRecordSlotIndex}
              recordContainerRef={recordContainerRef}
              resultContainerRef={resultContainerRef}
              count={count}
            />
            <Box pos="relative" mb="4px" hidden={showSampleRecord}>
              {showSelectPanel && (
                <SampleSelectPanel
                  isMobile={isMobile}
                  curSample={curSample}
                  setCurSample={setCurSample}
                  curSamples={curSamples}
                  setCurSamples={setCurSamples}
                  samplePlayerRef={samplePlayerRef}
                  playerRef={playerRef}
                />
              )}
              <FxPanel
                hidden={!showFX}
                isHold={isHold}
                onFxChange={handler.onFxChange}
              />
              {/* curSamples */}
              {!showSelectPanel && !showSampleRecord && !showFX && (
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
                textStyle="en_special_md_bold"
                fontSize="14px"
                spacing="18px"
                align="end"
              >
                <HStack pos="relative">
                  <Box bgColor="#EBEBEB" p="4px 12px">
                    FX
                  </Box>
                  <Image
                    hidden={!showFX}
                    pos="absolute"
                    src="/images/screen-arrow.svg"
                    alt="arrow"
                    transform="translateY(-50%)"
                    top="50%"
                    right="-8px"
                  />
                </HStack>
                <HStack pos="relative">
                  <Box bgColor="#EBEBEB" p="4px 12px">
                    SAMPLE
                  </Box>
                  <Image
                    hidden={!showSampleRecord}
                    pos="absolute"
                    src="/images/screen-arrow.svg"
                    alt="arrow"
                    transform="translateY(-50%)"
                    top="50%"
                    right="-8px"
                  />
                </HStack>
              </HStack>
              <HStack spacing="4px" mb="6px" >
                <Box
                  hidden={!showFX}
                  w="90px"
                  border={isHold ? "3px solid #896C42" : "3px solid black"}
                  textAlign="center"
                  rounded="20px"
                  bgColor={isHold ? "#E0B472" : "#686F73"}
                  color="#4D4D4D"
                  textStyle="en_special_md_bold"
                  lineHeight="20px"
                  cursor="pointer"
                  onClick={() => {
                    setIsHold((prev) => !prev);
                  }}
                >
                  Hold
                </Box>
                <Bpm
                  hidden={showFX || showSampleRecord}
                  onChange={handler.onBpmChange}
                  toggleMetronome={handler.toggleMetronome}
                />
                <Image
                  hidden={showFX || showSampleRecord}
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
                  hidden={showSampleRecord}
                  src="/images/restart.svg"
                  alt="restart"
                  cursor="pointer"
                  onClick={(e) => {
                    const curSeqIndex = SEQ_INDEX_MAP[curSeq];
                    handler.stopRecording();

                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    const isDoubleTap =
                      tapLength < DOUBLE_CLICK_DELAY && tapLength > 0;

                    if (e.detail === 1 || !isDoubleTap) {
                      if (isRecording) {
                        Tone.Transport.stop();
                        Tone.Transport.position =
                          padState.seqs[curSeqIndex].loopStart;
                        setCurPosition(0);
                      }
                      Tone.Transport.pause();
                      setIsPlaying(false);
                    }

                    if (e.detail === 2 || isDoubleTap) {
                      Tone.Transport.stop();
                      Tone.Transport.position =
                        padState.seqs[curSeqIndex].loopStart;
                      setCurPosition(0);
                    }

                    lastTap = currentTime;
                  }}
                />
                <Box
                  hidden={showSampleRecord}
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
                <Image
                  hidden={!showSampleRecord}
                  src="/images/screen-delete.svg"
                  alt="delete"
                  cursor="pointer"
                  onClick={handler.onSampleRecordDelete}
                />
              </HStack>
            </Flex>
          </Flex>

          <HStack
            // 按鈕
            pl="4px"
            spacing="18px"
          >
            <Image
              w="60px"
              src="/images/bbbb.png"
              cursor="pointer"
              _hover={{ opacity: 0.7 }}
              onClick={() => {
                if (showSampleRecord) setShowSampleRecord(false);
                setShowFX((prev) => !prev);
              }}
            />
            <Image
              w="60px"
              src="/images/bbbb.png"
              cursor="pointer"
              _hover={{ opacity: 0.7 }}
              onClick={() => {
                if (curSample.artist == "self") {
                  if (showFX) setShowFX(false);
                  setShowSampleRecord((prev) => !prev);
                  navigator.mediaDevices.getUserMedia({ audio: true });
                } else {
                  setShowSelectPanel((prev) => !prev);
                }
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
                    isMobile={isMobile}
                    isRegistered={isRegistered}
                    isBeingPlayed={isBeingPlayed}
                    flashPadLight={pad.id === activePad}
                    onMouseDown={handler.onPatternMouseDown}
                    onHold={handler.onPatternHold}
                    showSampleRecord={showSampleRecord}
                    recordState={recordState}
                    onRecordMouseDown={() =>
                      handler.onSampleRecordMouseDown(pad.id, index)
                    }
                    onRecordHold={() => handler.onSampleRecordHold(index)}
                    onRecordMouseUp={() => handler.onSampleRecordMouseUp(index)}
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
                if (index == 1) {
                }

                return (
                  <SlotPad
                    key={slotIndex}
                    name={pad.name}
                    imageSrc={pad.imageSrc}
                    isMobile={isMobile}
                    labelIndex={labelIndex}
                    isRegistered={padState["slots"][curSample.index][slotIndex]}
                    isActive={isPlaying && curPosition === slotIndex}
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
