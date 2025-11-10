/**
 * Wind Layer Utility with Integrated Canvas Wind Layer
 */

/**
 * Custom Canvas-based Wind Layer for Leaflet
 */
class CanvasWindLayer {
  constructor(options = {}) {
    this.options = {
      particleAge: 90,
      particleMultiplier: 1/120,
      maxVelocity: 15,
      velocityScale: 0.005,
      frameRate: 16,
      opacity: 0.8,
      ...options
    };
    
    this.particles = [];
    this.animationFrame = null;
    this.isAnimating = false;
  }

  onAdd(map) {
    this.map = map;
    this.canvas = L.DomUtil.create('canvas', 'leaflet-layer');
    
    // Add CSS class for styling
    this.canvas.className = 'wind-layer-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    const size = map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    
    // Make sure canvas is positioned correctly
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.pointerEvents = 'none';
    
    this.pane = map.getPane('overlayPane') || map.getPanes().overlayPane;
    this.pane.appendChild(this.canvas);
    
    map.on('moveend', this._resetCanvas, this);
    map.on('resize', this._resizeCanvas, this);
    map.on('move', this._resetCanvas, this);
    
    this._createParticles();
    this.start();
    
    return this;
  }

  onRemove(map) {
    this.stop();
    map.off('moveend', this._resetCanvas, this);
    map.off('resize', this._resizeCanvas, this);
    map.off('move', this._resetCanvas, this);
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    return this;
  }

  setData(windData) {
    console.log('Setting wind data:', windData);
    this.windData = windData;
    this._createParticles();
    return this;
  }

  _resizeCanvas = (e) => {
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this._createParticles();
  }

  _resetCanvas = () => {
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this._createParticles();
  }

  _createParticles() {
    this.particles = [];
    if (!this.map) return;
    
    const size = this.map.getSize();
    const particleCount = Math.floor(size.x * size.y * this.options.particleMultiplier);
    
    console.log(`Creating ${particleCount} particles`);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * size.x,
        y: Math.random() * size.y,
        age: Math.random() * this.options.particleAge,
        maxAge: this.options.particleAge
      });
    }
  }

  _getWindVector(x, y) {
    // If no wind data, return some default wind
    if (!this.windData || !this.windData.header) {
      return { u: 3, v: 1 }; // Default gentle wind
    }

    try {
      const header = this.windData.header;
      const data = this.windData.data;
      
      // Convert screen coordinates to lat/lng
      const point = this.map.containerPointToLatLng([x, y]);
      const lat = point.lat;
      const lng = point.lng;
      
      // Calculate grid position
      const gridX = Math.floor((lng - header.lo1) / header.dx);
      const gridY = Math.floor((header.la1 - lat) / header.dy);
      
      const totalPoints = header.nx * header.ny;
      
      // Boundary check
      if (gridX < 0 || gridX >= header.nx - 1 || gridY < 0 || gridY >= header.ny - 1) {
        return { u: 3, v: 1 };
      }
      
      // Get indices for the 4 surrounding points
      const idx = gridY * header.nx + gridX;
      
      // Safety check for array bounds
      if (idx >= data.length / 2 || idx < 0) {
        return { u: 3, v: 1 };
      }
      
      const u = data[idx] || 3;
      const v = data[idx + totalPoints] || 1;
      
      return { u, v };
    } catch (error) {
      console.warn('Error getting wind vector:', error);
      return { u: 3, v: 1 };
    }
  }

  _animate = () => {
    if (!this.map || !this.isAnimating) return;
    
    this._updateParticles();
    this._drawParticles();
    
    this.animationFrame = requestAnimationFrame(this._animate);
  }

  _updateParticles() {
    if (!this.map) return;
    
    const size = this.map.getSize();
    
    this.particles.forEach(particle => {
      // Get wind vector at particle position
      const wind = this._getWindVector(particle.x, particle.y);
      
      // Update particle position based on wind
      particle.x += wind.u * this.options.velocityScale * 15;
      particle.y += wind.v * this.options.velocityScale * 15;
      
      // Age particle
      particle.age++;
      
      // Reset particle if it goes off screen or gets too old
      if (particle.x < -10 || particle.x > size.x + 10 || 
          particle.y < -10 || particle.y > size.y + 10 || 
          particle.age > particle.maxAge) {
        particle.x = Math.random() * size.x;
        particle.y = Math.random() * size.y;
        particle.age = 0;
      }
    });
  }

  _drawParticles() {
    if (!this.ctx || !this.map) return;
    
    const ctx = this.ctx;
    const size = this.map.getSize();
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, size.x, size.y);
    
    // Set global alpha for fade effect
    ctx.globalAlpha = this.options.opacity;
    
    this.particles.forEach(particle => {
      const ageRatio = particle.age / particle.maxAge;
      
      // Calculate color based on age (blue to light blue)
      const intensity = Math.floor(200 * (1 - ageRatio)) + 55;
      const color = `rgb(100, ${intensity}, 255)`;
      
      // Get wind vector for direction
      const wind = this._getWindVector(particle.x, particle.y);
      const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
      
      // Draw particle as a directional line
      const angle = Math.atan2(wind.v, wind.u);
      const length = Math.min(6, speed * 0.8);
      
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(angle);
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      ctx.restore();
    });
    
    ctx.globalAlpha = 1.0;
  }

  start() {
    this.isAnimating = true;
    this._animate();
    console.log('Wind layer animation started');
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log('Wind layer animation stopped');
  }
}

/**
 * Fetch wind data for bounds
 */
export const fetchWindDataForBounds = async (map) => {
  if (!map) {
    console.error('No map provided');
    return null;
  }

  try {
    const bounds = map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    console.log('Fetching wind data for bounds:', { north, south, east, west });
    const windData = await fetchWindData(north, south, east, west);
    console.log('Wind data fetched successfully:', windData);
    return windData;
  } catch (error) {
    console.error('Error in fetchWindDataForBounds:', error);
    return null;
  }
};

/**
 * Fetch wind data efficiently with single API call
 */
export const fetchWindData = async (north, south, east, west) => {
  try {
    // Single API call for center point
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;

    console.log('Fetching from API for:', { centerLat, centerLon });
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${centerLat}&longitude=${centerLon}&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_gusts_10m`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API response not OK: ${response.status}`);

    const data = await response.json();
    console.log('API data received:', data);
    return convertToWindFormat(data, north, south, east, west);
  } catch (error) {
    console.error("Error fetching wind data:", error);
    // Return mock data as fallback
    return createMockWindData(north, south, east, west);
  }
};

/**
 * Create mock wind data as fallback
 */
const createMockWindData = (north, south, east, west) => {
  console.log('Creating mock wind data');
  const nx = 6;
  const ny = 6;

  const windData = {
    header: {
      lo1: west,
      la1: north,
      dx: (east - west) / (nx - 1),
      dy: (north - south) / (ny - 1),
      nx: nx,
      ny: ny,
      refTime: new Date().toISOString()
    },
    data: []
  };

  const uData = [];
  const vData = [];

  // Create visible wind patterns
  const baseSpeed = 10 + Math.random() * 10; // Stronger winds for visibility
  const baseDirection = 270 + (Math.random() * 90 - 45);

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      // Add some pattern to the wind
      const pattern = Math.sin(x * 0.8) * Math.cos(y * 0.8) * 3;
      const variation = 0.6 + Math.random() * 0.8 + pattern;
      const variedSpeed = baseSpeed * variation;

      const directionRad = (baseDirection * Math.PI) / 180;
      const u = -variedSpeed * Math.sin(directionRad);
      const v = -variedSpeed * Math.cos(directionRad);

      uData.push(u);
      vData.push(v);
    }
  }

  windData.data = [...uData, ...vData];
  console.log('Mock wind data created successfully');
  return windData;
};

/**
 * Convert to wind format
 */
const convertToWindFormat = (data, north, south, east, west) => {
  if (!data?.hourly) {
    console.log('No hourly data, using mock data');
    return createMockWindData(north, south, east, west);
  }

  console.log('Converting API data to wind format');
  const windSpeed = data.hourly.wind_speed_10m?.[0] || 10;
  const windDirection = data.hourly.wind_direction_10m?.[0] || 270;

  const nx = 6;
  const ny = 6;

  const windData = {
    header: {
      lo1: west,
      la1: north,
      dx: (east - west) / (nx - 1),
      dy: (north - south) / (ny - 1),
      nx: nx,
      ny: ny,
      refTime: new Date().toISOString()
    },
    data: []
  };

  const uData = [];
  const vData = [];

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      // Create realistic wind variations
      const turbulence = Math.sin(x * 1.2) * Math.cos(y * 1.2) * 2;
      const variation = 0.7 + Math.random() * 0.6 + turbulence;
      const variedSpeed = windSpeed * variation;

      const directionRad = (windDirection * Math.PI) / 180;
      const u = -variedSpeed * Math.sin(directionRad);
      const v = -variedSpeed * Math.cos(directionRad);

      uData.push(u);
      vData.push(v);
    }
  }

  windData.data = [...uData, ...vData];
  console.log('Wind data converted successfully');
  return windData;
};

/**
 * Initialize canvas wind layer
 */
export const initializeWindLayer = (windData) => {
  console.log('Initializing wind layer with data:', windData);
  
  if (!windData) {
    console.error('No wind data provided to initializeWindLayer');
    return null;
  }

  if (!windData.header || !windData.data) {
    console.error('Invalid wind data format - missing header or data');
    return null;
  }

  try {
    console.log('Creating CanvasWindLayer instance');
    const windLayer = new CanvasWindLayer({
      particleAge: 100,
      particleMultiplier: 1/60, // More particles for better visibility
      maxVelocity: 20,
      velocityScale: 0.01, // Faster movement
      frameRate: 60,
      opacity: 0.85
    });

    // Set the wind data
    windLayer.setData(windData);
    
    console.log('Wind layer initialized successfully');
    return windLayer;
  } catch (error) {
    console.error('Error in initializeWindLayer:', error);
    return null;
  }
};