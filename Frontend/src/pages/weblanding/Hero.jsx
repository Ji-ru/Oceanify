import React from "react";
import { motion } from "framer-motion";
import videoWebm from "../../assets/video/videobg.webm";
import videoMp4 from "../../assets/video/videobg.mp4";
import Logo from "../../assets/images/oceanify.png";
import { Link, useNavigate } from "react-router-dom";

// Animation variants for cleaner code
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom ease for smoother motion
    },
  },
};

const Hero = () => {
  return (
    <section className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden text-gray-600 body-font sm:px-6 lg:px-8">
      {/* 🔹 Video Container */}
      <div className="relative w-full overflow-hidden shadow-2xl max-w-7xl rounded-3xl">
        <motion.video
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh]"
        >
          <source src={videoWebm} type="video/webm" />
          <source src={videoMp4} type="video/mp4" />
        </motion.video>

        {/* 🔹 Oceanify Gradient Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0 z-10 bg-gradient-to-br from-blue-900/70 via-teal-800/50 to-emerald-700/60 mix-blend-overlay"
        />

        {/* 🔹 Dark Overlay for Better Text Contrast */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute inset-0 z-10 bg-black/75"
        />

        {/* 🔹 Hero Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 py-16 text-center sm:px-8 sm:py-20 lg:px-12 lg:py-24"
        >
          {/* Logo */}
          <motion.img
            variants={itemVariants}
            src={Logo}
            alt="Logo"
            className="h-20 mb-8 sm:h-24 md:h-28 lg:h-32 drop-shadow-2xl"
          />

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg"
          >
            Stay Ahead of the Storm with{" "}
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text drop-shadow-lg">
              Oceanify
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="max-w-3xl mb-10 text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl lg:text-2xl drop-shadow-md"
          >
            Track ocean conditions in real time, including wind, waves, and
            storms, so seafarers can plan safer and more efficient routes.
          </motion.p>

          {/* Button */}
          <Link to="/sign-in">
            <motion.button
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 mb-4 text-white transition-all duration-300 bg-blue-600 shadow-lg rounded-2xl hover:bg-blue-700 hover:shadow-blue-500/70 hover:shadow-2xl"
            >
              Get Started
            </motion.button>
          </Link>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-sm text-gray-300 sm:text-base"
          >
            Built for seafarers. Powered by real-time data.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
