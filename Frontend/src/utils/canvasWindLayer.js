/**
 * Custom Canvas-based Wind Layer for Leaflet
 * Provides better performance and control than leaflet-velocity
 */

export class CanvasWindLayer {
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
    this.ctx = this.canvas.getContext('2d');
    
    const size = map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    
    this.pane = map.getPane('overlayPane') || map.getPanes().overlayPane;
    this.pane.appendChild(this.canvas);
    
    map.on('moveend', this._resetCanvas, this);
    map.on('resize', this._resizeCanvas, this);
    
    this._createParticles();
    this._animate();
    
    return this;
  }

  onRemove(map) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    map.off('moveend', this._resetCanvas, this);
    map.off('resize', this._resizeCanvas, this);
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    return this;
  }

  setData(windData) {
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
    const bounds = this.map.getBounds();
    const size = this.map.getSize();
    
    const particleCount = Math.floor(size.x * size.y * this.options.particleMultiplier);
    
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
    if (!this.windData || !this.windData.header || !this.windData.data) {
      return { u: 2, v: 2 }; // Default wind
    }

    const header = this.windData.header;
    const data = this.windData.data;
    
    // Convert screen coordinates to lat/lng
    const point = this.map.containerPointToLatLng([x, y]);
    const lat = point.lat;
    const lng = point.lng;
    
    // Calculate grid position
    const gridX = Math.floor((lng - header.lo1) / header.dx);
    const gridY = Math.floor((header.la1 - lat) / header.dy);
    
    if (gridX < 0 || gridX >= header.nx - 1 || gridY < 0 || gridY >= header.ny - 1) {
      return { u: 2, v: 2 }; // Default wind for out-of-bounds
    }
    
    // Bilinear interpolation
    const idx = gridY * header.nx + gridX;
    const idx2 = (gridY + 1) * header.nx + gridX;
    
    const u1 = data[idx] || 2;
    const u2 = data[idx + 1] || 2;
    const u3 = data[idx2] || 2;
    const u4 = data[idx2 + 1] || 2;
    
    const v1 = data[idx + header.nx * header.ny] || 2;
    const v2 = data[idx + 1 + header.nx * header.ny] || 2;
    const v3 = data[idx2 + header.nx * header.ny] || 2;
    const v4 = data[idx2 + 1 + header.nx * header.ny] || 2;
    
    const xFrac = (lng - (header.lo1 + gridX * header.dx)) / header.dx;
    const yFrac = ((header.la1 - gridY * header.dy) - lat) / header.dy;
    
    const u = this._bilinearInterpolate(u1, u2, u3, u4, xFrac, yFrac);
    const v = this._bilinearInterpolate(v1, v2, v3, v4, xFrac, yFrac);
    
    return { u, v };
  }

  _bilinearInterpolate(q11, q12, q21, q22, x, y) {
    return q11 * (1 - x) * (1 - y) + 
           q21 * x * (1 - y) + 
           q12 * (1 - x) * y + 
           q22 * x * y;
  }

  _animate = () => {
    if (!this.map || !this.isAnimating) return;
    
    this._updateParticles();
    this._drawParticles();
    
    this.animationFrame = requestAnimationFrame(this._animate);
  }

  _updateParticles() {
    const size = this.map.getSize();
    
    this.particles.forEach(particle => {
      // Get wind vector at particle position
      const wind = this._getWindVector(particle.x, particle.y);
      
      // Update particle position based on wind
      particle.x += wind.u * this.options.velocityScale * 10;
      particle.y += wind.v * this.options.velocityScale * 10;
      
      // Age particle
      particle.age++;
      
      // Reset particle if it goes off screen or gets too old
      if (particle.x < 0 || particle.x > size.x || 
          particle.y < 0 || particle.y > size.y || 
          particle.age > particle.maxAge) {
        particle.x = Math.random() * size.x;
        particle.y = Math.random() * size.y;
        particle.age = 0;
      }
    });
  }

  _drawParticles() {
    const ctx = this.ctx;
    const size = this.map.getSize();
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, size.x, size.y);
    
    // Set global alpha for fade effect
    ctx.globalAlpha = this.options.opacity;
    
    this.particles.forEach(particle => {
      const ageRatio = particle.age / particle.maxAge;
      
      // Calculate color based on age (blue to white)
      const intensity = Math.floor(255 * (1 - ageRatio));
      const color = `rgb(${intensity}, ${intensity}, 255)`;
      
      ctx.fillStyle = color;
      
      // Get wind vector for direction indicator
      const wind = this._getWindVector(particle.x, particle.y);
      const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
      
      // Draw particle as a small line showing direction
      const angle = Math.atan2(wind.v, wind.u);
      const length = Math.min(4, speed * 0.5);
      
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(angle);
      
      // Draw directional line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw dot at head
      ctx.beginPath();
      ctx.arc(length, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
    
    ctx.globalAlpha = 1.0;
  }

  start() {
    this.isAnimating = true;
    this._animate();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}