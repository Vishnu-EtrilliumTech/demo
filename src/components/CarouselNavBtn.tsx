import { useSwiper } from "swiper/react"
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Styles from './Carousel.module.css'
export const CarouselNavBtn = ()=>{
    const swiper = useSwiper()
    return(
        <div className={Styles.carouselButtons}>
        <button className={Styles.navButton} onClick={()=> swiper.slidePrev()}>
          <ArrowBackIcon />
        </button>
        <button className={Styles.navButton} onClick={()=> swiper.slideNext()}>
          <ArrowForwardIcon />
        </button>
      </div>
    )
}
