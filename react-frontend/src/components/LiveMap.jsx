import { useEffect, useRef, useState } from 'react';

export default function LiveMap({ pickup, dropoff, driverLocation, studentLocation, showDriverLocation = false, showStudentLocation = false, isTracking = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const driverCircleRef = useRef(null);
  const studentMarkerRef = useRef(null);
  const studentCircleRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const watchIdRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default location (Colombo, Sri Lanka)
    const defaultLat = 6.9271;
    const defaultLng = 79.8612;

    // Create map
    const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add pickup and drop markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing markers
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
    }
    if (dropMarkerRef.current) {
      map.removeLayer(dropMarkerRef.current);
    }

    // Add pickup marker (only if not showing student location)
    if (pickup?.lat && pickup?.lng && !showStudentLocation) {
      const { lat, lng } = pickup;
      const pickupIcon = window.L.divIcon({
        html: '<div style="background: #3b82f6; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍 Pickup</div>',
        className: 'custom-marker',
        iconSize: [80, 40],
        iconAnchor: [40, 40]
      });
      pickupMarkerRef.current = window.L.marker([lat, lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup('<b>Pickup Location</b>');
    }

    // Add drop marker
    if (dropoff?.lat && dropoff?.lng) {
      const { lat, lng } = dropoff;
      const dropIcon = window.L.divIcon({
        html: '<div style="background: #10b981; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏁 Drop-off</div>',
        className: 'custom-marker',
        iconSize: [90, 40],
        iconAnchor: [45, 40]
      });
      dropMarkerRef.current = window.L.marker([lat, lng], { icon: dropIcon })
        .addTo(map)
        .bindPopup(`<b>Drop-off Location</b><br>${dropoff.address || ''}`);
    }

    // Fit bounds to show all markers
    const bounds = [];
    if (pickup?.lat && pickup?.lng && !showStudentLocation) {
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (dropoff?.lat && dropoff?.lng) {
      bounds.push([dropoff.lat, dropoff.lng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, dropoff, showStudentLocation]);

  // Update student location marker (for rider view - "Me")
  useEffect(() => {
    if (!mapInstanceRef.current || !showStudentLocation) {
      // Remove student marker if not showing
      if (studentMarkerRef.current) {
        mapInstanceRef.current.removeLayer(studentMarkerRef.current);
        studentMarkerRef.current = null;
      }
      if (studentCircleRef.current) {
        mapInstanceRef.current.removeLayer(studentCircleRef.current);
        studentCircleRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;

    // Add student marker if location is provided
    if (studentLocation?.lat && studentLocation?.lng) {
      const { lat, lng } = studentLocation;

      // Remove existing student marker
      if (studentMarkerRef.current) {
        map.removeLayer(studentMarkerRef.current);
      }
      if (studentCircleRef.current) {
        map.removeLayer(studentCircleRef.current);
      }

      // Create custom student icon
      const studentIcon = window.L.divIcon({
        html: '<div style="background: #8b5cf6; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">👤 Me</div>',
        className: 'custom-marker',
        iconSize: [70, 40],
        iconAnchor: [35, 40]
      });

      studentMarkerRef.current = window.L.marker([lat, lng], { icon: studentIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b><br>Live tracking active');

      studentCircleRef.current = window.L.circle([lat, lng], {
        radius: 50,
        color: '#8b5cf6',
        fillColor: '#a78bfa',
        fillOpacity: 0.2
      }).addTo(map);
    }
  }, [studentLocation, showStudentLocation]);

  // Update driver location marker (for rider view)
  useEffect(() => {
    if (!mapInstanceRef.current || !showDriverLocation) {
      // Remove driver marker if not showing
      if (driverMarkerRef.current) {
        mapInstanceRef.current.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      if (driverCircleRef.current) {
        mapInstanceRef.current.removeLayer(driverCircleRef.current);
        driverCircleRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;

    // Add driver marker if location is provided
    if (driverLocation?.lat && driverLocation?.lng) {
      const { lat, lng } = driverLocation;

      // Remove existing driver marker
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
      }
      if (driverCircleRef.current) {
        map.removeLayer(driverCircleRef.current);
      }

      // Create custom driver icon
      const driverIcon = window.L.divIcon({
        html: '<div style="background: #f59e0b; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white; animation: pulse 2s infinite;">🚗 Driver</div>',
        className: 'custom-marker',
        iconSize: [90, 40],
        iconAnchor: [45, 40]
      });

      driverMarkerRef.current = window.L.marker([lat, lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup('<b>Driver Location</b><br>Live tracking active');

      driverCircleRef.current = window.L.circle([lat, lng], {
        radius: 100,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.2
      }).addTo(map);

      // Fit bounds to show driver, student, and dropoff
      const bounds = [];
      if (driverLocation?.lat && driverLocation?.lng) {
        bounds.push([lat, lng]);
      }
      if (studentLocation?.lat && studentLocation?.lng) {
        bounds.push([studentLocation.lat, studentLocation.lng]);
      }
      if (dropoff?.lat && dropoff?.lng) {
        bounds.push([dropoff.lat, dropoff.lng]);
      }
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [driverLocation, showDriverLocation, studentLocation, dropoff]);

  // Live tracking for driver (when they're driving)
  useEffect(() => {
    if (!mapInstanceRef.current || !isTracking) {
      // Stop tracking if not active
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentPosition({ lat, lng });

        // Update or create driver marker
        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([lat, lng]);
          driverCircleRef.current.setLatLng([lat, lng]);
        } else {
          // Create custom driver icon
          const driverIcon = window.L.divIcon({
            html: '<div style="background: #f59e0b; color: white; padding: 8px 12px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">🚗 You</div>',
            className: 'custom-marker',
            iconSize: [70, 40],
            iconAnchor: [35, 40]
          });

          driverMarkerRef.current = window.L.marker([lat, lng], { icon: driverIcon })
            .addTo(map)
            .bindPopup('Your current location')
            .openPopup();

          driverCircleRef.current = window.L.circle([lat, lng], {
            radius: 50,
            color: '#f59e0b',
            fillColor: '#fbbf24',
            fillOpacity: 0.2
          }).addTo(map);
        }

        // Center map on current position
        map.setView([lat, lng], 15);
      },
      (error) => {
        console.error('Error getting location:', error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px', 
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />

      {/* Info overlay for tracking */}
      {(showDriverLocation || showStudentLocation) && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: '#10b981' }}>🔴 Live Tracking Active</strong>
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
            {showDriverLocation && <div>• Driver location</div>}
            {showStudentLocation && <div>• Your location</div>}
          </div>
        </div>
      )}

      {/* Info overlay for own tracking */}
      {isTracking && currentPosition && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: '#f59e0b' }}>🔴 Live Tracking Active</strong>
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Lat: {currentPosition.lat.toFixed(6)}</div>
            <div>Lng: {currentPosition.lng.toFixed(6)}</div>
          </div>
        </div>
      )}

      {/* Tracking status */}
      {!isTracking && !showDriverLocation && !showStudentLocation && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
          <strong>Waiting for ride to start</strong>
        </div>
      )}

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          50% {
            box-shadow: 0 2px 20px rgba(245, 158, 11, 0.6);
          }
        }
      `}</style>
    </div>
  );
}
