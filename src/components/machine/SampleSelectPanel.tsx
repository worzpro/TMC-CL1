import { Flex, Box, VStack, HStack, Image, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";

import cassettes from "@/dummy/cassettes";
import allSamples from "@/dummy/allSamples";

import SampleBtn from "@/components/machine/SampleBtn";

interface SampleSelectPanelProps {
  isMobile: boolean;
  curSample: any;
  setCurSample: Function;
  curSamples: any[];
  setCurSamples: Function;
  samplePlayers: any;
  playerRef: any;
}

const SampleSelectPanel = ({
  isMobile,
  curSample,
  setCurSample,
  curSamples,
  setCurSamples,
  samplePlayers,
  playerRef,
}: SampleSelectPanelProps) => {
  const cassetteArr = Object.values(cassettes);
  const [curCassetteId, setCurCassetteId] = useState(6);
  const cassetteObj = cassettes[curCassetteId];

  useEffect(() => {
    // 跳轉至當前sample所在的cassette
    if (cassetteObj.path !== curSample.artist) {
      const curSampleCassettedId =
        cassetteArr.find((cassette) => cassette.path === curSample.artist)
          ?.id || 6;
      setCurCassetteId(curSampleCassettedId);
    }
  }, []);

  return (
    <Flex
      direction="column"
      gap="8px"
      maxH="330px"
      overflow="auto"
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {/* cassette seletor */}
      <VStack>
        <Box
          w="100%"
          maxW="360px"
          overflow="auto"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          <HStack
            spacing="12px"
            transform={`translateX(calc(-162px * ${
              curCassetteId - 1
            } + 107px))`}
            transition="all 0.3s ease-out"
          >
            {Object.values(cassettes).map((cassette) => (
              <Image
                key={cassette.name}
                w="150px"
                src={cassette.imageSrc}
                alt={cassette.name}
                opacity={cassette.id === curCassetteId ? 1 : 0.5}
                transition="all 0.3s ease-out"
              />
            ))}
          </HStack>
        </Box>
        <HStack w="100%" justify="space-between" px="32px">
          <Image
            src="/images/music-list-left-right-arrow.svg"
            alt="LeftArrow"
            cursor="pointer"
            transform="scaleX(-1)"
            onClick={() => {
              if (curCassetteId === 1) {
                setCurCassetteId(6);
              } else {
                setCurCassetteId(curCassetteId - 1);
              }
            }}
          />
          <Text textStyle="en_special_lg_bold">{cassetteObj.name}</Text>
          <Image
            src="/images/music-list-left-right-arrow.svg"
            alt="RightArrow"
            cursor="pointer"
            transform="scaleX(1)"
            onClick={() => {
              if (curCassetteId === 6) {
                setCurCassetteId(1);
              } else {
                setCurCassetteId(curCassetteId + 1);
              }
            }}
          />
        </HStack>
      </VStack>

      {/* samples */}
      <Flex wrap="wrap" gap="4px">
        {allSamples
          .filter((sample: any) => sample.artist == cassetteObj.path)
          .map((sample, index) => {
            return (
              <SampleBtn
                key={sample.id}
                name={sample.name}
                index={index}
                isActive={sample.id === curSamples[curSample.index].id}
                isMobile={isMobile}
                onTouch={() => {
                  samplePlayers.current[sample.id]?.start();

                  setCurSample((prev: any) => ({
                    ...prev,
                    id: sample.id,
                    artist: sample.artist,
                  }));


                  let newCurSamples: any[] = [...curSamples];
                  newCurSamples[curSample.index] = sample;
                  setCurSamples(newCurSamples);
                  playerRef.current[curSample.index] = samplePlayers.current[sample.id];
                }}
              />
            );
          })}
      </Flex>
    </Flex>
  );
};

export default SampleSelectPanel;
