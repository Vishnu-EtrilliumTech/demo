"use client";

import styles from "./page.module.css";
import Image from "next/image";
import SearchComponent from "@/components/searchComponent";
import { Box } from "@mui/material";
import FilterSection from "./filters and layout/filterSection";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function Page() {
  const [searchResult, setSearchResult] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const preservedResults = sessionStorage.getItem("preservedSearchResults");
  const shouldScroll = searchParams.get("scrollToResults") === "true";

  useEffect(() => {
    if (!shouldScroll && searchResult.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchResult, shouldScroll]);

  useEffect(() => {
    if (preservedResults && searchParams.get("preserveResults")) {
      setSearchResult(JSON.parse(preservedResults));

      router.replace("/search");

      if (shouldScroll && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 1000);
      }
    }
  }, [searchParams, router, preservedResults, shouldScroll]);

  const hasResults = searchResult.length > 0;

  return (
    <>
      <section  style={{
          height: searchResult.length > 0
            ? "inherit"
            : "calc(100vh - 396px)",
        }}
        className={`${styles.searchHead} ${
          hasResults ? "pt-[3rem] pb-[1rem]" : "pt-[8%] pb-5"
        } flex items-center justify-center transition-all duration-300`}
      >
        <Box
          className={`flex flex-col items-center lg:items-start px-[2rem] sm:px-[10rem] relative w-full ${
            hasResults ? "pb-[2rem]" : "pb-[4rem] sm:pb-[8rem]"
          }`}
        >
          {!hasResults && (
            <Box className="w-full mb-6 lg:mb-[2rem] text-center lg:text-left">
              <h1 className="text-[32px] lg:text-[52px] font-medium">
                Search a trusted legal expert
              </h1>
            </Box>
          )}

          {!hasResults && (
            <Box
              sx={{
                position: "absolute",
                bottom: "93%",
                right: "15%",
                transform: "translateY(50%)",
                display: { xs: "none", lg: "block" },
              }}
            >
              <Image
                src="/search head Image.svg"
                alt="Character"
                width={250}
                height={250}
                className="w-auto h-auto"
              />
            </Box>
          )}
          <Box className={`w-full ${hasResults ? "mt-1" : ""}`}>
            <SearchComponent
              setSearchResult={setSearchResult}
              setIsSearching={setIsSearching}
            />
          </Box>
        </Box>
      </section>
      <div ref={resultsRef}>
        {searchResult.length > 0 && (
          <FilterSection
            searchResult={searchResult}
            isLoading={isSearching}
            onProfileNavigate={() => {
              sessionStorage.setItem(
                "preservedSearchResults",
                JSON.stringify(searchResult)
              );
            }}
          />
        )}
      </div>
    </>
  );
}
