import { useEffect, useState } from "react";
import { type UnsplashRandomImageJSON } from "@/types/Unsplash";
import { api } from "@/utils/api";

export const useUnsplashImage = () => {
  const { data: img } = api.unsplash.getRandomImage.useQuery({
    topics: "nature",
    orientation: "landscape",
  });

  return {
    img,
    isLoading: !img,
  };
};
