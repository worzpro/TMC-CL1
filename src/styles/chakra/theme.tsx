import { extendTheme } from "@chakra-ui/react";

import textStyles from "./textStyles";
import colors from "./colors";

const theme = extendTheme({
  textStyles,
  colors,

  styles: {
    global: {
      body: {
        backgroundColor: "white",
        margin: 0,
        padding: 0,
      },
    },
  },

  fonts: {
    heading: `'Poppins','Source Han', -apple-system, sans-serif`,
    body: `'Poppins', 'Source Han', -apple-system, sans-serif`,
  },

  shadows: {
    main: "0px 0px 50px rgba(0, 0, 0, 0.05)",
  },
  radii: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },
  breakpoints: {
    xs: "320px",
    sm: "768px",
    md: "991px",
    lg: "1200px",
    xl: "1300px",
    "2xl": "1536px",
  },
  components: {},
});

export default theme;
