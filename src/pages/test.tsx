import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import "./styles.css";

import {
  NUMBER_OF_SEQ,
  NUMBER_OF_PATTERNS,
  NUMBER_OF_SLOTS,
  NUMBER_OF_SAMPLES,
  PREP_BEAT_SLOTS
} from "./constants";

import SeqButton from "./components/SeqButton";
import SampleButton from "./components/SampleButton";
import PatternPad from "./components/PatternPad";
import SlotPad from "./components/SlotPad";

import {
  debounce,
  isMobileDevice,
  generate2DArray,
  getSeqSlotOffsetFromIndex,
  cloneAllSlots,
  getSeqLoopStartBar,
  getSeqLoopEndBar,
  clone2DArray
} from "./utils";

import { createSequencer } from "./model";

import kick from "../assets/kick.mp3";
import snare from "../assets/snare.mp3";
import hihat from "../assets/hihat.mp3";
import metronome1 from "../assets/metronome1.wav";
import metronome2 from "../assets/metronome2.wav";

const IS_MOBILE = isMobileDevice();

const metronome1Player = new Tone.Player(metronome1).toDestination();
const metronome2Player = new Tone.Player(metronome2).toDestination();

// metronome1Player.sync();
// metronome1Player.start(0);
/**
 * Changing the value of Transport bpm does not rely on any component-specific data.
 * Therefore, defining the function outside of the component.
 */
const debouncedSetBpm = debounce((value) => {
  console.log("set bpm to: ", value);
  Tone.Transport.bpm.value = value;
}, 500);

const SAMPLES = [
  {
    label: "kick",
    src: kick
  },
  {
    label: "snare",
    src: snare
  },
  {
    label: "hihat",
    src: hihat
  }
];

const DEFAULT_SAMPLES = SAMPLES.slice(0, NUMBER_OF_SAMPLES);

const PATTERNS = [
  {
    label: "a",
    offset: 0,
    imageUrl: "put-in-the-image-url-here"
  },
  {
    label: "b",
    offset: 1,
    imageUrl: "put-in-the-image-url-here"
  },
  {
    label: "c",
    offset: 2,
    imageUrl: "put-in-the-image-url-here"
  },
  {
    label: "d",
    offset: 3,
    imageUrl: "put-in-the-image-url-here"
  }
];

const samplerPlayers = SAMPLES.reduce((acc, { label, src }) => {
  const player = new Tone.Player(src).toDestination();
  acc[label] = player;
  return acc;
}, {});

const scheduledRegister = generate2DArray(
  NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS * NUMBER_OF_SEQ) + PREP_BEAT_SLOTS,
  NUMBER_OF_SAMPLES
);

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [curSeq, setCurSeq] = useState(0);
  const [pendingSeq, setPendingSeq] = useState();

  const [curPosition, setCurPosition] = useState(null);
  const [isToneStarted, setIsToneStarted] = useState(false);

  const [bpm, setBpm] = useState(120);
  const [playMetronome, setPlayMetronome] = useState(false);
  const [curSamlpes, setCurSamlpes] = useState(
    DEFAULT_SAMPLES.map(({ label }) => label)
  ); // visible samples
  const [curSampleIndex, setCurSampleIndex] = useState(0); // selected sample
  const [curPattern, setCurPattern] = useState(0); // selected pattern

  const [padState, setPadState] = useState(createSequencer());
  const slotsRef = useRef();
  const playerRef = useRef(
    DEFAULT_SAMPLES.map(({ label }) => samplerPlayers[label])
  );

  // at the moment we still need this
  // remove these if possible
  const lengthRef = useRef(NUMBER_OF_SLOTS);
  const loopStartRef = useRef("1:0:0");

  // initialize
  useEffect(() => {
    if (isToneStarted) {
      slotsRef.current = cloneAllSlots(padState.slots);
      Tone.Transport.loop = true;
      Tone.Transport.setLoopPoints("1:0:0", "2:0:0");
      Tone.Transport.position = "1:0:0";

      muteMetronome();
    }
  }, [isToneStarted]);

  // metronome
  useEffect(() => {
    let eventId;
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
            metronome1Player.start(time);
          } else {
            metronome2Player.start(time);
          }
        },
        "4n",
        "0:0:0" // must set this so that in this callback (metronome) is invoked in the first bar
      );
    }
    return () => {
      Tone.Transport.clear(eventId);
    };
  }, [isToneStarted]);

  /**
   *  this is hacky way to make sure prep beats only happen once
   */
  useEffect(() => {
    let id;
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
    let id;
    function playOnBeat(time) {
      const slotIndex = Math.round((Tone.Transport.getTicksAtTime() / 192) * 2);
      setCurPosition(slotIndex);

      playerRef.current.forEach((player, sampleIndex) => {
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
    }

    if (isToneStarted) {
      id = Tone.Transport.scheduleRepeat(playOnBeat, "8n");
    }
    return () => {
      Tone.Transport.clear(id);
    };
  }, [isToneStarted]);

  const toggleMetronome = () => {
    metronome1Player.mute = !metronome1Player.mute;
    metronome2Player.mute = !metronome2Player.mute;
  };

  const unmuteMetronome = () => {
    metronome1Player.mute = false;
    metronome2Player.mute = false;
  };

  const muteMetronome = () => {
    metronome1Player.mute = true;
    metronome2Player.mute = true;
  };

  const stopRecording = () => {
    Tone.Transport.loopStart = padState.seqs[curSeq].loopStart;
    if (!playMetronome) {
      muteMetronome();
    }
    setIsRecording(false);
  };

  const clearAllSlots = () => {
    const start = getSeqSlotOffsetFromIndex(curSeq);
    const newSlots = cloneAllSlots(slotsRef.current);
    newSlots.forEach((row) => {
      row.fill(false, start, start + NUMBER_OF_PATTERNS * NUMBER_OF_SLOTS);
    });
    slotsRef.current = newSlots;

    setPadState((prevState) => {
      return { ...prevState, slots: clone2DArray(newSlots) };
    });
  };

  const handleBpmRangeChange = (event) => {
    setBpm(event.target.value);
    debouncedSetBpm(event.target.value);
  };

  const onPatternHold = useCallback(
    (index) => {
      const loopStartBar = getSeqLoopStartBar(padState.seqs[curSeq]);

      const loopEndBar = loopStartBar + (index + 1);
      const loopEnd = `${loopEndBar}:0:0`;
      Tone.Transport.loopEnd = loopEnd;

      setPadState((prevState) => {
        const newSeqs = [...prevState.seqs];
        newSeqs[curSeq].loopEnd = loopEnd;
        return { ...prevState, seqs: newSeqs };
      });
      lengthRef.current = (index + 1) * NUMBER_OF_SLOTS;
    },
    [padState, curSeq]
  );

  const onPatternMouseDown = useCallback(
    (index) => {
      setCurPattern(index);
    },
    [setCurPattern]
  );

  // useCallback [isRecording, padState, curSampleIndex, curSeq]
  const handleSampleMouseDown = (index, label) => {
    playerRef.current[index].start();

    if (isRecording) {
      const slotIndex =
        (Math.round((Tone.Transport.getTicksAtTime() / 192) * 2 - 8) %
          lengthRef.current) +
        getSeqSlotOffsetFromIndex(curSeq);

      scheduledRegister[slotIndex][index] = true;

      setPadState((prevState) => {
        const newSlots = prevState.slots.map((arr) => [...arr]);
        newSlots[index][slotIndex] = true;
        return { ...prevState, slots: newSlots };
      });
    }
    setCurSampleIndex(index);
  };

  const onSeqClick = (index) => {
    if (index === curSeq) {
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      setCurSeq(index);
      setCurPattern(0);
      Tone.Transport.loopStart = padState.seqs[index].loopStart;
      Tone.Transport.loopEnd = padState.seqs[index].loopEnd;
      Tone.Transport.position = padState.seqs[index].loopStart;
    }
    if (isPlaying) {
      setPendingSeq(index);
      const curTick = Tone.Transport.getTicksAtTime();
      const curMeasure = Math.floor(curTick / (192 * 4));

      const switch_time = `${curMeasure + 1}:0:0`;
      Tone.Transport.loopEnd = `${curMeasure + 2}:0:0`;

      Tone.Transport.scheduleOnce(() => {
        Tone.Transport.loopStart = padState.seqs[index].loopStart;
        loopStartRef.current = padState.seqs[index].loopStart;
        Tone.Transport.loopEnd = padState.seqs[index].loopEnd;
        Tone.Transport.position = padState.seqs[index].loopStart;
        setCurSeq(index);
        setCurPattern(0);
        setPendingSeq(null);
      }, switch_time);
    } else {
      setCurSeq(index);
      setCurPattern(0);
      Tone.Transport.loopStart = padState.seqs[index].loopStart;
      loopStartRef.current = padState.seqs[index].loopStart;
      Tone.Transport.loopEnd = padState.seqs[index].loopEnd;
      Tone.Transport.position = padState.seqs[index].loopStart;
    }
  };

  const onSlotPadClick = (slotIndex) => {
    slotsRef.current[curSampleIndex][slotIndex] = !slotsRef.current[
      curSampleIndex
    ][slotIndex];

    setPadState((prevState) => {
      const newSlots = prevState.slots.map((arr) => [...arr]);
      newSlots[curSampleIndex][slotIndex] = !newSlots[curSampleIndex][
        slotIndex
      ];

      return { ...prevState, slots: newSlots };
    });
  };

  return (
    <div className="App">
      <div>
        <button
          onClick={() => {
            Tone.Transport.stop();
            clearAllSlots();
            Tone.Transport.loopStart = "0:0:0";
            Tone.Transport.position = "0:0:0";
            unmuteMetronome();
            setIsRecording(true);
            setCurPosition(0);
            Tone.Transport.start();
            setIsPlaying(true);
          }}
        >
          {isRecording ? "Recording" : "Record"}
        </button>
        <button
          onClick={async () => {
            if (isRecording) {
              stopRecording();
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
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={(e) => {
            if (e.detail === 1) {
              if (isRecording) {
                stopRecording();
                Tone.Transport.stop();
                Tone.Transport.position = padState.seqs[curSeq].loopStart;
                setCurPosition(0);
              }
              Tone.Transport.pause();
              setIsPlaying(false);
            } else if (e.detail === 2) {
              Tone.Transport.stop();
              Tone.Transport.position = padState.seqs[curSeq].loopStart;
              setCurPosition(0);
            }
          }}
        >
          Stop
        </button>
        <button
          disabled={isToneStarted}
          onClick={async () => {
            if (!isToneStarted) {
              await Tone.loaded();
              await Tone.start();
              setIsToneStarted(true);
            }
          }}
        >
          Start Tone
        </button>
      </div>
      <div>
        <input
          id="bpm"
          name="bpm"
          type="range"
          max={300}
          min={60}
          step="1"
          value={bpm}
          onChange={handleBpmRangeChange}
        />
        <label htmlFor="bpm">{`BPM: ${bpm}`}</label>

        <input
          type="checkbox"
          id="myCheckbox"
          name="myCheckbox"
          onClick={() => {
            setPlayMetronome((prevState) => !prevState);
            toggleMetronome();
          }}
        />
        <label htmlFor="myCheckbox">Metronome</label>
      </div>
      <div>
        {Array(NUMBER_OF_SEQ)
          .fill(0)
          .map((_, index) => (
            <SeqButton
              key={index}
              label={index}
              isPending={pendingSeq === index}
              isActive={curSeq === index}
              onClick={() => onSeqClick(index)}
            />
          ))}
      </div>
      <div className="sample-pool">
        {SAMPLES.map(({ label }, index) => {
          return (
            <SampleButton
              key={label}
              label={label}
              isActive={label === curSamlpes[curSampleIndex]}
              onTouch={() => {
                samplerPlayers[label].start();
                const newCurSamples = [...curSamlpes];
                newCurSamples[curSampleIndex] = label;
                setCurSamlpes(newCurSamples);
                playerRef.current[curSampleIndex] = samplerPlayers[label];
              }}
            />
          );
        })}
      </div>
      <div>
        {curSamlpes.map((label, index) => {
          return (
            <SampleButton
              key={index}
              label={label}
              isMobile={IS_MOBILE}
              isActive={curSampleIndex === index}
              onTouch={() => handleSampleMouseDown(index, label)}
            />
          );
        })}
      </div>
      <div>
        {PATTERNS.map(({ label }, index) => {
          const patternStartIndex =
            getSeqSlotOffsetFromIndex(curSeq) + index * NUMBER_OF_SLOTS;
          const patternEndIndex = patternStartIndex + NUMBER_OF_SLOTS - 1;
          const isBeingPlayed =
            isPlaying &&
            curPosition >= patternStartIndex &&
            curPosition <= patternEndIndex;
          const isRegistered =
            index <
            getSeqLoopEndBar(padState.seqs[curSeq]) -
              getSeqLoopStartBar(padState.seqs[curSeq]);
          return (
            <PatternPad
              key={label}
              label={label}
              index={index}
              isActive={curPattern === index}
              isRegistered={isRegistered}
              isBeingPlayed={isBeingPlayed}
              onMouseDown={onPatternMouseDown}
              onHold={onPatternHold}
            />
          );
        })}
      </div>
      <div>
        {Array(2)
          .fill(0)
          .map((_, row) => {
            return (
              <div key={row}>
                {Array(4)
                  .fill(0)
                  .map((_, col) => {
                    const index = col + (2 - row - 1) * 4;
                    const seqOffset = getSeqSlotOffsetFromIndex(curSeq);

                    const patternOffest = curPattern * NUMBER_OF_SLOTS;
                    const slotIndex = index + patternOffest + seqOffset;
                    const labelIndex = index + patternOffest;
                    return (
                      <SlotPad
                        key={slotIndex}
                        index={labelIndex}
                        isRegistered={padState.slots[curSampleIndex][slotIndex]}
                        isActive={isPlaying && curPosition === slotIndex}
                        onClick={() => onSlotPadClick(slotIndex)}
                      />
                    );
                  })}
              </div>
            );
          })}
      </div>
    </div>
  );
}
