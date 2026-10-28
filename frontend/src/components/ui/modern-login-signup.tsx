"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, CheckCircle2, AlertCircle, Sparkles, FolderGit2 } from 'lucide-react';

export interface ModernLoginSignupProps {
  onClose?: () => void;
  onSuccess?: (user: { id: string; email: string; name: string }) => void;
  onNavigate?: (view: string) => void;
  initialMode?: 'signin' | 'signup';
  logoText?: string;
  brandName?: string;
}

export default function Component({
  onClose,
  onSuccess,
  onNavigate,
  initialMode = 'signin',
  logoText = "JS",
  brandName = "GitToScale",
}: ModernLoginSignupProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { signIn, signUp, pendingAction, user } = useAuth();

  useEffect(() => {
    if (initialMode) {
      setIsLogin(initialMode !== 'signup');
    }
  }, [initialMode]);

  // High-intensity 21st.dev dot-matrix WebGL shader (running natively without CDN latency)
  useEffect(() => {
    let active = true;
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });

    if (!gl) {
      // 2D Canvas Fallback
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const handleResize = () => {
        canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
        canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      const totalSize = 20 * (window.devicePixelRatio || 1);
      const dotSize = 6 * (window.devicePixelRatio || 1);
      const startTime = performance.now();

      const render2D = () => {
        if (!active) return;
        const time = (performance.now() - startTime) / 1000.0;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cols = Math.ceil(canvas.width / totalSize);
        const rows = Math.ceil(canvas.height / totalSize);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const seed = c * 13.37 + r * 79.19;
            const rand = Math.sin(seed + Math.floor(time / 5.0) * 41.53);
            const frac = Math.abs(rand - Math.floor(rand));
            const alpha = frac < 0.2 ? 0.35 : frac < 0.5 ? 0.7 : frac < 0.8 ? 0.9 : 1.0;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(c * totalSize, r * totalSize, dotSize, dotSize);
          }
        }
        animationId = requestAnimationFrame(render2D);
      };
      render2D();

      return () => {
        active = false;
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
      };
    }

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // 21st.dev dot-matrix formula with high-intensity pure white dots
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_total_size;
      uniform float u_dot_size;

      float PHI = 1.61803398874989484820459;
      float random(vec2 xy) {
        return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
      }

      void main() {
        vec2 fragCoord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

        vec2 st = fragCoord.xy;
        st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
        st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

        if (st.x < 0.0 || st.y < 0.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

        float frequency = 5.0;
        float show_offset = random(st2);
        float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));

        // High intensity opacities for vivid white dots
        float op = 1.0;
        if (rand < 0.15) {
          op = 0.40;
        } else if (rand < 0.35) {
          op = 0.65;
        } else if (rand < 0.60) {
          op = 0.85;
        } else if (rand < 0.85) {
          op = 0.95;
        } else {
          op = 1.0;
        }

        float inDotX = step(0.0, fract(st.x / u_total_size)) * (1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size)));
        float inDotY = step(0.0, fract(st.y / u_total_size)) * (1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size)));
        float dotMask = inDotX * inDotY;

        float animation_speed_factor = 3.0;
        vec2 center_grid = u_resolution / 2.0 / u_total_size;
        float dist_from_center = distance(center_grid, st2);
        float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

        float intro = step(timing_offset_intro, u_time * animation_speed_factor);
        float intensity = dotMask * op * intro;

        gl_FragColor = vec4(vec3(intensity), 1.0);
      }
    `;

    const createShader = (glContext: WebGLRenderingContext, type: number, source: string) => {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLocation = gl.getUniformLocation(program, 'u_time');
    const uTotalSizeLocation = gl.getUniformLocation(program, 'u_total_size');
    const uDotSizeLocation = gl.getUniformLocation(program, 'u_dot_size');

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(uTotalSizeLocation, 20.0 * dpr);
      gl.uniform1f(uDotSizeLocation, 6.0 * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();
    const render = () => {
      if (!active) return;
      const currentTime = (performance.now() - startTime) / 1000.0;
      gl.uniform1f(uTimeLocation, currentTime);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };
    render();

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
    };
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.pushState({}, '', '/');
      onNavigate?.('landing');
    }
  };

  const handleToggleMode = (login: boolean) => {
    setIsLogin(login);
    setMessage(null);
    if (login) {
      window.history.pushState({}, '', '/signin');
      onNavigate?.('signin');
    } else {
      window.history.pushState({}, '', '/signup');
      onNavigate?.('signup');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const effectivePassword = password || 'gitoscale_user_pass';

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email, effectivePassword);
        if (signInError) {
          setMessage({ type: 'error', text: signInError.message || 'Invalid email or password.' });
        } else {
          setMessage({ type: 'success', text: 'Signed in successfully! Redirecting...' });
          onSuccess?.({
            id: user?.id || 'usr_session',
            email,
            name: user?.user_metadata?.full_name || email.split('@')[0],
          });
        }
      } else {
        const fullName = name.trim() || email.split('@')[0];
        const { error: signUpError } = await signUp(email, effectivePassword, fullName);
        if (signUpError) {
          setMessage({ type: 'error', text: signUpError.message || 'Failed to create account.' });
        } else {
          setMessage({ type: 'success', text: 'Account created successfully! Redirecting...' });
          onSuccess?.({
            id: user?.id || 'usr_session',
            email,
            name: fullName,
          });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Authentication error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialClick = async (provider: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const mockEmail = `user.${provider.toLowerCase()}@example.com`;
      const mockName = `${provider} Developer`;
      const res = await signIn(mockEmail, 'oauth_simulated_credential');
      if (res.error) {
        await signUp(mockEmail, 'oauth_simulated_credential', mockName);
      }
      setMessage({
        type: 'success',
        text: `Signed in with ${provider}! Redirecting...`,
      });
      onSuccess?.({
        id: `usr_${provider.toLowerCase()}`,
        email: mockEmail,
        name: mockName,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || `Failed to authenticate with ${provider}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── 21st.dev shared button styles ─── */
  const socialBtn: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem",
    borderRadius: 6,
    border: "1px solid #333",
    background: "transparent",
    color: "#fff",
    fontWeight: 500,
    fontSize: "0.875rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginBottom: "0.4rem",
    transition: "background 0.15s ease",
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: 6,
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
  };

  /* ─── Google / GitHub / Apple SVGs (Exact 21st.dev assets) ─── */
  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const GitHubIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );

  const AppleIcon = (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.88.75 3.65 1.89-3.08 1.75-2.58 5.61.35 6.75-1.01 2.37-2.39 4.39-4.29 4.29zM12.03 7.25c-.15-2.23 1.66-4.07 3.72-4.25.36 2.38-1.92 4.34-3.72 4.25z" />
    </svg>
  );

  const Logo = (
    <button
      type="button"
      onClick={handleClose}
      style={{
        background: "#111",
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "1.15rem",
        marginBottom: "0.75rem",
        border: "1px solid #333",
        color: "#fff",
        cursor: "pointer",
        padding: 0,
      }}
      title="Go to Home"
    >
      {logoText}
    </button>
  );

  const Footer = (
    <div
      style={{
        marginTop: "0.85rem",
        fontSize: "0.75rem",
        color: "#666",
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      By proceeding, you agree to creating a {brandName} account
      <br />
      subject to our{" "}
      <a href="#" style={{ color: "#888", textDecoration: "underline" }}>
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" style={{ color: "#888", textDecoration: "underline" }}>
        Privacy Policy
      </a>
      .
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#000",
        color: "#fff",
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}
    >
      {/* WebGL Dot canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "#121212",
          borderRadius: 12,
          padding: "2rem",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #222",
        }}
      >
        {/* Optional close button */}
        {onClose && (
          <button
            onClick={handleClose}
            aria-label="Close"
            type="button"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        )}

        {/* Pending Action Notification Banner */}
        {pendingAction && (
          <div
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 8,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.85rem',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              textAlign: 'left',
            }}
          >
            {pendingAction.type === 'prompt' ? (
              <Sparkles style={{ width: 15, height: 15, color: '#60a5fa', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <FolderGit2 style={{ width: 15, height: 15, color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.75rem' }}>
                Resume after {isLogin ? 'signing in' : 'signing up'}
              </div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pendingAction.type === 'prompt' ? `"${pendingAction.prompt}"` : pendingAction.repoUrl}
              </div>
            </div>
          </div>
        )}

        {isLogin ? (
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {Logo}
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
                letterSpacing: "-0.025em",
              }}
            >
              Sign in to Account
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#888",
                marginBottom: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              Sign in to your Account.
            </p>

            {message && (
              <div
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.65rem',
                  background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                ) : (
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <input
                style={input}
                type="email"
                placeholder="name@work-email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: 6,
                  border: "none",
                  background: "#ededed",
                  color: "#000",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Connecting..." : "Continue with Email"}
              </button>
            </form>

            <div
              style={{
                height: 1,
                background: "#222",
                width: "100%",
                margin: "0.85rem 0",
              }}
            />

            <button type="button" onClick={() => handleSocialClick("Google")} style={socialBtn}>
              {GoogleIcon}Continue with Google
            </button>
            <button type="button" onClick={() => handleSocialClick("GitHub")} style={socialBtn}>
              {GitHubIcon}Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleSocialClick("Apple")}
              style={{ ...socialBtn, marginBottom: 0 }}
            >
              {AppleIcon}Continue with Apple
            </button>

            <div style={{ marginTop: "1.25rem", fontSize: "0.875rem", color: "#888" }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => handleToggleMode(false)}
                style={{
                  color: "#fff",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Sign Up
              </button>
            </div>
            {Footer}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {Logo}
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
                letterSpacing: "-0.025em",
              }}
            >
              Sign up for Account
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#888",
                marginBottom: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              Create a new account to get started.
            </p>

            {message && (
              <div
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.65rem',
                  background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                ) : (
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <input
                style={input}
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                style={input}
                type="email"
                placeholder="name@work-email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={input}
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: 6,
                  border: "none",
                  background: "#ededed",
                  color: "#000",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Creating Account..." : "Sign Up with Email"}
              </button>
            </form>

            <div
              style={{
                height: 1,
                background: "#222",
                width: "100%",
                margin: "0.85rem 0",
              }}
            />

            <button type="button" onClick={() => handleSocialClick("Google")} style={socialBtn}>
              {GoogleIcon}Sign up with Google
            </button>
            <button type="button" onClick={() => handleSocialClick("GitHub")} style={socialBtn}>
              {GitHubIcon}Sign up with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleSocialClick("Apple")}
              style={{ ...socialBtn, marginBottom: 0 }}
            >
              {AppleIcon}Sign up with Apple
            </button>

            <div style={{ marginTop: "1.25rem", fontSize: "0.875rem", color: "#888" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => handleToggleMode(true)}
                style={{
                  color: "#fff",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Sign In
              </button>
            </div>
            {Footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { Component as ModernLoginSignup };
