"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import TestimonialCard from "./TestimonialCard";
import { CarouselNavBtn } from "./CarouselNavBtn";


const TestimonialCarousel = () => {
  const data = [
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 1.svg",
      backgroundImage: "/testimonial1bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 2.svg",
      backgroundImage: "/testimonial2bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 3.svg",
      backgroundImage: "/testimonial3bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 1.svg",
      backgroundImage: "/testimonial1bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 2.svg",
      backgroundImage: "/testimonial2bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 3.svg",
      backgroundImage: "/testimonial3bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 1.svg",
      backgroundImage: "/testimonial1bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 2.svg",
      backgroundImage: "/testimonial2bg.svg",
    },
    {
      testimonial:
        "Finding the right legal expert felt overwhelming until I discovered this platform. Within minutes, I connected with a professional who truly understood my needs. The process was seamless, and the expertise I received was invaluable. Highly recommend!",
      name: "Vivekvardhan Reddy Yedulla",
      designation: "Consulted a Tax Lawyer",
      location: "Hyderabad",
      avatarUrl: "/testimonial 3.svg",
      backgroundImage: "/testimonial3bg.svg",
    },
  ];
  return (
    <Swiper
      modules={[Navigation]}
      slidesPerView={3}
      loop={true}
      breakpoints={{
        320: {
          slidesPerView: 1,
          spaceBetween: 10,
        },
        668: {
          slidesPerView: 2,
          spaceBetween: 30,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 40,
        },
        1440:{
            slidesPerView:4,
            spaceBetween:50
        }
      }}
    >
      {data.map((item, index) => (
        <SwiperSlide key={index}>
          <TestimonialCard
            name={item.name}
            designation={item.designation}
            location={item.location}
            avatarUrl={item.avatarUrl}
            backgroundImage={item.backgroundImage}
            testimonial={item.testimonial}
          />
        </SwiperSlide>
      ))}
      <CarouselNavBtn />
    </Swiper>
  );
};

export default TestimonialCarousel;
