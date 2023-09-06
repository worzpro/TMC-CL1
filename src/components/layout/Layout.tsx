import { Center, Flex, Box, AspectRatio } from "@chakra-ui/react";
import { useState } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentVid, setCurrentVid] = useState(null);

  return (
    <Center bgColor="rgb(199, 199, 199)" h="100vh" w="100vw" pos="relative">
      {/* Main Content */}
      <Flex h="100%" gap="77px">
        {currentVid && (
          <Box
            w={{ base: "95%", md: "594px" }}
            h={{ base: "auto", md: "334px" }}
            pos={{ base: "absolute", md: "initial" }}
            top={{ base: "50%", md: "initial" }}
            left={{ base: "50%", md: "initial" }}
            transform={{ base: "translate(-50%, -50%)", md: "none" }}
            mt={{ base: "0", md: "30%" }}
          >
            <AspectRatio ratio={16 / 9} w="100%">
              <iframe src={currentVid} />
            </AspectRatio>
          </Box>
        )}
        <Box border="1px">{children}</Box>
      </Flex>

      {/* Sidebar: absolute */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setCurrentVid={setCurrentVid}
      />
    </Center>
  );
};

export default Layout;
