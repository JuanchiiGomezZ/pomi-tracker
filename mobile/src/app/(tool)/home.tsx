import React from "react";
import { ScreenWrapper, Text } from "@/shared/components/ui";

const HomeScreen = () => {
  return (
    <ScreenWrapper centered={{ y: true, x: true }}>
      <Text variant="h1">Home</Text>
    </ScreenWrapper>
  );
};

export default HomeScreen;
