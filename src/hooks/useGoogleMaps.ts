// hooks/useGoogleMaps.ts
import { useEffect, useState } from "react";

// Singleton pattern for Google Maps loading
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private callbacks: (() => void)[] = [];

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async load(): Promise<void> {
    // Return immediately if already loaded
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Check if Google Maps is already available
    if (window.google && window.google.maps) {
      this.isLoaded = true;
      this.executeCallbacks();
      return Promise.resolve();
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    
    if (existingScript) {
      // Wait for existing script to load
      this.loadPromise = new Promise((resolve) => {
        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            this.isLoaded = true;
            this.isLoading = false;
            this.executeCallbacks();
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
      return this.loadPromise;
    }

    // Load the script
    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        this.isLoaded = true;
        this.isLoading = false;
        this.executeCallbacks();
        resolve();
      };
      script.onerror = () => {
        this.isLoading = false;
        this.loadPromise = null;
        console.error('Failed to load Google Maps API');
        reject(new Error('Failed to load Google Maps API'));
      };
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  public onLoad(callback: () => void): void {
    if (this.isLoaded) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  }

  private executeCallbacks(): void {
    this.callbacks.forEach(callback => callback());
    this.callbacks = [];
  }

  public get loaded(): boolean {
    return this.isLoaded;
  }
}

const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loader = GoogleMapsLoader.getInstance();
    
    if (loader.loaded) {
      setIsLoaded(true);
      return;
    }

    loader.onLoad(() => setIsLoaded(true));
    loader.load().catch(console.error);
  }, []);

  return isLoaded;
};

export default useGoogleMaps;