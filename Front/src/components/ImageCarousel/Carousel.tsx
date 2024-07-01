import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FaLongArrowAltLeft, FaLongArrowAltRight } from 'react-icons/fa';
import './carousel.scss';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: true,
  });

  return (
    <div className="carousel-container" {...swipeHandlers}>
      <div className="carousel">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            className={`carousel-image ${index === currentIndex ? 'active' : ''}`}
            alt={`Slide ${index + 1}`}
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button className="prev-button" onClick={handlePrev}>
            <FaLongArrowAltLeft style={{ fontSize: '2rem' }} />
          </button>
          <button className="next-button" onClick={handleNext}>
            <FaLongArrowAltRight style={{ fontSize: '2rem' }} />
          </button>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
