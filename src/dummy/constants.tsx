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
};

export const INSERT_EFFECTS = {
  pitchShift: {
    toneClass: Tone.PitchShift,
    label: "Pitch Shift",
    variables: [
      {
        variableKey: "pitch",
        min: -12,
        max: 12,
        step: 1,
        defaultValue: 0
      }
    ]
  },
  filter: {
    toneClass: Tone.Filter,
    label: "Filter",
    defaultArguments: [5000, "lowpass", -24],
    variables: [
      {
        variableKey: "frequency",
        min: 200,
        max: 5000,
        step: 200,
        defaultValue: 5000
      }
    ]
  },
  frequencyShifter: {
    toneClass: Tone.FrequencyShifter,
    label: "Frequency Shifter",
    variables: [
      {
        variableKey: "frequency",
        min: 0,
        max: 1000,
        step: 20,
        defaultValue: 0
      }
    ]
  },
  distortion: {
    toneClass: Tone.Distortion,
    label: "Distortion",
    defaultArguments: [0.5],
    variables: [
      {
        variableKey: "wet",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0
      }
    ]
  },
  phaser: {
    toneClass: Tone.Phaser,
    label: "Phaser",
    variables: [
      {
        variableKey: "frequency",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 0
      },
      {
        variableKey: "octaves",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 5
      },
      {
        variableKey: "baseFrequency",
        min: 200,
        max: 2000,
        step: 200,
        defaultValue: 1000
      }
    ]
  }
};

export const SEND_EFFECTS = {
  pingPongDelay: {
    toneClass: Tone.PingPongDelay,
    label: "Ping Pong Delay",
    defaultArguments: ["4n", 0.2], // delayTime, feedback
    variables: [
      {
        variableKey: "feedback",
        min: 0,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.2
      }
    ],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60
      }
    ]
  },
  tmcHall: {
    toneClass: Tone.Convolver,
    label: "TMC Hall",
    defaultArguments: ["/audio/Concert-Hall-Middle.wav"],
    variables: [],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60
      }
    ]
  },
  tmcChamber: {
    toneClass: Tone.Convolver,
    label: "TMC Chamber",
    defaultArguments: ['/audio/Live_House_A.wav'],
    variables: [],
    channelVariables: [
      {
        variableKey: "volume",
        min: -60,
        max: 5,
        step: 5,
        defaultValue: -60
      }
    ]
  }
};