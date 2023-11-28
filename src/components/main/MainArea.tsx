import { VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/router";

import Menu from "@/components/main/Menu";
import Machine from "@/components/main/Machine";
import CustomizeMachine from "@/components/main/CustomizeMachine";

const MainArea = ({ isToneStarted }: { isToneStarted: boolean }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <VStack pos="relative">
      <Menu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {router.pathname !== "/cassettes/customize" && (
        <Machine isMenuOpen={isMenuOpen} isToneStarted={isToneStarted} />
      )}

      {router.pathname === "/cassettes/customize" && (
        <CustomizeMachine
          isMenuOpen={isMenuOpen}
          isToneStarted={isToneStarted}
        />
      )}
    </VStack>
  );
};

export default MainArea;
