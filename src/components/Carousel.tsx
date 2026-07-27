"use client";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import Styles from "./Carousel.module.css";
import Image from "next/image";
import { CarouselNavBtn } from "./CarouselNavBtn";
import { Box, CircularProgress } from "@mui/material";

const Carousel = () => {
  const [loading, setLoading] = useState(false);
  const items = [
    { title: "Corporate Law", img: "/Criminal Lawyer.svg" },
    { title: "Family Law", img: "/Para Legal.svg" },
    { title: "Criminal Defense", img: "/Civil Lawyer.svg" },
    { title: "Real Estate Law", img: "/Criminal Lawyer.svg" },
    { title: "Employment Law", img: "/Para Legal.svg" },
    { title: "Intellectual Property", img: "/Civil Lawyer.svg" },
    { title: "Tax Law", img: "/Criminal Lawyer.svg" },
    { title: "Immigration Law", img: "/Para Legal.svg" },
    { title: "Civil Litigation", img: "/Civil Lawyer.svg" },
  ];

  useEffect(() => {
    setLoading(true);
  }, []);

  if (!loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height:'20vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <div className={Styles.carouselContainer}>
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={30}
        slidesPerView={4}
        loop={true}
        autoplay={{ delay: 2000 }}
        breakpoints={{
          320: {
            slidesPerView: 2,
            spaceBetween: 10,
          },
          640: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 4,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 40,
          },
        }}
        className="my-swiper"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index}>
            <div className={Styles.carouselItem}>
              <Image
                src={item.img}
                alt={item.title}
                className={Styles.itemImage}
                width={300}
                height={160}
              />
              <div className={Styles.overlay}>
                <h3>{item.title}</h3>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <CarouselNavBtn />
      </Swiper>
    </div>
  );
};

export default Carousel;
