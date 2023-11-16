import {
  NUMBER_OF_SEQ,
  NUMBER_OF_PATTERNS,
  NUMBER_OF_SAMPLES,
  NUMBER_OF_SLOTS,
  PREP_BEAT_BARS,
  PREP_BEAT_SLOTS,
} from "@/dummy/constants";
import { generate2DArray } from "@/utils";

export const createSequence = (loopStart = "1:0:0", loopEnd = "2:0:0") => {
  return {
    loopStart,
    loopEnd,
  };
};

export const createSequencer = (numberOfSequence = NUMBER_OF_SEQ) => {
  const seqs = Array(numberOfSequence)
    .fill(0)
    .map((_, index) => {
      const start = index * NUMBER_OF_PATTERNS + 1;
      const loopStart = `${start}:0:0`;
      const loopEnd = `${start + 1}:0:0`;
      return createSequence(loopStart, loopEnd);
    });

  const slots = generate2DArray(
    NUMBER_OF_SAMPLES,
    NUMBER_OF_SLOTS * (NUMBER_OF_PATTERNS * NUMBER_OF_SEQ) + PREP_BEAT_SLOTS
  );

  return {
    seqs,
    slots,
  };
}
