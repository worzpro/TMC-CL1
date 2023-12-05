interface LooseObject {
  [key: string]: any;
}
import * as Tone from "tone";

export const NUMBER_OF_SEQ = 4;
export const NUMBER_OF_PATTERNS = 4;
export const NUMBER_OF_SAMPLES = 12;
export const NUMBER_OF_SLOTS = 8;

export const PREP_BEAT_BARS = 1;
export const PREP_BEAT_SLOTS = 8;

export const SEQ_LOOP_POINTS:LooseObject = {
  puzzleman: {
    "SEQ.1": {
      start: "0:0:0",
      end: "8:0:0"
    },
    "SEQ.2": {
      start: "8:0:0",
      end: "16:0:0"
    },
    "SEQ.3": {
      start: "16:0:0",
      end: "24:0:0"
    },
    "SEQ.4": {
      start: "24:0:0",
      end: "27:3:2"
    }
  },
  'sunset-rollercoaster': {
    "SEQ.1": {
      start: "0:0:0",
      end: "4:0:0"
    },
    "SEQ.2": {
      start: "4:0:0",
      end: "8:0:0"
    },
    "SEQ.3": {
      start: "8:0:0",
      end: "12:0:0"
    },
    "SEQ.4": {
      start: "12:0:0",
      end: "16:0:0"
    }
  },
  'enno-chunho': {
    "SEQ.1": {
      start: "0:0:0",
      end: "8:0:0"
    },
    "SEQ.2": {
      start: "8:0:0",
      end: "16:0:0"
    },
    "SEQ.3": {
      start: "16:0:0",
      end: "24:0:0"
    },
    "SEQ.4": {
      start: "24:0:0",
      end: "32:0:0"
    }
  },
  'l8ching': {
    "SEQ.1": {
      start: "0:0:0",
      end: "8:0:0"
    },
    "SEQ.2": {
      start: "8:0:0",
      end: "16:0:0"
    },
    "SEQ.3": {
      start: "16:0:0",
      end: "24:0:0"
    },
    "SEQ.4": {
      start: "24:0:0",
      end: "32:0:0"
    }
  },
  'sonia': {
    "SEQ.1": {
      start: "0:0:0",
      end: "8:0:0"
    },
    "SEQ.2": {
      start: "8:0:0",
      end: "16:0:0"
    },
    "SEQ.3": {
      start: "16:0:0",
      end: "24:0:0"
    },
    "SEQ.4": {
      start: "24:0:0",
      end: "32:0:0"
    }
  },
};

export const INSERT_EFFECTS = {
  pitchShift: {
    type: "insert",
    key: "pitchShift",
    label: "Pitch Shift",
    defaultPosition: 50,
    toneClass: Tone.PitchShift,
    defaultArguments: [],
    variables: [
      {
        variableKey: "pitch",
        min: -12,
        max: 12,
        step: 1,
        defaultValue: 0,
      },
    ],
  },
  filter: {
    type: "insert",
    key: "filter",
    label: "Filter",
    defaultPosition: 0,
    toneClass: Tone.Filter,
    defaultArguments: [5000, "lowpass", -24],
    variables: [
      {
        variableKey: "frequency",
        min: 5000,
        max: 200,
        step: -200,
        defaultValue: 5000,
      },
    ],
  },
  frequencyShifter: {
    type: "insert",
    key: "frequencyShifter",
    label: "Frequency Shifter",
    defaultPosition: 0,
    toneClass: Tone.FrequencyShifter,
    defaultArguments: [],
    variables: [
      {
        variableKey: "frequency",
        min: 0,
        max: 1000,
        step: 20,
        defaultValue: 0,
      },
    ],
  },
  distortion: {
    type: "insert",
    key: "distortion",
    label: "Distortion",
    defaultPosition: 0,
    toneClass: Tone.Distortion,
    defaultArguments: [0.5],
    variables: [
      {
        variableKey: "wet",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0,
      },
    ],
  },
  phaser: {
    type: "insert",
    key: "phaser",
    label: "Phaser",
    defaultPosition: 0,
    toneClass: Tone.Phaser,
    defaultArguments: [
      {
        octaves: 5,
        baseFrequency: 1000,
      },
    ], // Tone.Phaser accepts an object
    variables: [
      {
        variableKey: "frequency",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 0,
      },
    ],
  }
};

export const SEND_EFFECTS = {
  pingPongDelay: {
    type: "send",
    key: "pingPongDelay",
    label: "Ping Pong Delay",
    defaultPosition: 0,
    toneClass: Tone.PingPongDelay,
    defaultArguments: ["4n", 0.2], // delayTime, feedback
    variables: [],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60,
      },
    ],
  },
  tmcHall: {
    type: "send",
    key: "tmcHall",
    label: "TMC Hall",
    defaultPosition: 0,
    toneClass: Tone.Convolver,
    defaultArguments: ["/audio/Concert-Hall-Middle.wav"],
    variables: [],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60,
      },
    ],
  },
  tmcChamber: {
    type: "send",
    key: "tmcChamber",
    label: "TMC Chamber",
    defaultPosition: 0,
    toneClass: Tone.Convolver,
    defaultArguments: ["/audio/Live_House_A.wav"],
    variables: [],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60,
      },
    ],
  }
};