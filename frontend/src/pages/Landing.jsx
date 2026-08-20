import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, Activity, Users, Calendar, CloudLightning, ArrowRight, ShieldAlert, Award, Globe, Menu, Server, Shield, HelpCircle } from 'lucide-react';

export default function Landing({ onNavigateToLogin, onNavigateToRegister }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)', 
      display: 'flex', 
      flexDirection: 'column',
      color: 'var(--text-primary)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* Self-contained 3D & Micro-Animation Style Sheet */}
      <style>{`
        .hero-3d-container {
          perspective: 1200px;
          position: relative;
        }
        .hero-3d-card {
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-style: preserve-3d;
        }
        .hero-3d-card:hover {
          transform: rotateX(6deg) rotateY(-6deg) translateZ(15px);
        }
        .feature-3d-card {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          perspective: 1000px;
          cursor: pointer;
        }
        .feature-3d-card:hover {
          transform: translateY(-8px) scale(1.02) rotateX(4deg) rotateY(4deg);
          box-shadow: 0 20px 40px rgba(239,35,60,0.12) !important;
          border-color: rgba(239, 35, 60, 0.25) !important;
        }
        .pulse-droplet {
          animation: dropletPulse 2s infinite alternate ease-in-out;
        }
        @keyframes dropletPulse {
          0% { transform: scale(1); filter: drop-shadow(0 4px 6px rgba(239,35,60,0.3)); }
          100% { transform: scale(1.08); filter: drop-shadow(0 12px 20px rgba(239,35,60,0.6)); }
        }
        .blood-cell-3d {
          position: absolute;
          background: radial-gradient(circle at 30% 30%, #ff4d5a 0%, #e63946 70%, #b30010 100%);
          border-radius: 50%;
          box-shadow: 
            inset -8px -8px 20px rgba(0,0,0,0.32), 
            inset 8px 8px 16px rgba(255,255,255,0.45),
            0 15px 35px rgba(230,57,70,0.2);
          filter: blur(1px);
          animation: floatAround3D 22s infinite ease-in-out;
          pointer-events: none;
          z-index: 1;
          opacity: 0.82;
        }
        
        .blood-cell-3d::after {
          content: '';
          position: absolute;
          top: 25%;
          left: 25%;
          width: 50%;
          height: 50%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 80%);
          box-shadow: inset 0 0 6px rgba(0,0,0,0.35);
        }

        @keyframes floatAround3D {
          0% { transform: translate(0, 0) rotate(0deg) scale(1) skew(0deg); }
          33% { transform: translate(60px, -40px) rotate(120deg) scale(1.06) skew(2deg); }
          66% { transform: translate(-30px, 80px) rotate(240deg) scale(0.94) skew(-2deg); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1) skew(0deg); }
        }

        .video-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Background Microscope Video loop fixed at the root level */}
      <div className="video-container">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.08
          }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-blood-cells-under-a-microscope-loop-33003-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Floating 3D Biconcave Red Blood Cell Canvas elements */}
      <div className="blood-cell-3d" style={{ top: '15%', left: '8%', width: '120px', height: '120px', animationDelay: '0s' }} />
      <div className="blood-cell-3d" style={{ top: '45%', right: '10%', width: '160px', height: '160px', animationDelay: '-5s', animationDuration: '25s' }} />
      <div className="blood-cell-3d" style={{ bottom: '25%', left: '12%', width: '90px', height: '90px', animationDelay: '-10s', animationDuration: '22s' }} />
      <div className="blood-cell-3d" style={{ top: '8%', right: '25%', width: '70px', height: '70px', animationDelay: '-3s', animationDuration: '18s' }} />
      <div className="blood-cell-3d" style={{ bottom: '8%', right: '15%', width: '110px', height: '110px', animationDelay: '-7s', animationDuration: '28s' }} />

      {/* Top Navbar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 5%', 
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 10,
        position: 'relative',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-droplet" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={28} color="var(--primary)" fill="var(--primary)" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Blood Bank Hub
          </span>
        </div>

        {/* Desktop Buttons */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={onNavigateToLogin}
              className="btn"
              style={{ 
                background: 'var(--bg-surface)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                padding: '8px 20px'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={onNavigateToRegister}
              className="btn btn-primary"
              style={{ 
                fontWeight: 600,
                padding: '8px 20px'
              }}
            >
              Join Registry
            </button>
          </div>
        )}

        {/* Mobile Burger Sandwich Icon */}
        {isMobile && (
          <button 
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              background: menuOpen ? 'rgba(239,35,60,0.1)' : 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: menuOpen ? '#ef233c' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 100
            }}
          >
            <Menu size={18} />
          </button>
        )}
      </header>

      {/* Mobile Menu Dropdown drawer */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '5%',
          right: '5%',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 99,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }} className="animate-fade-in">
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToLogin(); }}
            className="btn"
            style={{ 
              width: '100%',
              background: '#f4f5f8', 
              color: '#1a1a24', 
              border: '1px solid rgba(0,0,0,0.1)',
              fontWeight: 600,
              padding: '10px'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToRegister(); }}
            className="btn btn-primary"
            style={{ 
              width: '100%',
              fontWeight: 600,
              padding: '10px'
            }}
          >
            Join Registry
          </button>
        </div>
      )}
    </div>
  );
}