import {
  NUMBER_OF_SEQ,
  NUMBER_OF_PATTERNS,
  NUMBER_OF_SAMPLES,
  NUMBER_OF_SLOTS,
  PREP_BEAT_BARS,
  PREP_BEAT_SLOTS,
} from "@/dummy/constants";
import { SEQ_INDEX_MAP } from "@/map";

type FunctionType = (this: any, ...args: any[]) => void;
interface LooseObject {
  [key: string]: any;
}

export const debounce = (func: FunctionType, delay: number): FunctionType => {
  let timeout: NodeJS.Timeout | undefined;

  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

export function isMobileDevice() {
  const userAgent = navigator.userAgent;
  const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
  return mobileKeywords.test(userAgent);
}

export const generate2DArray = (rows: number, columns: number) => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => false)
  );
};

export const clone2DArray = (input: any[]) => {
  return input.map((arr) => [...arr]);
};

export const cloneAllSlots = (slots: any[]) => {
  return slots.map((row) => [...row]);
};

export const getSeqSlotOffsetFromIndex = (curSeq: string) => {
  // 0 - 7 prep
  // 8 - 39 seq 1
  // 40 - 71 seq 2
  // ...
  const slotsPerSeq = NUMBER_OF_PATTERNS * NUMBER_OF_SLOTS; //
  const start = SEQ_INDEX_MAP[curSeq] * slotsPerSeq + PREP_BEAT_SLOTS;
  return start;
};

export const getSeqLoopStartBar = (seq: LooseObject) => {
  return parseInt(seq.loopStart.split(":")[0]);
};

export const getSeqLoopEndBar = (seq: LooseObject) => {
  return parseInt(seq.loopEnd.split(":")[0]);
};
