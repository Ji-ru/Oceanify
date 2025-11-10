import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Screenshot1 from "../../assets/images/Screenshot1.png";
import Screenshot2 from "../../assets/images/Screenshot2.png";
import Screenshot3 from "../../assets/images/Screenshot3.png";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const Screenshot = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const screenshots = [
    { src: Screenshot1, alt: "screenshot1" },
    { src: Screenshot2, alt: "screenshot2" },
    { src: Screenshot3, alt: "screenshot3" },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const titleVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        delay: 0.1,
      },
    },
  };

  const openPopup = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closePopup = () => {
    setSelectedImage(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closePopup();
    }
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % screenshots.length;
    setSelectedImage(screenshots[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const prevImage = () => {
    const prevIndex =
      (currentIndex - 1 + screenshots.length) % screenshots.length;
    setSelectedImage(screenshots[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;

      if (e.key === "Escape") closePopup();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, currentIndex]);

  // Mark as animated when in view
  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <section ref={ref} className="px-5 py-24 font-sans">
      {/* Title with animation */}
      <motion.div
        className="mb-8 text-center"
        variants={titleVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.h2 className="mb-2 text-4xl font-bold text-white">
          Screenshots
        </motion.h2>
        <motion.p className="max-w-xl mx-auto text-base text-gray-400">
          Explore the interface and features through these visuals. Our app
          provides a seamless and intuitive experience for users.
        </motion.p>
      </motion.div>

      {/* Image Grid with animation */}
      <motion.div
        className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {screenshots.map((screenshot, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="overflow-hidden transition-all duration-300 transform rounded-lg cursor-pointer hover:scale-105"
            onClick={() => openPopup(screenshot, index)}
            whileHover={{
              scale: 1.05,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={screenshot.src}
              alt={screenshot.alt}
              className="object-cover w-full h-full"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Popup Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex items-center max-w-6xl mx-4"
          >
            {/* Close Button */}
            <motion.button
              onClick={closePopup}
              className="absolute z-10 p-2 text-white transition-colors duration-200 rounded-full right-4 top-4 hover:bg-white/20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation Buttons - Outside the image container */}
            {screenshots.length > 1 && (
              <>
                <motion.button
                  onClick={prevImage}
                  className="z-10 p-4 mr-4 text-white transition-colors duration-200 rounded-full "
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </motion.button>
              </>
            )}

            {/* Image Container */}
            <div className="relative max-w-4xl max-h-[90vh]">
              <div className="overflow-hidden rounded-lg">
                <motion.img
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="object-contain w-full h-full max-h-[80vh]"
                />
              </div>

              {/* Image Indicator */}
              <div className="flex justify-center mt-4 space-x-2">
                {screenshots.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      currentIndex === index ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons - Outside the image container */}
            {screenshots.length > 1 && (
              <>
                <motion.button
                  onClick={nextImage}
                  className="z-10 p-4 ml-4 text-white transition-colors duration-200 rounded-full "
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-8 h-8" />
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default Screenshot;
