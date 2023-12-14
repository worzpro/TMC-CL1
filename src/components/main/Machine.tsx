import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import * as Tone from "tone";

import artists from "@/dummy/artists";
import pads from "@/dummy/pads";

import SeqBtn from "@/components/machine/SeqBtn";
import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";
import Loading from "@/components/machine/Loading";
import FxPanel from "@/components/machine/FxPanel";
import RecordButton from "@/components/machine/RecordButton";
import WaveSurferPlayer from "@/components/machine/WaveSurferPlayer";

import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

import Recording from "@/recording";

import {
  INSERT_EFFECTS,
  SEND_EFFECTS,
  SEQ_LOOP_POINTS,
} from "@/dummy/constants";
import {
  createChainedInsertAudioEffects,
  createSendAudioEffects,
  getBasicVersionPlayers,
} from "@/utils";

interface MachineProps {
  isMenuOpen: boolean;
  isToneStarted: boolean;
}
interface LooseObject {
  [key: string]: any;
}

const padsArr = Object.values(pads).sort((a, b) => a.id - b.id);
const RECORD_PADS = padsArr.slice(0, 4);
const SAMPLE_PADS = padsArr.slice(4, 12);

const RECORDING_WAVECOLOR = "#691620";
const READY_WAVECOLOR = "#F1EFEF";
const RECORD_TIME_LIMIT = 5;
const NUMBER_OF_RECORDS = 4;
const DEFAULT_WS_OPTIONS = {
  width: 303,
  waveColor: READY_WAVECOLOR,
  interact: false,
};
const REGION_OPTIONS = {
  color: "rgba(250, 0, 25, 0.1)",
};

const Machine = ({ isMenuOpen, isToneStarted }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isHold, setIsHold] = useState<boolean>(false);
  const [showFX, setShowFX] = useState<boolean>(false);
  const [showSample, setShowSample] = useState<boolean>(false);
  const [curSeq, setCurSeq] = useState<string>("SEQ.1");
  const [progress, setProgress] = useState(0);
  const [pendingSeq, setPendingSeq] = useState<string | null>(null);
  const [gifs, setGifs] = useState<string[]>([]);
  const [activePad, setActivePad] = useState<string>("");
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const router = useRouter();

  const pathName = router.pathname.split("/")[2];
  const curSeqData = artists[pathName]?.[curSeq];
  const DOUBLE_CLICK_DELAY = 300; // 雙擊間隔時間（毫秒）
  let lastTap = 0;

  const timeoutID = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const insertEffectsRef = useRef<any>(null);
  const sendEffectsRef = useRef<any>(null);

  // record
  const recordContainerRef = useRef<HTMLDivElement>(null);
  const recordRef = useRef<any>();
  const resultContainerRef = useRef<HTMLDivElement[]>([]);
  const resultWaveSurferRef = useRef<any>();
  const intervalRef = useRef<any>();
  const primaryWsRef = useRef<any>();
  const effectRef = useRef<any>();
  const [recordState, setRecordState] = useState<any[]>([
    "empty",
    "empty",
    "empty",
    "empty",
  ]);
  const [count, setCount] = useState<number>(RECORD_TIME_LIMIT);
  const [curRecordSlotIndex, setCurRecordSlotIndex] = useState<number>(-1);

  const handler = {
    createAudioMap: (artistData: LooseObject) => {
      let AUDIO_MAP: LooseObject = {};
      Object.entries(artistData).map(([seqLabel, seqData]: any) => {
        const { bpm, src, srcJam } = seqData.audios.seqAudio;
        const samples = seqData.audios.sampleAudios;
        AUDIO_MAP[seqLabel] = {
          label: seqLabel,
          bpm,
          src,
          srcJam,
          samples,
        };
      });
      return AUDIO_MAP;
    },
    createNewLoopedAndSyncedPlayer: (src: string) => {
      const newPlayer = new Tone.Player(src);
      newPlayer.volume.value = -10;
      newPlayer.sync();
      return newPlayer;
    },
    createPlayers: (audioMap: LooseObject) => {
      const players = Object.entries(audioMap).map(([key, seq]) => {
        const { src, srcJam, samples } = seq;
        const fullPlayer = handler.createNewLoopedAndSyncedPlayer(src);
        const jamPlayer = handler.createNewLoopedAndSyncedPlayer(srcJam);

        const samplePlayers = samples.map(
          (sample: LooseObject) => new Tone.Player(sample.src)
        );

        return [
          key,
          {
            fullPlayer,
            jamPlayer,
            samplePlayers,
          },
        ];
      });

      return Object.fromEntries(players);
    },
    startPlayersAtDesinatedBar: (playersObj: LooseObject) => {
      Object.entries(playersObj).forEach(([seq, { fullPlayer, jamPlayer }]) => {
        const { start, end } = SEQ_LOOP_POINTS[pathName][seq];
        fullPlayer.start(start).stop(end);
        jamPlayer.start(start).stop(end);
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
      if (seq === curSeq) return;

      if (isPlaying) {
        // switch seq on the next first beat
        setPendingSeq(seq);
        const curTick = Tone.Transport.getTicksAtTime();
        const curMeasure = Math.floor(curTick / (192 * 4));
        const switch_time = `${curMeasure + 1}:0:0`;

        handler.setJam(seq, isJamming);

        Tone.Transport.scheduleOnce(() => {
          const { start, end } = SEQ_LOOP_POINTS[pathName][seq];
          Tone.Transport.loopStart = start;
          Tone.Transport.loopEnd = end;
          Tone.Transport.position = start;
          setPendingSeq(null);
          setCurSeq(seq);
          setProgress(0);
        }, switch_time);
      } else {
        const { bpm } = curSeqData.audios.seqAudio;
        const { start, end } = SEQ_LOOP_POINTS[pathName][seq];
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.loopStart = start;
        Tone.Transport.loopEnd = end;
        Tone.Transport.position = start;
        setCurSeq(seq);
        setProgress(0);
      }
    },
    onChangeGif: (curGifData: LooseObject, padName: string) => {
      if (!curGifData?.src) return;

      if (pathName !== "sonia" && pathName !== "enno-chunho") {
        // 如果之前有計時器，先清除
        if (timeoutID.current !== null) {
          clearTimeout(timeoutID.current);
        }
        const newGifSrc = curGifData.src + "?rand=" + Math.random();
        setGifs([...curSeqData.waitGif, newGifSrc]);

        timeoutID.current = setTimeout(() => {
          setGifs(curSeqData.waitGif);
          timeoutID.current = null;
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
        // 如果之前有計時器，先清除
        if (timeoutID.current !== null) {
          clearTimeout(timeoutID.current);
        }
        const newGifSrc = curGifData.src + "?rand=" + Math.random();
        setGifs((prev: any) => {
          let newGifs = [...prev];
          newGifs[0] = newGifSrc;
          return newGifs;
        });
        // 設定新的計時器
        timeoutID.current = setTimeout(() => {
          setGifs(curSeqData.waitGif);
          timeoutID.current = null;
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
          // 如果之前有計時器，先清除
          if (timeoutID.current !== null) {
            clearTimeout(timeoutID.current);
          }
          const newGifSrcArr = curGifData.src.map(
            (src: string) => src + "?rand=" + Math.random()
          );
          setGifs((prev: any) => {
            let newGifs = [...prev];
            newGifs = [...newGifs, ...newGifSrcArr];
            return newGifs;
          });
          // 設定新的計時器
          timeoutID.current = setTimeout(() => {
            setGifs(curSeqData.waitGif);
            timeoutID.current = null;
          }, curGifData.duration);
        }
        if (padName == "8") {
          setGifs((prev: any) => {
            const newGifScr = curGifData.src + "?rand=" + Math.random();
            let newGifs = [...prev].filter(
              (item) => !item.includes(curGifData.src)
            );
            newGifs.push(newGifScr);
            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter(
                (item) => !item.includes(curGifData.src)
              );
              return newGifs;
            });
          }, curGifData.duration);
        }
      }
      if (curSeq == "SEQ.2") {
        if (padName == "1" || padName == "2") {
          setGifs((prev: any) => {
            const newGifScr = curGifData.src + "?rand=" + Math.random();
            let newGifs = [...prev].filter(
              (item) => !item.includes(curGifData.src)
            );
            newGifs.push(newGifScr);

            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter(
                (item) => !item.includes(curGifData.src)
              );
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
            const newGifScr = curGifData.src + "?rand=" + Math.random();
            let newGifs = [...prev].filter(
              (item) => !item.includes(curGifData.src)
            );
            newGifs.push(newGifScr);
            return newGifs;
          });
          setTimeout(() => {
            setGifs((prev: any) => {
              let newGifs = [...prev].filter(
                (item) => !item.includes(curGifData.src)
              );
              return newGifs;
            });
          }, curGifData.duration);
        }
      }
      if (curSeq == "SEQ.3" || curSeq == "SEQ.4") {
        setGifs((prev: any) => {
          const newGifScr = curGifData.src + "?rand=" + Math.random();
          let newGifs = [...prev].filter(
            (item) => !item.includes(curGifData.src)
          );
          newGifs.push(newGifScr);
          return newGifs;
        });
        setTimeout(() => {
          setGifs((prev: any) => {
            let newGifs = [...prev].filter(
              (item) => !item.includes(curGifData.src)
            );
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
    onPlayOrPause: () => {
      if (!isPlaying) {
        Tone.Transport.start();
        setIsPlaying(true);
      } else {
        Tone.Transport.pause();
        setIsPlaying(false);
      }
    },
    onStop: (event: any) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      const isDoubleTap = tapLength < DOUBLE_CLICK_DELAY && tapLength > 0;

      if (event.detail === 1 || !isDoubleTap) {
        Tone.Transport.pause();
        if (isPlaying) {
          setIsPlaying(false);
        }
      }
      if (event.detail === 2 || isDoubleTap) {
        const { start, end } = SEQ_LOOP_POINTS[pathName][curSeq];
        Tone.Transport.stop();
        Tone.Transport.loopStart = start;
        Tone.Transport.loopEnd = end;
        Tone.Transport.position = start;
        setProgress(0);
      }

      lastTap = currentTime;
    },
    onFxChange: (effectObj: LooseObject, value: number) => {
      const isChannel = effectObj.channelVariables !== undefined;
      const { key } = effectObj;
      if (isChannel) {
        const { variableKey, defaultValue } = effectObj.channelVariables[0];
        sendEffectsRef.current[key].channel.set({
          [variableKey]: value,
        });
        if (value == defaultValue) {
          console.log("mute!");
          sendEffectsRef.current[key].effect.disconnect();
        } else {
          sendEffectsRef.current[key].effect.toDestination();
        }
      } else {
        const { variableKey, defaultValue } = effectObj.variables[0];
        insertEffectsRef.current[key].effect.set({
          [variableKey]: value,
        });
      }
    },
    onRecordDelete: () => {
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
    onRecordEnd: async (blob: any, curRecordSlotIndex: number) => {
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
    startRecording: () => {
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
    stopRecording: () => {
      recordRef.current.stopRecording();
      clearInterval(intervalRef.current);
      setCount(RECORD_TIME_LIMIT);
    },
    onRecordMouseDown: (padName: string, index: number) => {
      handler.onChangePadLight(padName);
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
    onRecordHold: (index: number) => {
      if (recordState[index] !== "empty" || !showSample) {
        return;
      }
      let count = RECORD_TIME_LIMIT;
      handler.startRecording();
      const timer = setInterval(function () {
        setCount((prev) => prev - 1);
        count--;
        if (count < 0) {
          handler.stopRecording();
        }
      }, 1000);

      intervalRef.current = timer;
    },
    onRecordMouseUp: (index: number) => {
      if (recordState[index] === "recording") {
        handler.stopRecording();
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
      const { bpm } = curSeqData.audios.seqAudio;
      const { start, end } = SEQ_LOOP_POINTS[pathName][curSeq];
      Tone.Transport.loop = true;
      Tone.Transport.loopStart = start;
      Tone.Transport.loopEnd = end;
      Tone.Transport.bpm.value = bpm;

      const AUDIO_MAP = handler.createAudioMap(artists[pathName]);
      const playerObj = handler.createPlayers(AUDIO_MAP);

      // record
      const DEFAULT_SAMPLE_REF = Array(NUMBER_OF_RECORDS)
        .fill(0)
        .map(() => new Recording());
      
      ///// FX相關
      const players = [...getBasicVersionPlayers(playerObj), ...DEFAULT_SAMPLE_REF];
      const insertEffects = createChainedInsertAudioEffects(INSERT_EFFECTS);
      players.forEach((player: any) => {
        player.connect(insertEffects.input);
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

      playerRef.current = playerObj;
      resultWaveSurferRef.current = DEFAULT_SAMPLE_REF;
      insertEffectsRef.current = insertEffects;
      sendEffectsRef.current = sendEffects;
      handler.setJam(curSeq, isJamming);
      handler.startPlayersAtDesinatedBar(playerObj);
    }

    // 切換卡帶時重置player
    return () => {
      if (playerRef.current) {
        playerRef.current[curSeq].fullPlayer.unsync();
        playerRef.current[curSeq].jamPlayer.unsync();
      }
    };
  }, [isToneStarted]);

  // count beat
  useEffect(() => {
    let eventId: any;
    if (isPlaying) {
      eventId = Tone.Transport.scheduleRepeat((time) => {
        // console.log(
        //   Math.floor(
        //     (Math.floor(Tone.Transport.getTicksAtTime() / 192) % 4) + 1
        //   )
        // );
      }, "4n");
    }
    return () => {
      Tone.Transport.clear(eventId);
    };
  }, [isPlaying]);

  // count progress
  useEffect(() => {
    const id = Tone.Transport.scheduleRepeat((time) => {
      Tone.Draw.schedule(() => {
        setProgress(Tone.Transport.progress * 100);
      }, time);
    }, "64n");

    return () => {
      Tone.Transport.clear(id);
    };
  }, []);

  // 組件卸載時清理計時器
  useEffect(() => {
    return () => {
      if (timeoutID.current !== null) {
        clearTimeout(timeoutID.current);
      }
    };
  }, []);

  // record
  useEffect(() => {
    if (!recordContainerRef.current) return;

    const ws = WaveSurfer.create({
      ...DEFAULT_WS_OPTIONS,
      height: isMobile ? 124 : 252,
      container: recordContainerRef.current,
    });
    primaryWsRef.current = ws;
    const record = ws.registerPlugin(RecordPlugin.create());
    record.startMic();
    const unSubscribe = record.on("record-end", (blob) => handler.onRecordEnd(blob, curRecordSlotIndex));
    recordRef.current = record;

    return () => {
      ws.destroy();
      unSubscribe();
    };
  }, [recordContainerRef, curRecordSlotIndex, showSample]);

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
            {!showSample && (
              <HStack
                // SEQs
                spacing="6px"
              >
                {["SEQ.1", "SEQ.2", "SEQ.3", "SEQ.4"].map((seq) => (
                  <SeqBtn
                    key={seq}
                    seq={seq}
                    curSeq={curSeq}
                    pendingSeq={pendingSeq}
                    progress={progress}
                    onSeqClick={handler.onSeqClick}
                  />
                ))}
              </HStack>
            )}

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
            {showFX && (
              <FxPanel isHold={isHold} onFxChange={handler.onFxChange} />
            )}
            {showSample && (
              <WaveSurferPlayer
                recordState={recordState}
                curRecordSlotIndex={curRecordSlotIndex}
                recordContainerRef={recordContainerRef}
                resultContainerRef={resultContainerRef}
                count={count}
              />
            )}

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
              <HStack w={showFX ? "100%" : "auto"}>
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
                {showSample ? (
                  <Image
                    src="/images/screen-delete.svg"
                    alt="delete"
                    cursor="pointer"
                    onClick={handler.onRecordDelete}
                  />
                ) : (
                  <>
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
                  </>
                )}
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
                navigator.mediaDevices.getUserMedia({ audio: true });
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
              {RECORD_PADS.map((pad, index) => (
                <RecordButton
                  key={index}
                  index={index}
                  pad={pad}
                  activePad={activePad}
                  recordState={recordState}
                  onRecordMouseDown={() =>
                    handler.onRecordMouseDown(pad.name, index)
                  }
                  onRecordHold={() => handler.onRecordHold(index)}
                  onRecordMouseUp={() => handler.onRecordMouseUp(index)}
                />
              ))}
              {SAMPLE_PADS.map((pad, index) => (
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
