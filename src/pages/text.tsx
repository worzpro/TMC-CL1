import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import "./styles.css";

import SampleButton from "./components/SampleButton";
import PatternPad from "./components/PatternPad";
import SlotPad from "./components/SlotPad";
import { debounce, isMobileDevice } from "./utils";

import kick from "../assets/kick.mp3";
import snare from "../assets/snare.mp3";
import hihat from "../assets/hihat.mp3";

import metronome1 from "../assets/metronome1.wav";
import metronome2 from "../assets/metronome2.wav";

const IS_MOBILE = isMobileDevice();

const metronome1Player = new Tone.Player(metronome1).toDestination();
const metronome2Player = new Tone.Player(metronome2).toDestination();

/**
 * Changing the value of Transport bpm does not rely on any component-specific data.
 * Therefore, defining the function outside of the component.
 */
const debouncedSetBpm = debounce((value) => {
  console.log("set bpm to: ", value);
  Tone.Transport.bpm.value = value;
}, 500);

const NUMBER_OF_SLOTS = 8;
const NUMBER_OF_SAMPLES = 2;
const NUMBER_OF_PATTERNS = 4;

const SAMPLES = [
  {
    label: "kick",
    src: kick,
  },
  {
    label: "snare",
    src: snare,
  },
  {
    label: "hihat",
    src: hihat,
  },
];

const DEFAULT_SAMPLES = SAMPLES.slice(0, NUMBER_OF_SAMPLES);

const PATTERNS = [
  {
    label: "a",
    offset: 0,
    imageUrl: "put-in-the-image-url-here",
  },
  {
    label: "b",
    offset: 1,
    imageUrl: "put-in-the-image-url-here",
  },
  {
    label: "c",
    offset: 2,
    imageUrl: "put-in-the-image-url-here",
  },
  {
    label: "d",
    offset: 3,
    imageUrl: "put-in-the-image-url-here",
  },
];

// const samplerPlayers = {};
const samplerPlayers = SAMPLES.reduce((acc:any, { label, src }) => {
  const player = new Tone.Player(src).toDestination();
  acc[label] = player;
  return acc;
}, {});

let padRegistered = generate2DArray(
  NUMBER_OF_SAMPLES,
  NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS + 1)
);

function generate2DArray(rows, columns) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => false)
  );
}

const scheduledRegister = generate2DArray(
  NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS + 1),
  NUMBER_OF_SAMPLES
);

Tone.Transport.loop = true;
Tone.Transport.setLoopPoints("1:0:0", "2:0:0");

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [curPosition, setCurPosition] = useState(null);
  const [isToneStarted, setIsToneStarted] = useState(false);

  const [bpm, setBpm] = useState(120);

  const [curSamlpes, setCurSamlpes] = useState(
    DEFAULT_SAMPLES.map(({ label }) => label)
  ); // visible samples
  const [curSampleIndex, setCurSampleIndex] = useState(0); // selected sample
  const [curPattern, setCurPattern] = useState('a'); // selected pattern
  const [registeredPatternIndex, setRegisteredPatternIndex] = useState(0); // index to which patterns are registered

  const [padState, setPadState] = useState(
    generate2DArray(NUMBER_OF_SAMPLES, NUMBER_OF_SLOTS * NUMBER_OF_PATTERNS + 1)
  );

  const playerRef = useRef(
    DEFAULT_SAMPLES.map(({ label }) => samplerPlayers[label])
  );

  // at the moment we still need this
  // remove this if possible
  const lengthRef = useRef(NUMBER_OF_SLOTS);

  // metronome
  useEffect(() => {
    let eventId;
    if (isToneStarted) {
      eventId = Tone.Transport.scheduleRepeat((time) => {
        const beat = Math.floor(
          (Math.floor(Tone.Transport.getTicksAtTime() / 192) % 4) + 1
        );

        if (beat === 1) {
          metronome1Player.start(time);
        } else {
          metronome2Player.start(time);
        }
      }, "4n");
    }
    return () => {
      Tone.Transport.clear(eventId);
    };
  }, [isToneStarted]);

  useEffect(() => {
    let id;
    function playOnBeat(time) {
      const slotIndex = Math.round((Tone.Transport.getTicksAtTime() / 192) * 2);
      setCurPosition(slotIndex);

      /**
       *  this is hacky way to make sure prep beats only happen once
       */
      if (slotIndex === NUMBER_OF_SLOTS - 1) {
        Tone.Transport.loopStart = "1:0:0";
      }

      playerRef.current.forEach((player, sampleIndex) => {
        if (padRegistered[sampleIndex][slotIndex]) {
          player.start(time);
        }
      });

      // in recording mode, register on the next slot
      const previousSlotIndex =
        slotIndex - 1 < 8 ? lengthRef.current - 1 + 8 : slotIndex - 1;

      scheduledRegister[previousSlotIndex].forEach(
        (shouldRegister, sampleIndex) => {
          if (shouldRegister) {
            padRegistered[sampleIndex][previousSlotIndex] = true;
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

  const handleRangeChange = (event) => {
    setBpm(event.target.value);
    debouncedSetBpm(event.target.value);
  };

  const onPatternHold = useCallback(
    (index) => {
      setRegisteredPatternIndex(index);
      Tone.Transport.loopEnd = `${index + 2}:0:0`;
      lengthRef.current = (index + 1) * NUMBER_OF_SLOTS;
    },
    [setRegisteredPatternIndex]
  );

  const onPatternMouseDown = useCallback(
    (index) => {
      setCurPattern(index);
    },
    [setCurPattern]
  );

  const onSlotPadClick = (index) => {
    padRegistered[curSampleIndex][index] =
      !padRegistered[curSampleIndex][index];
    setPadState((prevState) => {
      const newState = prevState.map((arr) => [...arr]);
      newState[curSampleIndex][index] = !newState[curSampleIndex][index];
      return newState;
    });
  };

  const stopRecording = () => {
    Tone.Transport.loopStart = "1:0:0";
    setIsRecording(false);
  };

  const clearAllSlots = () => {
    padRegistered = generate2DArray(
      NUMBER_OF_SAMPLES,
      NUMBER_OF_SLOTS * NUMBER_OF_PATTERNS + 1
    );
    const newPadState = generate2DArray(
      NUMBER_OF_SAMPLES,
      NUMBER_OF_SLOTS * NUMBER_OF_PATTERNS + 1
    );
    setPadState(newPadState);
  };

  const handleMouseDown = useCallback(
    (index, label) => {
      playerRef.current[index].start();
      setCurSampleIndex(index);

      if (isRecording) {
        const slotIndex =
          (Math.round((Tone.Transport.getTicksAtTime() / 192) * 2 - 8) %
            lengthRef.current) +
          8;

        scheduledRegister[slotIndex][index] = true;

        setPadState((prevState) => {
          const newState = prevState.map((arr) => [...arr]);
          if (!newState[index][slotIndex]) {
            newState[index][slotIndex] = true;
          }

          return newState;
        });
      }
    },
    [isRecording]
  );

  return (
    <div className="App">
      <div>
        <button
          onClick={() => {
            Tone.Transport.stop();
            clearAllSlots();
            Tone.Transport.loopStart = "0:0:0";
            setIsRecording(true);
            Tone.Transport.start(undefined, "0:0:0");
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
              Tone.Transport.start(undefined, "1:0:0");
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
              }
              Tone.Transport.pause();
              setIsPlaying(false);
            } else if (e.detail === 2) {
              Tone.Transport.stop();
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
              console.log("Audio Ready");

              await Tone.start();
              setIsToneStarted(true);
              console.log("Audio context started!");
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
          onChange={handleRangeChange}
        />
        <label htmlFor="bpm">{`BPM: ${bpm}`}</label>
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
              onTouch={() => handleMouseDown(index, label)}
            />
          );
        })}
      </div>
      <div>
        {PATTERNS.map(({ label }, index) => {
          const startSlotIndex = (index + 1) * 8;
          const endSlotIndex = (index + 2) * 8 - 1;
          const isBeingPlayed =
            isPlaying &&
            curPosition >= startSlotIndex &&
            curPosition <= endSlotIndex;
          return (
            <PatternPad
              key={label}
              label={label}
              index={index}
              isActive={curPattern === index}
              isRegistered={index <= registeredPatternIndex}
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
                    const patternOffest = (curPattern + 1) * NUMBER_OF_SLOTS;
                    const slotIndex = index + patternOffest;
                    return (
                      <SlotPad
                        key={slotIndex}
                        index={slotIndex - NUMBER_OF_SLOTS}
                        isRegistered={padState[curSampleIndex][slotIndex]}
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
