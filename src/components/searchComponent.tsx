/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import { autocomplete } from "@/lib/google";
import { PlaceAutocompleteResult } from "@googlemaps/google-maps-services-js";
import debounce from "lodash.debounce";
import apiClient from "@/services/httpServices";
import { GoogleMap } from "@react-google-maps/api";
import useGoogleMaps from "@/hooks/useGoogleMaps";
import { useSearchParams } from "next/navigation";

interface ExpertType {
  id: number;
  expertType: string;
}

interface SearchResult {
  id: number;
  fullName: string;
  address: string;
  expertType: string;
  portfolios: string[];
  gender: string;
  photoBinary: string;
  customerRating: number;
  yearsOfExperience: number;
  consultationFeesRs: number;
  availableOnline: boolean;
  availableInPerson: boolean;
  meetingDurationMins: number;
}

interface SearchComponentProps {
  setSearchResult: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  setSearchResult,
  setIsSearching,
}) => {
  const [predictions, setPredictions] = useState<PlaceAutocompleteResult[]>([]);
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState("");
  const [searchText, setSearchText] = useState("");
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [isSearching, setIsSearchingState] = useState(false);
  const [expertTypes, setExpertTypes] = useState<ExpertType[]>([]);
  const [searchType, setSearchType] = useState<"type" | "name">("type");
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const [hasSelectedPrediction, setHasSelectedPrediction] = useState(false);
  const [domainMenuOpen, setDomainMenuOpen] = useState(false);
  const [searchTypeMenuOpen, setSearchTypeMenuOpen] = useState(false);
  const apiUrl = `/api/v1/legalexperts/search/basic`;
  const isLoaded = useGoogleMaps();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const domainSelectRef = useRef<HTMLDivElement>(null);
  const searchTypeSelectRef = useRef<HTMLDivElement>(null);
  const searchTextFieldRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const shouldScroll = searchParams.get("scrollToResults") === "true";
  const formatAddress = (result: google.maps.GeocoderResult) => {
    const addressComponents = result.address_components;
    let locality = "";
    let city = "";
    let state = "";
    let country = "";

    addressComponents.forEach((component) => {
      if (
        component.types.includes("sublocality") ||
        component.types.includes("locality")
      ) {
        locality = component.long_name;
      }
      if (component.types.includes("administrative_area_level_2")) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (component.types.includes("country")) {
        country = component.long_name;
      }
    });

    const cleanAddress = [locality, city, state, country]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    return cleanAddress || result.formatted_address;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setInput("Geolocation not supported");
      setIsGettingLocation(false);
      return;
    }

    setInput("Detecting your location...");
    setIsGettingLocation(true);
    setIsCurrentLocation(true);
    setHasSelectedPrediction(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                const address = formatAddress(results[0]);
                setInput(address);
                setSelectedPrediction({
                  description: address,
                  place_id: results[0].place_id,
                });
              } else {
                setInput("Couldn't determine your address");
              }
              setIsGettingLocation(false);
              if (!shouldScroll) {
                setTimeout(() => {
                  setDomainMenuOpen(true);
                }, 100);
              }
            }
          );
        } catch (error) {
          console.error("Error getting address from coordinates:", error);
          setInput("Couldn't get address for your location");
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setInput("Please enable location access or enter manually");
        setIsGettingLocation(false);
        setIsCurrentLocation(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (isLoaded) {
      getCurrentLocation();
    }
  }, [isLoaded]);

  const fetchPredictions = async (input: string) => {
    if (isCurrentLocation) {
      setPredictions([]);
      return;
    }

    if (input) {
      const prediction = await autocomplete(input, {
        components: ["country:in"],
        types: ["(cities)"],
      });
      setPredictions(prediction || []);
    } else {
      setPredictions([]);
    }
  };

  const debouncedFetchPredictions = useCallback(
    debounce(fetchPredictions, 300),
    [isCurrentLocation]
  );

  useEffect(() => {
    if (!isGettingLocation && !isCurrentLocation) {
      debouncedFetchPredictions(input);
    }
  }, [input, debouncedFetchPredictions, isGettingLocation, isCurrentLocation]);

  const handleListItemClick = (prediction: PlaceAutocompleteResult) => {
    setIsGettingLocation(true);
    setIsCurrentLocation(false);
    setHasSelectedPrediction(true);
    setInput("Getting location details...");

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const address = formatAddress(results[0]);
        setInput(address);
        setSelectedPrediction({
          description: address,
          place_id: prediction.place_id,
        });
      } else {
        setInput(prediction.description);
        setSelectedPrediction(prediction);
      }
      setIsGettingLocation(false);
      setTimeout(() => {
        setDomainMenuOpen(true);
      }, 100);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setIsCurrentLocation(false);
    setHasSelectedPrediction(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setPredictions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchExpertTypes = async () => {
      try {
        const response = await apiClient.get<{ data: ExpertType[] }>(
          "/api/v1/legalexperts/types"
        );
        const filteredData = response?.data?.data.map(({ id, expertType }) => ({
          id,
          expertType,
        }));
        setExpertTypes(filteredData);
      } catch (error) {
        console.error("Error fetching expert types:", error);
      }
    };

    fetchExpertTypes();
  }, []);

  const handleSearch = async () => {
    if (!input || !domain || !searchText || !selectedPrediction) return;

    setIsSearchingState(true);
    setIsSearching(true);
    setNoMatchFound(false);

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      { placeId: selectedPrediction.place_id },
      async (results, status) => {
        console.log(results);
        if (status === "OK" && results && results[0]) {
          const { geometry, address_components } = results[0];

          let pincode = "";
          let district = "";
          let locality = "";

          address_components.forEach((component) => {
            if (component.types.includes("postal_code")) {
              pincode = component.long_name;
            }
            if (component.types.includes("administrative_area_level_3")) {
              district = component.long_name;
            }
            if (
              component.types.includes("sublocality") ||
              component.types.includes("locality")
            ) {
              locality = component.long_name;
            } else {
              locality = "";
            }
          });

          const selectedExpert = domain;
          const payload = {
            location: {
              pincode: pincode,
              district: district,
              locality: locality,
              geometry: {
                type: "Point",
                coordinates: [geometry.location.lng(), geometry.location.lat()],
                proximityInMeters: 0,
              },
            },
            legalExpert: {
              expertTypeId: selectedExpert,
              portfolios: searchType === "type" ? [searchText] : [],
              name: searchType === "name" ? searchText : "",
            },
          };

          try {
            const response = await apiClient.post(apiUrl, payload, {
              headers: { "Content-Type": "application/json" },
            });

            if (response.data.data && response.data.data.length > 0) {
              setSearchResult(response.data.data);
              setNoMatchFound(false);
            } else {
              setSearchResult([]);
              setNoMatchFound(true);
            }
          } catch (error: any) {
            if (error.response && error.response.status === 404) {
              setSearchResult([]);
              setNoMatchFound(true);
            } else {
              console.error("API Error:", error);
            }
          } finally {
            setIsSearchingState(false);
            setIsSearching(false);
          }
        }
      }
    );
  };

  return (
    <>
      <Box
        ref={wrapperRef}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "flex-start", lg: "center" },
          gap: { xs: 2, sm: 2 },
          backgroundColor: "white",
          borderRadius: { xs: "30px", lg: "50px" },
          boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
          padding: { xs: "16px", lg: "8px 16px" },
          maxWidth: "1800px",
          width: "100%",
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            width: { xs: "100%", lg: "auto" },
          }}
        >
          <TextField
            placeholder="Location"
            value={input}
            onChange={handleInputChange}
            fullWidth
            InputProps={{
              autoComplete: "off",
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn />
                </InputAdornment>
              ),
              endAdornment: isGettingLocation && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
              sx: { color: "#626262", border: "none", width: "300px" },
            }}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
          {predictions.length > 0 &&
            !hasSelectedPrediction &&
            input.trim() !== predictions[0]?.description && (
              <List
                sx={{
                  marginTop: "64px",
                  position: "absolute",
                  zIndex: 1,
                  backgroundColor: "white",
                  width: "300px",
                  borderRadius: "16px",
                  boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
                }}
              >
                <ListItem
                  component="button"
                  onClick={() => {
                    setPredictions([]);
                    getCurrentLocation();
                  }}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                    fontWeight: 500,
                    color: "#1976d2",
                  }}
                >
                  <LocationOn sx={{ mr: 1, color: "#1976d2" }} />
                  <ListItemText primary="Use Current Location" />
                </ListItem>
                <Divider sx={{ my: 1 }} />

                {predictions.map((prediction, index) => (
                  <ListItem
                    component="button"
                    key={index}
                    onClick={() => handleListItemClick(prediction)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    <ListItemText primary={prediction.description} />
                  </ListItem>
                ))}
              </List>
            )}
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", lg: "block" } }}
        />
        <Divider
          orientation="horizontal"
          flexItem
          sx={{ display: { xs: "block", lg: "none" } }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            width: { xs: "100%", lg: "auto" },
          }}
        >
          <Select
            ref={domainSelectRef}
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setDomainMenuOpen(false);
              setTimeout(() => {
                setSearchTypeMenuOpen(true);
              }, 100);
            }}
            onOpen={() => setDomainMenuOpen(true)}
            onClose={() => setDomainMenuOpen(false)}
            open={domainMenuOpen}
            variant="outlined"
            size="small"
            fullWidth
            displayEmpty
            MenuProps={{
              anchorOrigin: {
              vertical: "bottom",
              horizontal: "left",
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "left",
            },
            PaperProps: {
              sx: {
                mt: "25px",
                borderRadius: "16px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#ffff",
                color: "#626262",
              },
            },
          }}
            sx={{
              borderRadius: "50px",
              color: "#626262",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="" disabled sx={{ display: "none" }}>
              By Domain
            </MenuItem>
            {expertTypes.map(({ id, expertType }) => (
              <MenuItem key={id} value={id}>
                {expertType}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", lg: "block" } }}
        />
        <Divider
          orientation="horizontal"
          flexItem
          sx={{ display: { xs: "block", lg: "none" } }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            width: { xs: "100%", lg: "auto" },
          }}
        >
          <Select
            ref={searchTypeSelectRef}
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value as "type" | "name");
              setSearchTypeMenuOpen(false);
              // Focus on the search text field after a small delay
              setTimeout(() => {
                if (searchTextFieldRef.current) {
                  searchTextFieldRef.current.focus();
                }
              }, 100);
            }}
            onOpen={() => setSearchTypeMenuOpen(true)}
            onClose={() => setSearchTypeMenuOpen(false)}
            open={searchTypeMenuOpen}
            defaultValue="type"
            variant="outlined"
            size="small"
            fullWidth
            MenuProps={{
              anchorOrigin: {
              vertical: "bottom",
              horizontal: "left",
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "left",
            },
            PaperProps: {
              sx: {
                mt: "25px",
                borderRadius: "16px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#ffff",
                color: "#626262",
              },
            },
          }}
            sx={{
              borderRadius: "50px",
              color: "#626262",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="type">By Expert Type</MenuItem>
            <MenuItem value="name">By Name</MenuItem>
          </Select>
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", lg: "block" } }}
        />
        <Divider
          orientation="horizontal"
          flexItem
          sx={{ display: { xs: "block", lg: "none" } }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 3,
            width: { xs: "100%", lg: "auto" },
          }}
        >
          <TextField
            inputRef={searchTextFieldRef}
            placeholder="E.g Criminal Lawyer, Auditor, Civil Lawyer etc..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus={shouldScroll === false && searchTypeMenuOpen === false && domainMenuOpen === false}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                input &&
                domain &&
                searchText &&
                !isGettingLocation
              ) {
                handleSearch();
              }
            }}
            size="small"
            fullWidth
            InputProps={{
              sx: { color: "#626262", border: "none" },
            }}
            sx={{
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
        </Box>

        <Divider
          orientation="horizontal"
          flexItem
          sx={{ display: { xs: "block", lg: "none" } }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "center",
            width: { xs: "100%", lg: "auto" },
          }}
        >
          <Button
            variant="contained"
            disabled={!input || !domain || !searchText || isGettingLocation}
            onClick={handleSearch}
            fullWidth
            sx={{
              width: "108px",
              height: "45px",
              borderRadius: "50px",
              textTransform: "none",
              padding: "8px 24px",
              backgroundColor: "#EA4234",
              fontSize: "14px",
              fontWeight: "medium",
              "&:disabled": {
                backgroundColor: "#f5f5f5",
                color: "#bdbdbd",
              },
            }}
          >
            {isSearching ? (
              <CircularProgress size={24} style={{ color: "white" }} />
            ) : (
              "SEARCH"
            )}
          </Button>
        </Box>
      </Box>

      {noMatchFound && (
        <Box
          sx={{
            mt: 3,
            textAlign: "center",
            backgroundColor: "#fff8e1",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h6" color="textSecondary">
            No experts found matching your search criteria
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Try adjusting your search parameters or broadening your location
          </Typography>
        </Box>
      )}

      {isLoaded && (
        <div style={{ display: "none" }}>
          <GoogleMap
            mapContainerStyle={{
              width: "100%",
              height: "300px",
              borderRadius: "20px",
            }}
          ></GoogleMap>
        </div>
      )}
    </>
  );
};

export default SearchComponent;
