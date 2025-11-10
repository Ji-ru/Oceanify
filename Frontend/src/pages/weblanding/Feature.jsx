import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
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

  const numberVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const features = [
    {
      number: 1,
      title: "Real-Time Marine Weather",
      description:
        "Get up-to-date marine weather info including wind, temperature, storms, and pressure, so you can plan trips safely and efficiently.",
    },
    {
      number: 2,
      title: "Interactive Map View",
      description:
        "Explore weather overlays on an interactive map, filter by wind, waves, storms, temperature, or pressure, and visualize current conditions.",
    },
    {
      number: 3,
      title: "Pinned Locations",
      description:
        "Save and monitor weather data for specific coordinates, ports, or areas of interest.",
    },
    {
      number: 4,
      title: "Emergency Alert System",
      description:
        "Instantly send GPS coordinates and critical info during emergencies for fast response.",
    },
    {
      number: 5,
      title: "Admin Dashboard",
      description:
        "Full admin dashboard to manage users, monitor alerts, oversee weather conditions, and configure settings efficiently.",
    },
    {
      number: 6,
      title: "Secure Authentication",
      description:
        "Built with Supabase for secure authentication, protecting sensitive data and providing a safe login experience.",
    },
  ];

  return (
    <section ref={ref} className="text-gray-600">
      <div className="px-5 py-16 mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.number}
              variants={itemVariants}
              className="flex flex-col p-4 mb-4 transition-colors duration-300 rounded-lg hover:bg-white/5"
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
            >
              <div className="flex items-start mb-1">
                <motion.div
                  className="flex items-center justify-center w-6 h-6 mr-2 text-white bg-blue-600 rounded-full flex-shrink-0 mt-0.5"
                  variants={numberVariants}
                >
                  {feature.number}
                </motion.div>
                <motion.h4
                  className="text-sm font-medium leading-tight text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={
                    isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }
                  }
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  {feature.title}
                </motion.h4>
              </div>
              <motion.p
                className="ml-8 text-sm text-gray-400"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: index * 0.1 + 0.7 }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="flex items-center justify-center pb-20">
        {/* Button */}
        <Link to="/sign-in">
          <motion.button
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 mb-4 text-white transition-all duration-300 bg-blue-600 shadow-lg rounded-2xl hover:bg-blue-700 hover:shadow-blue-500/70 hover:shadow-2xl w-[400px]"
          >
            Get Started
          </motion.button>
        </Link>
      </div>
    </section>
  );
}

export default Features;
