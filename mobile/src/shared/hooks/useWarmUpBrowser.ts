import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';

export function useWarmUpBrowser() {
  useEffect(() => {
    // Warm up the browser to improve OAuth performance
    // This prevents a noticeable delay when opening the OAuth popup
    WebBrowser.warmUpAsync();

    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);
}
