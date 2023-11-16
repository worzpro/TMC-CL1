import { Input, HStack, Image, Box } from "@chakra-ui/react";
import { useState, useCallback, useEffect, use } from "react";

const Bpm = ({ onChange }: { onChange: (value: number) => void }) => {
  const [value, setValue] = useState(120);
  const [isDraggable, setIsDraggable] = useState<boolean>(false);

  const startDrag = useCallback(
    (event: any) => {
      if (!isDraggable) return;
      event.preventDefault();
      const initialY =
        event.type === "mousedown"
          ? (event as React.MouseEvent).pageY
          : (event as React.TouchEvent).touches[0].pageY;
      const startValue = value;

      const dragging = (moveEvent: MouseEvent | TouchEvent) => {
        const currentY =
          moveEvent instanceof MouseEvent
            ? moveEvent.pageY
            : moveEvent.touches[0].pageY;
        const diff = Math.round((initialY - currentY) / 10);
        let newValue = startValue + diff;
        newValue = Math.max(30, Math.min(newValue, 300));
        setValue(newValue);
      };

      const stopDrag = () => {
        document.removeEventListener("mousemove", dragging);
        document.removeEventListener("touchmove", dragging);
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("touchend", stopDrag);
      };

      document.addEventListener("mousemove", dragging);
      document.addEventListener("touchmove", dragging);
      document.addEventListener("mouseup", stopDrag);
      document.addEventListener("touchend", stopDrag);
    },
    [value, isDraggable]
  );

  useEffect(() => {
    onChange(value);
  }, [value]);

  return (
    <>
      <Box
        onClick={() => setIsDraggable(!isDraggable)}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        cursor={isDraggable ? "ns-resize" : "pointer"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="26"
          viewBox="0 0 56 26"
        >
          <g
            id="Group_4041"
            data-name="Group 4041"
            transform="translate(-228 -345)"
          >
            <g
              id="Rectangle_1610"
              data-name="Rectangle 1610"
              transform="translate(228 345)"
              fill={isDraggable ? "#e1b46a" : "#8A989F"}
              stroke={isDraggable ? "#896c3d" : "#000"}
              strokeWidth="2"
            >
              <rect width="56" height="26" rx="13" stroke="none"></rect>
              <rect
                x="1"
                y="1"
                width="54"
                height="24"
                rx="12"
                fill="none"
              ></rect>
            </g>
            <text
              id="_190"
              data-name="190"
              transform="translate(256 362.5)"
              fill={isDraggable ? "#896c3d" : "rgb(197, 218, 227)"}
              fontSize="12"
              fontFamily="LoRes12OT-BoldAltOakland, 'LoRes \31 2 OT Alt Oakland'"
              fontWeight="700"
            >
              <tspan x="-9" y="-1">
                {value}
              </tspan>
            </text>
            {isDraggable && (
              <>
                <g
                  id="Group_4113"
                  data-name="Group 4113"
                  transform="translate(1 118)"
                >
                  <rect
                    id="Rectangle_1629"
                    data-name="Rectangle 1629"
                    width="3"
                    height="7"
                    transform="translate(270 237)"
                    fill="#896c3d"
                  ></rect>
                  <rect
                    id="Rectangle_1630"
                    data-name="Rectangle 1630"
                    width="3"
                    height="3"
                    transform="translate(273 239)"
                    fill="#896c3d"
                  ></rect>
                </g>
                <g
                  id="Group_4114"
                  data-name="Group 4114"
                  transform="translate(235 355)"
                >
                  <rect
                    id="Rectangle_1629-2"
                    data-name="Rectangle 1629"
                    width="3"
                    height="7"
                    transform="translate(3)"
                    fill="#896c3d"
                  ></rect>
                  <rect
                    id="Rectangle_1630-2"
                    data-name="Rectangle 1630"
                    width="3"
                    height="3"
                    transform="translate(0 2)"
                    fill="#896c3d"
                  ></rect>
                </g>
              </>
            )}
          </g>
        </svg>
      </Box>

      {/* <HStack
      border={isDraggable ? "3px solid #896C42" : "3px solid black"}
      bgColor={isDraggable ? "#E0B472" : "#8A989F"}
      rounded="20px"
      w="56px"
      h="26px"
      justify="center"
      spacing="2px"
      cursor={isDraggable ? "ns-resize" : "pointer"}
    >
      {isDraggable && <Image src="/images/screen-arrow.svg" alt="left" />}
      <Input
        w="25px"
        textAlign="center"
        fontSize="12px"
        fontWeight="600"
        variant="unstyled"
        type="number"
        value={value}
        color={isDraggable ? "#896C42" : "rgb(197, 218, 227)"}
        onClick={() => setIsDraggable(!isDraggable)}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        cursor={isDraggable ? "ns-resize" : "pointer"}
        readOnly
      />
      {isDraggable && (
        <Image
          src="/images/screen-arrow.svg"
          alt="right"
          transform="rotate(180deg)"
        />
      )}
    </HStack> */}
    </>
  );
};

export default Bpm;
