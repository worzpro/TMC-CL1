import { Box } from "@chakra-ui/react";
import { useRef, useState, useEffect, useCallback } from "react";

import RecordBtn from "./machine/RecordBtn";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface LooseObject {
  [key: string]: any;
}

const DEFAULT_WS_OPTIONS = {
  height: 100,
  waveColor: "#F1EFEF",
  progressColor: "#F1EFEF",
};

const RECORD_TIME_LIMIT = 5;
const REGION_OPTIONS = {
  color: "rgba(250, 0, 25, 0.1)",
};

const WS_CONTAINER_STYLE = { minHeight: "120px", backgroundColor: "#555843" };
const WaveSurferDisplayer = ({
  hidden,
  containerRef,
  style,
  index,
}: {
  containerRef: any;
  style: LooseObject;
  hidden?: boolean;
  index?: number;
}) => {
  if (Array.isArray(containerRef.current)) {
    return (
      <div
        hidden={hidden}
        ref={(el) => index && (containerRef.current[index] = el)}
        style={style}
      ></div>
    );
  }
  return <div hidden={hidden} ref={containerRef} style={style}></div>;
};

const RECORD_SLOTS = ["a", "b", "c", "d"];
const NUMBER_OF_RECORDS = 4;

const DEFAULT_SAMPLE_REF = Array(NUMBER_OF_RECORDS)
  .fill(0)
  .map(() => {
    return {
      ws: null,
      region: null,
    };
  });

const WaveSurferPlayer = () => {
  const recordContainerRef = useRef<any>();
  const recordRef = useRef<any>();

  const resultContainerRef = useRef<any[]>([null, null, null, null]);
  const resultWaveSurverRef = useRef<any[]>(DEFAULT_SAMPLE_REF);

  const intervalRef = useRef<any>();
  const [recordState, setRecordState] = useState([
    "empty",
    "empty",
    "empty",
    "empty",
  ]);
  const [count, setCount] = useState(RECORD_TIME_LIMIT);
  const [curRecordSlotIndex, setCurRecordSlotIndex] = useState(0);

  useEffect(() => {
    if (!recordContainerRef.current) return;

    const onRecordEnd = (blob: any) => {
      recordRef.current.stopMic();

      // create new ws of the recording
      const sampleUrl = URL.createObjectURL(blob);
      const ws = WaveSurfer.create({
        ...DEFAULT_WS_OPTIONS,
        container: resultContainerRef.current[curRecordSlotIndex],
        url: sampleUrl,
      });

      // enable region selection i.e. chopping the sample
      const wsRegions = ws.registerPlugin(RegionsPlugin.create());
      wsRegions.enableDragSelection(REGION_OPTIONS);
      wsRegions.on("region-created", (region) => {
        resultWaveSurverRef.current[curRecordSlotIndex].region = region;
      });
      // this is required to make sure the player stops at the end of the region
      wsRegions.on("region-out", () => {
        resultWaveSurverRef.current[curRecordSlotIndex].ws.stop();
      });

      resultWaveSurverRef.current[curRecordSlotIndex].ws = ws;

      setRecordState((prev) => {
        const newState = [...prev];
        newState[curRecordSlotIndex] = "registered";
        return newState;
      });
    };

    const ws = WaveSurfer.create({
      ...DEFAULT_WS_OPTIONS,
      container: recordContainerRef.current,
    });

    const record = ws.registerPlugin(RecordPlugin.create());
    const unSubsribe = record.on("record-end", onRecordEnd);
    recordRef.current = record;

    return () => {
      ws.destroy();
      unSubsribe();
    };
  }, [recordContainerRef, curRecordSlotIndex]);

  const startRecording = () => {
    // dispose the wavesurfer of the previous recording
    if (resultWaveSurverRef.current[curRecordSlotIndex].ws) {
      resultWaveSurverRef.current[curRecordSlotIndex].ws.destroy();
    }

    recordRef.current.startRecording();
    setRecordState((prev) => {
      const newState = [...prev];
      newState[curRecordSlotIndex] = "recording";
      return newState;
    });
  };

  const stopRecording = () => {
    recordRef.current.stopRecording();
    clearInterval(intervalRef.current);
    setCount(RECORD_TIME_LIMIT);
  };

  const onRecordMouseDown = (index: number) => {
    // stop the current playing sample
    if (resultWaveSurverRef.current[curRecordSlotIndex].ws) {
      resultWaveSurverRef.current[curRecordSlotIndex].ws.stop();
    }
    setCurRecordSlotIndex(index);
    if (recordState[index] === "empty") {
      return;
    } else if (recordState[index] === "registered") {
      if (resultWaveSurverRef.current[index].region) {
        resultWaveSurverRef.current[index].region.play();
      } else {
        resultWaveSurverRef.current[index].ws.stop();
        resultWaveSurverRef.current[index].ws.play();
      }
    }
  };

  const onRecordHold = (index: number) => {
    if (recordState[index] !== "empty") {
      return;
    }
    let count = RECORD_TIME_LIMIT;
    startRecording();
    const timer = setInterval(function () {
      setCount((prev) => prev - 1);
      count--;
      if (count < 0) {
        stopRecording();
      }
    }, 1000);

    intervalRef.current = timer;
  };

  const onRecordMouseUp = (index: number) => {
    if (recordState[index] === "recording") {
      stopRecording();
    }
  };

  return (
    <>
      <div>
        <WaveSurferDisplayer
          hidden={recordState[curRecordSlotIndex] === "registered"}
          containerRef={recordContainerRef}
          style={WS_CONTAINER_STYLE}
        />
        <div
          style={{
            position: "absolute",
            color: "white",
            top: "0.375rem",
            left: "0.625rem",
          }}
        >
          <span>{RECORD_SLOTS[curRecordSlotIndex]}</span>
          {recordState[curRecordSlotIndex] === "recording" && (
            <span style={{ marginLeft: "0.275rem" }}>{`${count}s`}</span>
          )}
        </div>
      </div>
      {RECORD_SLOTS.map((label, index) => (
        <div
          key={index}
          hidden={
            !(
              curRecordSlotIndex === index &&
              recordState[index] === "registered"
            )
          }
        >
          <WaveSurferDisplayer
            index={index}
            containerRef={resultContainerRef}
            style={WS_CONTAINER_STYLE}
          />
          <div
            style={{
              position: "absolute",
              color: "white",
              top: "0.375rem",
              left: "0.625rem",
            }}
          >
            <span>{RECORD_SLOTS[index]}</span>
          </div>
        </div>
      ))}
      {RECORD_SLOTS.map((label, index) => (
        <RecordBtn
          key={label}
          onRecordMouseDown={() => onRecordMouseDown(index)}
          onRecordHold={() => onRecordHold(index)}
          onRecordMouseUp={() => onRecordMouseUp(index)}
          recordState={recordState[index]}
          isActive={curRecordSlotIndex === index}
        />
      ))}
      <button
        onClick={() => {
          if (resultWaveSurverRef.current[curRecordSlotIndex].ws) {
            console.log("destroy previous ws");
            resultWaveSurverRef.current[curRecordSlotIndex].ws.destroy();
            resultWaveSurverRef.current[curRecordSlotIndex].region = null;
          }
          setRecordState((prev) => {
            const newState = [...prev];
            newState[curRecordSlotIndex] = "empty";
            return newState;
          });
        }}
      >
        delete
      </button>
    </>
  );
};

export default WaveSurferPlayer;
