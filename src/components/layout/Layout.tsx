import {
  Center,
  Flex,
  Box,
  AspectRatio,
  Image,
  Link,
  Hide,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { CloseIcon } from "@chakra-ui/icons";

import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentVid, setCurrentVid] = useState("");
  const [showQRcode, setShowQRcode] = useState(true);

  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <Center bgColor="rgb(199, 199, 199)" h="100vh" w="100vw" pos="relative">
      {/* Main Content */}
      <Flex h="100%" maxH="100vh" overflow="hidden" gap="77px">
        {currentVid && (
          <>
            <Box
              display={{ base: "block", md: "none" }}
              pos="absolute"
              zIndex="8998"
              top="0"
              left="0"
              w="100vw"
              h="100vh"
              bgColor="rgba(0, 0, 0, 0.5)"
            />
            <Box
              w={{ base: "95%", md: "594px" }}
              h={{ base: "auto", md: "334px" }}
              pos={{ base: "absolute", md: "initial" }}
              top={{ base: "50%", md: "initial" }}
              left={{ base: "50%", md: "initial" }}
              transform={{ base: "translate(-50%, -50%)", md: "none" }}
              mt={{ base: "0", md: "30%" }}
              zIndex="8999"
            >
              <Box pos="relative">
                <AspectRatio ratio={16 / 9} w="100%">
                  <iframe src={currentVid} />
                </AspectRatio>
                <Center
                  w="25px"
                  h="25px"
                  pos="absolute"
                  top="-10px"
                  right="-10px"
                  rounded="50%"
                  bgColor="white"
                  cursor="pointer"
                  onClick={() => setCurrentVid("")}
                >
                  <CloseIcon fontSize="12px" />
                </Center>
              </Box>
            </Box>
          </>
        )}
        <Box w="calc(100vw - 10px)" maxW={{ base: "365px", sm: "418px" }}>
          {children}
        </Box>
      </Flex>

      {/* Sidebar: absolute */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setCurrentVid={setCurrentVid}
      />

      {/* Link: absolute */}
      <Link
        pos="absolute"
        top="20px"
        right="20px"
        href="https://www.tmccloud.taipei/announcements"
        isExternal
      >
        <Image w="90px" src="/images/link.png" alt="北流雲" />
      </Link>

      {/* QRcode: absolute */}
      <Hide below="lg">
        {showQRcode && (
          <Box pos="absolute" bottom="20px" right="20px">
            <Box pos="relative">
              <Box
                pos="absolute"
                top="0"
                right="0"
                w="25px"
                h="25px"
                cursor="pointer"
                onClick={() => setShowQRcode(!showQRcode)}
              />
              <Image w="160px" src="/images/qrcode.png" alt="qrcode" />
            </Box>
          </Box>
        )}
      </Hide>
    </Center>
  );
};

export default Layout;
