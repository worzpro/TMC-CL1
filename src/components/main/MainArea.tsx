import { VStack } from "@chakra-ui/react";
import { useState } from "react";

import Menu from "@/components/main/Menu";
import Machine from "@/components/main/Machine";

const MainArea = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <VStack w="400px" pos="relative">
      <Menu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Machine isMenuOpen={isMenuOpen} />
    </VStack>
  );
};

export default MainArea;
